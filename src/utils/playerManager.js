import { PlayerLayout } from '../components/PlayerLayout.js';

/**
 * Plays the current track in the active player queue for a guild.
 * @param {import('discord.js').Client} client 
 * @param {string} guildId 
 * @param {import('discord.js').TextChannel} channel 
 */
export async function playTrack(client, guildId, channel) {
  const player = client.activePlayers?.get(guildId);
  if (!player) return;

  // Clear existing timeout if any was set as fallback
  if (player.timeoutId) {
    clearTimeout(player.timeoutId);
    player.timeoutId = null;
  }

  // Get track
  const track = player.playlist.tracks[player.currentIndex];
  player.currentTrack = track;

  // Add to history
  if (!player.history) {
    player.history = [];
  }
  if (player.history.length === 0 || player.history[player.history.length - 1].uri !== track.uri) {
    player.history.push(track);
    if (player.history.length > 50) {
      player.history.shift();
    }
  }

  // Track currently playing in memory cache for pl-add
  if (!client.currentTracks) {
    client.currentTracks = new Map();
  }
  client.currentTracks.set(guildId, track);

  const payload = PlayerLayout.playingCard(track, player.requester, player);

  try {
    if (!player.message) {
      // Send new message
      const msg = await channel.send(payload);
      player.message = msg;
    } else {
      // Edit existing message
      await player.message.edit(payload);
    }
  } catch (error) {
    console.error(`[Hikari Player] Error rendering playing message for guild ${guildId}:`, error);
  }

  // Find all connected nodes and determine the healthiest node
  const connectedNodes = Array.from(client.shoukaku.nodes.values()).filter(n => n.state === 1); // 1 = CONNECTED
  if (connectedNodes.length === 0) {
    console.error("[Hikari Player] No connected Lavalink nodes found.");
    return channel.send({ content: `❌ No available Lavalink nodes are connected right now.` }).catch(console.error);
  }

  // Sort connected nodes by score (lowest score is best)
  connectedNodes.sort((a, b) => {
    const statsA = a.stats || { cpu: { systemLoad: 0.5 }, players: 0 };
    const statsB = b.stats || { cpu: { systemLoad: 0.5 }, players: 0 };

    const cpuA = statsA.cpu?.systemLoad || 0.5;
    const cpuB = statsB.cpu?.systemLoad || 0.5;

    const playersA = statsA.players || 0;
    const playersB = statsB.players || 0;

    const pingA = a.ping !== Infinity && !isNaN(a.ping) ? a.ping : 300;
    const pingB = b.ping !== Infinity && !isNaN(b.ping) ? b.ping : 300;

    // score = CPU load (0-100) + active players + (ping / 10)
    const scoreA = (cpuA * 100) + playersA + (pingA / 10);
    const scoreB = (cpuB * 100) + playersB + (pingB / 10);

    return scoreA - scoreB;
  });

  const bestNode = connectedNodes[0];
  console.log(`[Hikari Player] Healthy node selected: "${bestNode.name}" (ping: ${bestNode.ping}ms)`);

  // 1. Get or join voice channel using Shoukaku
  let shoukakuPlayer = player.shoukakuPlayer;
  if (!shoukakuPlayer) {
    try {
      const guild = client.guilds.cache.get(guildId);
      shoukakuPlayer = await client.shoukaku.joinVoiceChannel({
        guildId: guildId,
        channelId: player.voiceChannelId,
        shardId: guild?.shardId || 0,
        deaf: true,
        nodeName: bestNode.name // Create player on the healthiest node!
      });
      player.shoukakuPlayer = shoukakuPlayer;

      // Bind Shoukaku event handlers
      shoukakuPlayer.on('end', (data) => {
        if (data.reason === 'replaced') return;
        handleTrackEnd(client, guildId, channel);
      });

      shoukakuPlayer.on('stuck', (data) => {
        console.warn(`[Shoukaku Player] Track got stuck in guild ${guildId}:`, data);
        skipTrack(client, guildId, channel);
      });

      shoukakuPlayer.on('exception', (err) => {
        console.error(`[Shoukaku Player] Exception in guild ${guildId}:`, err);
      });

      shoukakuPlayer.on('error', (err) => {
        console.error(`[Shoukaku Player] Error in guild ${guildId}:`, err);
      });

    } catch (err) {
      console.error(`[Hikari Player] Failed to join voice channel ${player.voiceChannelId}:`, err);
      return channel.send({ content: `❌ Failed to join your voice channel.` }).catch(console.error);
    }
  } else {
    // Dynamic load balancing migration: if player is already active, move it to the healthiest node if performance degrades
    if (shoukakuPlayer.node.name !== bestNode.name) {
      console.log(`[Hikari Player] Moving player from "${shoukakuPlayer.node.name}" to healthier node "${bestNode.name}"`);
      await shoukakuPlayer.move(bestNode.name).catch(err => {
        console.error(`[Hikari Player] Failed to move player to node "${bestNode.name}":`, err);
      });
    }
  }

  // Set initial player volume if volume differs from default (100)
  if (player.volume !== 100) {
    await shoukakuPlayer.setGlobalVolume(player.volume).catch(err => console.error(err));
  }

  // 2. Resolve Track from Lavalink Node and Play
  try {
    let resolveQuery = track.uri;
    if (!resolveQuery || resolveQuery.includes('mock') || !resolveQuery.startsWith('http')) {
      const artistQuery = (track.artist && track.artist !== 'Unknown Artist' && track.artist !== 'Faheem Abdullah, Rauhan Malik, Amir Ameer') ? ` ${track.artist}` : '';
      resolveQuery = `ytmsearch:${track.title}${artistQuery}`;
    }

    let encodedTrack = null;
    let selectedNodeName = null;

    // Try resolving on the connected nodes in order of health/score to handle node rate-limits
    for (const node of connectedNodes) {
      try {
        console.log(`[Hikari Player] Attempting track resolution on node "${node.name}"`);
        const result = await node.rest.resolve(resolveQuery);
        if (result) {
          if (result.loadType === 'track') {
            encodedTrack = result.data.encoded;
          } else if (result.loadType === 'search' && result.data && result.data.length > 0) {
            encodedTrack = result.data[0].encoded;
          } else if (result.loadType === 'playlist' && result.data && result.data.tracks && result.data.tracks.length > 0) {
            encodedTrack = result.data.tracks[0].encoded;
          }
        }
        if (encodedTrack) {
          selectedNodeName = node.name;
          break; // Successfully resolved!
        }
      } catch (err) {
        console.warn(`[Hikari Player] Resolution failed on node "${node.name}":`, err.message);
      }
    }

    // Fallback: If we couldn't resolve, try search by title and artist on all nodes
    if (!encodedTrack) {
      const artistQuery = (track.artist && track.artist !== 'Unknown Artist' && track.artist !== 'Faheem Abdullah, Rauhan Malik, Amir Ameer') ? ` ${track.artist}` : '';
      const fallbackQuery = `ytmsearch:${track.title}${artistQuery}`;
      for (const node of connectedNodes) {
        try {
          console.log(`[Hikari Player] Attempting fallback track resolution on node "${node.name}"`);
          const result = await node.rest.resolve(fallbackQuery);
          if (result) {
            if (result.loadType === 'search' && result.data && result.data.length > 0) {
              encodedTrack = result.data[0].encoded;
            } else if (result.loadType === 'track') {
              encodedTrack = result.data.encoded;
            }
          }
          if (encodedTrack) {
            selectedNodeName = node.name;
            break;
          }
        } catch (err) {
          console.warn(`[Hikari Player] Fallback resolution failed on node "${node.name}":`, err.message);
        }
      }
    }

    if (encodedTrack) {
      await shoukakuPlayer.playTrack({ track: { encoded: encodedTrack } });
      console.log(`[Hikari Player] Playing real audio for "${track.title}" in guild ${guildId} resolved via "${selectedNodeName}"`);
    } else {
      console.warn(`[Hikari Player] Could not resolve audio for "${track.title}". Skipping to next track in 5 seconds...`);
      channel.send({ content: `⚠️ Could not resolve audio for **${track.title}**. Skipping track...` }).catch(console.error);
      player.timeoutId = setTimeout(() => {
        handleTrackEnd(client, guildId, channel);
      }, 5000);
    }
  } catch (err) {
    console.error(`[Hikari Player] Error during audio resolution/playback:`, err);
    player.timeoutId = setTimeout(() => {
      handleTrackEnd(client, guildId, channel);
    }, 5000);
  }
}

/**
 * Handles playback end event.
 * @param {import('discord.js').Client} client 
 * @param {string} guildId 
 * @param {import('discord.js').TextChannel} channel 
 */
async function handleTrackEnd(client, guildId, channel) {
  const player = client.activePlayers?.get(guildId);
  if (!player) return;

  // Loop Mode handling
  if (player.loopMode === 'track') {
    // Replay current track
    playTrack(client, guildId, channel);
  } else if (player.loopMode === 'queue') {
    // Go to next track, wrapping around to the first track if we reached the end
    player.currentIndex = (player.currentIndex + 1) % player.playlist.tracks.length;
    playTrack(client, guildId, channel);
  } else {
    // Check next track
    if (player.currentIndex + 1 < player.playlist.tracks.length) {
      player.currentIndex += 1;
      playTrack(client, guildId, channel);
    } else if (player.autoplay && player.currentTrack) {
      // Autoplay handler
      try {
        const lastTrack = player.currentTrack;
        const query = `${lastTrack.title} ${lastTrack.artist || ''}`;
        const { resolveTracks } = await import('./lavalink.js');
        const tracks = await resolveTracks(query);
        const nextTrack = tracks.find(t => t.title.toLowerCase() !== lastTrack.title.toLowerCase() && t.uri !== lastTrack.uri) || tracks[1] || tracks[0];

        if (nextTrack) {
          player.playlist.tracks.push(nextTrack);
          player.currentIndex += 1;
          channel.send({ content: `📻 **Autoplay** queued: **${nextTrack.title}**` }).catch(() => null);
          playTrack(client, guildId, channel);
        } else {
          endQueue(client, guildId, player);
        }
      } catch (err) {
        console.error('[Autoplay Error]', err);
        endQueue(client, guildId, player);
      }
    } else {
      endQueue(client, guildId, player);
    }
  }
}

async function endQueue(client, guildId, player) {
  try {
    const payload = PlayerLayout.queueEndedCard(player.currentTrack, player.requester);
    await player.message.edit(payload);
  } catch (err) {
    console.error('[Hikari Player] Error updating ended queue:', err);
  }

  // Leave Voice Channel and clean up Shoukaku
  try {
    client.shoukaku.leaveVoiceChannel(guildId);
  } catch (err) {
    console.error('[Hikari Player] Error leaving voice channel on queue end:', err);
  }

  client.activePlayers.delete(guildId);
}

/**
 * Skips the active track for a guild.
 * @param {import('discord.js').Client} client 
 * @param {string} guildId 
 * @param {import('discord.js').TextChannel} channel 
 */
export async function skipTrack(client, guildId, channel) {
  const player = client.activePlayers?.get(guildId);
  if (!player) return;

  if (player.timeoutId) {
    clearTimeout(player.timeoutId);
    player.timeoutId = null;
  }

  if (player.currentIndex + 1 < player.playlist.tracks.length) {
    player.currentIndex += 1;
    await playTrack(client, guildId, channel);
  } else {
    // End Queue
    try {
      const payload = PlayerLayout.queueEndedCard(player.currentTrack, player.requester);
      await player.message.edit(payload);
    } catch (err) {
      console.error('[Hikari Player] Error updating ended queue on skip:', err);
    }

    try {
      client.shoukaku.leaveVoiceChannel(guildId);
    } catch (err) {
      console.error('[Hikari Player] Error leaving voice channel on skip end:', err);
    }

    client.activePlayers.delete(guildId);
  }
}

/**
 * Stops playback and clears the active player for a guild.
 * @param {import('discord.js').Client} client 
 * @param {string} guildId 
 */
export async function stopTrack(client, guildId) {
  const player = client.activePlayers?.get(guildId);
  if (!player) return;

  if (player.timeoutId) {
    clearTimeout(player.timeoutId);
    player.timeoutId = null;
  }

  try {
    const payload = PlayerLayout.queueEndedCard(player.currentTrack, player.requester);
    await player.message.edit(payload);
  } catch (err) {
    console.error('[Hikari Player] Error updating ended queue on stop:', err);
  }

  try {
    client.shoukaku.leaveVoiceChannel(guildId);
  } catch (err) {
    console.error('[Hikari Player] Error leaving voice channel on stop:', err);
  }

  client.activePlayers.delete(guildId);
}

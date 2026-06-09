import UserPreferences from '../models/UserPreferences.js';
import { resolveTracks } from '../utils/lavalink.js';
import { playTrack } from '../utils/playerManager.js';
import { EnqueueLayout } from '../components/EnqueueLayout.js';
import { PrefixLayout } from '../components/PrefixLayout.js';
import { checkVoiceChannel } from '../components/VoiceWarningLayout.js';
import { EMOJIS } from '../emojis.js';

export default {
  name: 'play',
  aliases: ['p', 'hplay'],
  description: 'Plays a song or playlist from search or link.',

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    if (!focusedValue || focusedValue.length < 2) {
      return interaction.respond([]);
    }

    const isUrl = /^https?:\/\//.test(focusedValue);
    if (isUrl) {
      return interaction.respond([]);
    }

    try {
      const userPref = await UserPreferences.findOne({ userId: interaction.user.id });
      const engine = userPref?.musicSource || 'ytmsearch';
      const tracks = await resolveTracks(focusedValue, engine);

      const choices = tracks.slice(0, 25).map(track => {
        const title = track.title.substring(0, 75);
        const artist = track.artist.substring(0, 20);
        const val = track.uri.length > 100 ? track.uri.substring(0, 100) : track.uri;
        return {
          name: `${title} - ${artist}`,
          value: val
        };
      });

      await interaction.respond(choices).catch(() => {});
    } catch (e) {
      console.error(e);
      await interaction.respond([]).catch(() => {});
    }
  },

  async executeSlash(interaction) {
    try {
      const client = interaction.client;
      const query = interaction.options.getString('song')?.trim();

      if (!query) {
        const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', '**Please provide a search query or link.**');
        return interaction.reply({ ...card, ephemeral: true });
      }

      const connected = await checkVoiceChannel(interaction);
      if (!connected) return;

      await interaction.deferReply();

      const userPref = await UserPreferences.findOne({ userId: interaction.user.id });
      const engine = userPref?.musicSource || 'ytmsearch';

      const tracks = await resolveTracks(query, engine);
      if (tracks.length === 0) {
        const card = PrefixLayout.messageCard('❌', `**No results found for "${query}"**`);
        return interaction.editReply(card);
      }

      let player = client.activePlayers?.get(interaction.guildId);
      const isNewPlayer = !player;

      if (isNewPlayer) {
        const voiceChannel = interaction.member.voice.channel;
        const connectedNodes = Array.from(client.shoukaku.nodes.values()).filter(n => n.state === 1);
        if (connectedNodes.length === 0) {
          const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', '**No available Lavalink nodes are connected right now.**');
          return interaction.editReply(card);
        }

        connectedNodes.sort((a, b) => {
          const statsA = a.stats || { cpu: { systemLoad: 0.5 }, players: 0 };
          const statsB = b.stats || { cpu: { systemLoad: 0.5 }, players: 0 };
          return ((statsA.cpu.systemLoad * 100) + statsA.players + (a.ping / 10)) - 
                 ((statsB.cpu.systemLoad * 100) + statsB.players + (b.ping / 10));
        });
        const bestNode = connectedNodes[0];

        const shoukakuPlayer = await client.shoukaku.joinVoiceChannel({
          guildId: interaction.guildId,
          channelId: voiceChannel.id,
          shardId: interaction.guild?.shardId || 0,
          deaf: true,
          nodeName: bestNode.name
        });

        player = {
          guildId: interaction.guildId,
          voiceChannelId: voiceChannel.id,
          textChannelId: interaction.channel.id,
          playlist: { name: 'Queue', tracks: [] },
          currentIndex: 0,
          currentTrack: null,
          isPaused: false,
          volume: 100,
          autoplay: false,
          liked: false,
          loopMode: 'off',
          playPrevious: false,
          message: null,
          requester: interaction.user,
          timeoutId: null,
          shoukakuPlayer: shoukakuPlayer
        };
        client.activePlayers = client.activePlayers || new Map();
        client.activePlayers.set(interaction.guildId, player);
      } else {
        if (player.voiceChannelId !== interaction.member.voice.channelId) {
          const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', '**You must be in the same voice channel as the bot.**');
          return interaction.editReply(card);
        }
      }

      const isPlaylist = query.includes('list=') || query.includes('/playlist/') || query.includes('/album/') || (tracks.length > 1 && /^https?:\/\//.test(query));
      const queuePosition = player.playlist.tracks.length - player.currentIndex;

      if (isPlaylist) {
        tracks.forEach(t => t.requesterTag = interaction.user.tag);
        player.playlist.tracks.push(...tracks);

        // Calculate total duration for playlist
        const totalMs = tracks.reduce((acc, t) => acc + (t.durationMs || 0), 0);
        const hrs = Math.floor(totalMs / 3600000);
        const mins = Math.floor((totalMs % 3600000) / 60000);
        const secs = Math.floor((totalMs % 60000) / 1000);
        const durationStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}:${secs.toString().padStart(2, '0')}`;

        const card = EnqueueLayout.playlistCard(query.substring(0, 40), tracks.length, durationStr, queuePosition + 1, interaction.user);
        await interaction.editReply(card);
      } else {
        const track = tracks[0];
        track.requesterTag = interaction.user.tag;
        player.playlist.tracks.push(track);

        if (!isNewPlayer && player.currentTrack) {
          const trackIndex = player.playlist.tracks.length - 1;
          const card = EnqueueLayout.trackCard(track, queuePosition, interaction.user, player.playlist.tracks.length, trackIndex);
          await interaction.editReply(card);
        } else {
          await interaction.editReply({ content: `🎶 Now playing: **${track.title}**` });
        }
      }

      if (isNewPlayer || !player.currentTrack) {
        player.currentTrack = player.playlist.tracks[player.currentIndex];
        await playTrack(client, interaction.guildId, interaction.channel);
      }
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while playing music.**');
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(card);
      } else {
        await interaction.reply({ ...card, ephemeral: true });
      }
    }
  },

  async execute(message, args) {
    try {
      const client = message.client;
      const query = args.join(' ').trim();

      if (!query) {
        let prefix = '>';
        if (message.guildId && client.guildPrefixes) {
          prefix = client.guildPrefixes.get(message.guildId) || '>';
        }
        const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', `**Usage: \`${prefix}play <song query or link>\`**`);
        return message.reply(card);
      }

      const connected = await checkVoiceChannel(message);
      if (!connected) return;

      const userPref = await UserPreferences.findOne({ userId: message.author.id });
      const engine = userPref?.musicSource || 'ytmsearch';

      const tracks = await resolveTracks(query, engine);
      if (tracks.length === 0) {
        const card = PrefixLayout.messageCard('❌', `**No results found for "${query}"**`);
        return message.reply(card);
      }

      let player = client.activePlayers?.get(message.guildId);
      const isNewPlayer = !player;

      if (isNewPlayer) {
        const voiceChannel = message.member.voice.channel;
        const connectedNodes = Array.from(client.shoukaku.nodes.values()).filter(n => n.state === 1);
        if (connectedNodes.length === 0) {
          const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', '**No available Lavalink nodes are connected right now.**');
          return message.reply(card);
        }

        connectedNodes.sort((a, b) => {
          const statsA = a.stats || { cpu: { systemLoad: 0.5 }, players: 0 };
          const statsB = b.stats || { cpu: { systemLoad: 0.5 }, players: 0 };
          return ((statsA.cpu.systemLoad * 100) + statsA.players + (a.ping / 10)) - 
                 ((statsB.cpu.systemLoad * 100) + statsB.players + (b.ping / 10));
        });
        const bestNode = connectedNodes[0];

        const shoukakuPlayer = await client.shoukaku.joinVoiceChannel({
          guildId: message.guildId,
          channelId: voiceChannel.id,
          shardId: message.guild?.shardId || 0,
          deaf: true,
          nodeName: bestNode.name
        });

        player = {
          guildId: message.guildId,
          voiceChannelId: voiceChannel.id,
          textChannelId: message.channel.id,
          playlist: { name: 'Queue', tracks: [] },
          currentIndex: 0,
          currentTrack: null,
          isPaused: false,
          volume: 100,
          autoplay: false,
          liked: false,
          loopMode: 'off',
          playPrevious: false,
          message: null,
          requester: message.author,
          timeoutId: null,
          shoukakuPlayer: shoukakuPlayer
        };
        client.activePlayers = client.activePlayers || new Map();
        client.activePlayers.set(message.guildId, player);
      } else {
        if (player.voiceChannelId !== message.member.voice.channelId) {
          const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', '**You must be in the same voice channel as the bot.**');
          return message.reply(card);
        }
      }

      const isPlaylist = query.includes('list=') || query.includes('/playlist/') || query.includes('/album/') || (tracks.length > 1 && /^https?:\/\//.test(query));
      const queuePosition = player.playlist.tracks.length - player.currentIndex;

      if (isPlaylist) {
        tracks.forEach(t => t.requesterTag = message.author.tag);
        player.playlist.tracks.push(...tracks);

        // Calculate total duration for playlist
        const totalMs = tracks.reduce((acc, t) => acc + (t.durationMs || 0), 0);
        const hrs = Math.floor(totalMs / 3600000);
        const mins = Math.floor((totalMs % 3600000) / 60000);
        const secs = Math.floor((totalMs % 60000) / 1000);
        const durationStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}:${secs.toString().padStart(2, '0')}`;

        const card = EnqueueLayout.playlistCard(query.substring(0, 40), tracks.length, durationStr, queuePosition + 1, message.author);
        await message.reply(card);
      } else {
        const track = tracks[0];
        track.requesterTag = message.author.tag;
        player.playlist.tracks.push(track);

        if (!isNewPlayer && player.currentTrack) {
          const trackIndex = player.playlist.tracks.length - 1;
          const card = EnqueueLayout.trackCard(track, queuePosition, message.author, player.playlist.tracks.length, trackIndex);
          await message.reply(card);
        }
      }

      if (isNewPlayer || !player.currentTrack) {
        player.currentTrack = player.playlist.tracks[player.currentIndex];
        await playTrack(client, message.guildId, message.channel);
      }
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while playing music.**');
      return message.reply(card);
    }
  }
};

import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import Playlist from './models/Playlist.js';
import Liked from './models/Liked.js';

/**
 * Initializes and starts the dashboard server on the allocated port.
 * @param {import('discord.js').Client} client 
 */
export function startDashboardServer(client) {
  const app = express();
  const PORT = process.env.PORT || 5000;

  app.use(express.json());
  app.use(cookieParser());

  const {
    DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET,
    DISCORD_REDIRECT_URI,
    JWT_SECRET
  } = process.env;

  // Ensure variables exist
  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET || !DISCORD_REDIRECT_URI || !JWT_SECRET) {
    console.error('[Dashboard Server] Error: Missing required dashboard variables (DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI, JWT_SECRET) in .env!');
    // We don't crash the bot, but we log a heavy warning
    console.warn('[Dashboard Server] Dashboard server will not start due to missing environment variables.');
    return;
  }

  /**
   * Helper to determine redirect URI dynamically (backward compatibility for Vite proxy)
   */
  function getRedirectUri(req) {
    const forwardedHost = req.headers['x-forwarded-host'];
    if (forwardedHost) {
      const isLocal = forwardedHost.includes('localhost') || forwardedHost.includes('127.0.0.1');
      const proto = isLocal ? 'http' : 'https';
      return `${proto}://${forwardedHost}/api/auth/callback`;
    }
    return DISCORD_REDIRECT_URI;
  }

  // --- OAUTH2 LOGIN ROUTES ---

  app.get('/api/auth/login', (req, res) => {
    const redirectUri = getRedirectUri(req);
    const params = new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identify guilds'
    });
    res.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
  });

  app.get('/api/auth/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) {
      return res.status(400).send('Error: Missing authorization code from Discord.');
    }
    const redirectUri = getRedirectUri(req);

    try {
      const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: DISCORD_CLIENT_ID,
          client_secret: DISCORD_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errText = await tokenResponse.text().catch(() => '');
        console.error(`[Dashboard Server] Failed code exchange. Redirect URI used: "${redirectUri}". Status: ${tokenResponse.status}. Details:`, errText);
        return res.status(500).send('Failed to exchange code for token.');
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Fetch user profile
      const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!userResponse.ok) {
        return res.status(500).send('Failed to fetch user profile.');
      }
      const userData = await userResponse.json();

      // Fetch user's guilds
      const guildsResponse = await fetch('https://discord.com/api/v10/users/@me/guilds', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      let adminGuilds = [];
      let guildsVerified = false;

      if (guildsResponse.ok) {
        const guildsData = await guildsResponse.json();
        const botGuildIds = new Set(client.guilds.cache.map(g => g.id));
        guildsVerified = true;

        adminGuilds = guildsData.filter(guild => {
          const hasAdminFlag = (BigInt(guild.permissions) & 0x8n) === 0x8n;
          return guild.owner || hasAdminFlag;
        }).map(guild => ({
          id: guild.id,
          name: guild.name,
          icon: guild.icon,
          permissions: guild.permissions,
          joined: botGuildIds.has(guild.id)
        }));
      }

      const userSession = {
        id: userData.id,
        username: userData.username,
        discriminator: userData.discriminator,
        avatar: userData.avatar,
        guilds: adminGuilds,
        guildsVerified: guildsVerified
      };

      const token = jwt.sign(userSession, JWT_SECRET, { expiresIn: '7d' });

      res.cookie('hikari_session', token, {
        httpOnly: true,
        secure: false, // Set to true in production HTTPS
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
      });

      res.redirect('/');
    } catch (err) {
      console.error('[Dashboard Server] Error during callback handling:', err);
      res.status(500).send('An internal server error occurred.');
    }
  });

  app.get('/api/auth/user', async (req, res) => {
    const token = req.cookies.hikari_session;
    if (!token) {
      return res.json({ loggedIn: false, user: null });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Update joined status on-the-fly
      if (decoded && decoded.guilds) {
        const botGuildIds = new Set(client.guilds.cache.map(g => g.id));
        decoded.guilds = decoded.guilds.map(guild => ({
          ...guild,
          joined: botGuildIds.has(guild.id)
        }));
        decoded.guildsVerified = true;
      }
      
      res.json({ loggedIn: true, user: decoded });
    } catch (err) {
      res.clearCookie('hikari_session');
      res.json({ loggedIn: false, user: null });
    }
  });

  app.get('/api/auth/logout', (req, res) => {
    res.clearCookie('hikari_session');
    res.json({ success: true });
  });

  // --- LIKED SONGS API ---

  app.get('/api/auth/liked', async (req, res) => {
    const token = req.cookies.hikari_session;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.id;

      const likedData = await Liked.findOne({ userId });
      res.json({ songs: likedData?.songs || [] });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch liked songs' });
    }
  });

  app.delete('/api/auth/liked/:index', async (req, res) => {
    const token = req.cookies.hikari_session;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.id;
      const index = parseInt(req.params.index);

      const likedData = await Liked.findOne({ userId });
      if (likedData && likedData.songs && likedData.songs[index]) {
        likedData.songs.splice(index, 1);
        await likedData.save();
        return res.json({ success: true, songs: likedData.songs });
      }
      res.status(400).json({ error: 'Song not found at specified index' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete song' });
    }
  });

  app.delete('/api/auth/liked-all', async (req, res) => {
    const token = req.cookies.hikari_session;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.id;

      const likedData = await Liked.findOne({ userId });
      if (likedData) {
        likedData.songs = [];
        await likedData.save();
      }
      res.json({ success: true, songs: [] });
    } catch (err) {
      res.status(500).json({ error: 'Failed to clear liked songs' });
    }
  });

  // --- PLAYLISTS API ---

  app.get('/api/auth/playlists', async (req, res) => {
    const token = req.cookies.hikari_session;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.id;

      const playlists = await Playlist.find({ userId }).sort({ createdAt: -1 });
      res.json(playlists);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch playlists' });
    }
  });

  app.post('/api/auth/playlists', async (req, res) => {
    const token = req.cookies.hikari_session;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Playlist name is required' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.id;

      const existing = await Playlist.findOne({ userId, name: name.trim() });
      if (existing) {
        return res.status(400).json({ error: 'A playlist with this name already exists' });
      }

      const playlist = new Playlist({
        userId,
        name: name.trim(),
        tracks: []
      });

      await playlist.save();
      res.status(201).json(playlist);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create playlist' });
    }
  });

  app.delete('/api/auth/playlists/:id', async (req, res) => {
    const token = req.cookies.hikari_session;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.id;
      const playlistId = req.params.id;

      const result = await Playlist.deleteOne({ _id: playlistId, userId });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Playlist not found' });
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete playlist' });
    }
  });

  app.post('/api/auth/playlists/play', async (req, res) => {
    const token = req.cookies.hikari_session;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const { guildId, playlistId, playNow } = req.body;
    if (!guildId || !playlistId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.id;

      const userGuild = decoded.guilds?.find(g => g.id === guildId);
      if (!userGuild) {
        return res.status(403).json({ error: 'You do not have access to this server' });
      }

      let tracks = [];
      let playlistName = '';

      if (playlistId === 'liked') {
        playlistName = 'Liked Music';
        const likedData = await Liked.findOne({ userId });
        if (!likedData || !likedData.songs || likedData.songs.length === 0) {
          return res.status(400).json({ error: 'Your liked songs library is empty' });
        }
        tracks = likedData.songs;
      } else {
        const playlist = await Playlist.findOne({ _id: playlistId, userId });
        if (!playlist) {
          return res.status(404).json({ error: 'Playlist not found' });
        }
        if (!playlist.tracks || playlist.tracks.length === 0) {
          return res.status(400).json({ error: 'Selected playlist is empty' });
        }
        playlistName = playlist.name;
        tracks = playlist.tracks;
      }

      // Playback execution inside the SAME NODE PROCESS
      const guild = client.guilds.cache.get(guildId);
      if (!guild) {
        return res.status(404).json({ error: 'Guild not found' });
      }

      const member = guild.members.cache.get(userId) || await guild.members.fetch(userId).catch(() => null);
      if (!member || !member.voice.channelId) {
        return res.status(400).json({ error: 'You must be in a voice channel in that server to play music.' });
      }

      const textChannel = guild.channels.cache.find(c => c.isTextBased() && c.permissionsFor(guild.members.me).has('SendMessages')) 
        || guild.systemChannel;

      if (!textChannel) {
        return res.status(400).json({ error: 'No text channel found where the bot has send permission' });
      }

      const playlistObj = {
        name: playlistName || 'Dashboard Mix',
        tracks: tracks
      };

      let player = client.activePlayers?.get(guildId);
      if (player) {
        if (player.voiceChannelId !== member.voice.channelId) {
          player.voiceChannelId = member.voice.channelId;
          if (player.shoukakuPlayer) {
            try {
              await client.shoukaku.leaveVoiceChannel(guildId);
            } catch(e) {}
            player.shoukakuPlayer = null;
          }
        }

        if (playNow) {
          player.playlist = playlistObj;
          player.currentIndex = 0;
          player.currentTrack = playlistObj.tracks[0];
          player.requester = member.user;
          player.textChannelId = textChannel.id;

          const { playTrack } = await import('./utils/playerManager.js');
          await playTrack(client, guildId, textChannel);
        } else {
          if (!player.playlist || !player.playlist.tracks) {
            player.playlist = playlistObj;
            player.currentIndex = 0;
          } else {
            player.playlist.tracks.push(...playlistObj.tracks);
          }

          if (!player.currentTrack) {
            player.currentTrack = playlistObj.tracks[0];
            const { playTrack } = await import('./utils/playerManager.js');
            await playTrack(client, guildId, textChannel);
          } else {
            textChannel.send({ content: `➕ Queued **${playlistObj.tracks.length}** tracks from playlist **${playlistObj.name}**` }).catch(() => null);
          }
        }
      } else {
        const playerObj = {
          guildId,
          voiceChannelId: member.voice.channelId,
          textChannelId: textChannel.id,
          playlist: playlistObj,
          currentIndex: 0,
          currentTrack: playlistObj.tracks[0],
          isPaused: false,
          volume: 100,
          autoplay: false,
          liked: false,
          loopMode: 'off',
          playPrevious: false,
          message: null,
          requester: member.user,
          timeoutId: null
        };

        if (!client.activePlayers) {
          client.activePlayers = new Map();
        }
        client.activePlayers.set(guildId, playerObj);

        const { playTrack } = await import('./utils/playerManager.js');
        await playTrack(client, guildId, textChannel);
      }

      res.json({ success: true, message: `Successfully queued/played "${playlistName}"` });
    } catch (err) {
      console.error('[Dashboard Server] Playback trigger error:', err);
      res.status(500).json({ error: 'Failed to trigger playback' });
    }
  });

  // --- BOT REAL-TIME ACTIVITY & STATS ---

  app.get('/api/auth/activity', async (req, res) => {
    const token = req.cookies.hikari_session;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const userGuildIds = new Set(decoded.guilds?.map(g => g.id) || []);

      const playersList = [];
      if (client.activePlayers) {
        for (const [guildId, player] of client.activePlayers.entries()) {
          const guild = client.guilds.cache.get(guildId);
          let listenerCount = 0;
          if (guild && player.voiceChannelId) {
            const voiceChannel = guild.channels.cache.get(player.voiceChannelId);
            if (voiceChannel && voiceChannel.members) {
              listenerCount = voiceChannel.members.filter(m => !m.user.bot).size;
            }
          }

          playersList.push({
            guildId: guildId,
            guildName: guild?.name || 'Unknown Server',
            guildIcon: guild?.icon || null,
            currentTrack: player.currentTrack ? {
              title: player.currentTrack.title,
              artist: player.currentTrack.artist,
              thumbnail: player.currentTrack.thumbnail,
              duration: player.currentTrack.duration
            } : null,
            isPaused: !!player.isPaused,
            listenerCount: listenerCount,
            queueLength: player.playlist && player.playlist.tracks ? player.playlist.tracks.length : 0,
            currentIndex: player.currentIndex || 0
          });
        }
      }

      const sharedPlayers = playersList.filter(p => userGuildIds.has(p.guildId));
      res.json(sharedPlayers);
    } catch (err) {
      console.error('[Dashboard Server] Error fetching activity:', err);
      res.json([]);
    }
  });

  app.get('/api/auth/stats', (req, res) => {
    try {
      const statsPath = path.resolve('./bot_stats.json');
      if (fs.existsSync(statsPath)) {
        const raw = fs.readFileSync(statsPath, 'utf8');
        const data = JSON.parse(raw);
        return res.json(data);
      }
    } catch (err) {
      console.error('[Dashboard Server] Error reading bot_stats.json:', err);
    }
    
    // Fallback directly to real, live in-memory stats
    res.json({
      serversCount: client.guilds.cache.size,
      usersCount: client.guilds.cache.reduce((acc, g) => acc + (g.memberCount || 0), 0),
      commandsCount: client.commands?.size || 67,
      uptime: client.uptime || 0,
      apiLatency: client.ws.ping || 0,
      activePlayersCount: client.activePlayers?.size || 0,
      shardsCount: client.shard?.count || 1,
      clustersCount: 1
    });
  });

  // Start Express API server
  app.listen(PORT, () => {
    console.log(`\x1b[35m🛜 [Dashboard] Server online on port ${PORT}\x1b[0m`);
  });
}

import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Playlist from '../src/models/Playlist.js';

dotenv.config();

if (process.env.MONGO_URI) {
  mongoose.set('strictQuery', true);
  try {
    console.log('[Auth Server] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[Auth Server] Connected to MongoDB Cluster successfully.');
  } catch (err) {
    console.error('[Auth Server] MongoDB connection failed:', err);
  }
}

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

if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET || !DISCORD_REDIRECT_URI || !JWT_SECRET) {
  console.error('[Auth Server] Error: Missing required environment variables in .env!');
  process.exit(1);
}

function getRedirectUri(req) {
  const forwardedHost = req.headers['x-forwarded-host'];
  const forwardedProto = req.headers['x-forwarded-proto'] || 'http';

  if (forwardedHost) {
    const uri = `${forwardedProto}://${forwardedHost}/api/auth/callback`;
    console.log(`[Auth Server] Dynamic Redirect URI detected via proxy: ${uri}`);
    return uri;
  }

  console.log(`[Auth Server] Fallback Redirect URI: ${DISCORD_REDIRECT_URI}`);
  return DISCORD_REDIRECT_URI;
}

app.get('/api/auth/login', (req, res) => {
  const redirectUri = getRedirectUri(req);
  console.log(`[Auth Server] Redirecting user to Discord with redirect_uri: ${redirectUri}`);

  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify guilds'
  });
  const discordAuthUrl = `https://discord.com/oauth2/authorize?${params.toString()}`;
  res.redirect(discordAuthUrl);
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
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[Auth Server] Token exchange failed:', errorText);
      return res.status(500).send('Failed to exchange code for token.');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      return res.status(500).send('Failed to fetch user profile.');
    }

    const userData = await userResponse.json();

    const guildsResponse = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    let adminGuilds = [];
    let guildsVerified = false;

    if (guildsResponse.ok) {
      const guildsData = await guildsResponse.json();
      const botGuildIds = new Set();

      if (process.env.DISCORD_TOKEN) {
        try {
          const botGuildsResponse = await fetch('https://discord.com/api/v10/users/@me/guilds', {
            headers: {
              Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
            },
          });

          if (botGuildsResponse.ok) {
            const botGuildsData = await botGuildsResponse.json();
            botGuildsData.forEach(g => botGuildIds.add(g.id));
            guildsVerified = true;
            console.log(`[Auth Server] Verified guilds. Bot is currently present in: [${Array.from(botGuildIds).join(', ')}]`);
          } else {
            console.error('[Auth Server] Failed to fetch bot guilds:', botGuildsResponse.status, await botGuildsResponse.text());
          }
        } catch (botErr) {
          console.error('[Auth Server] Error fetching bot guilds:', botErr);
        }
      }

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
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    try {
      const frontendUrl = new URL(redirectUri).origin;
      res.redirect(`${frontendUrl}/`);
    } catch (err) {
      res.redirect('/');
    }
  } catch (err) {
    console.error('[Auth Server] Error during callback handling:', err);
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

    if (decoded && decoded.guilds && process.env.DISCORD_TOKEN) {
      try {
        const botGuildsResponse = await fetch('https://discord.com/api/v10/users/@me/guilds', {
          headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
          },
        });

        if (botGuildsResponse.ok) {
          const botGuildsData = await botGuildsResponse.ok ? await botGuildsResponse.json() : [];
          const botGuildIds = new Set(botGuildsData.map(g => g.id));

          decoded.guilds = decoded.guilds.map(guild => ({
            ...guild,
            joined: botGuildIds.has(guild.id)
          }));
          decoded.guildsVerified = true;
        }
      } catch (botErr) {
        console.error('[Auth Server] Error verifying guilds on /user request:', botErr);
      }
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

import Liked from '../src/models/Liked.js';

app.get('/api/auth/liked', async (req, res) => {
  const token = req.cookies.hikari_session;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    const likedData = await Liked.findOne({ userId });
    if (!likedData || !likedData.songs) {
      return res.json({ songs: [] });
    }
    res.json({ songs: likedData.songs });
  } catch (err) {
    console.error('[Auth Server] Error fetching liked songs:', err);
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
    console.error('[Auth Server] Error deleting liked song:', err);
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
      return res.json({ success: true, songs: [] });
    }
    res.json({ success: true, songs: [] });
  } catch (err) {
    console.error('[Auth Server] Error clearing liked songs:', err);
    res.status(500).json({ error: 'Failed to clear liked songs' });
  }
});

app.get('/api/auth/playlists', async (req, res) => {
  const token = req.cookies.hikari_session;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    const playlists = await Playlist.find({ userId }).sort({ createdAt: -1 });
    res.json(playlists);
  } catch (err) {
    console.error('[Auth Server] Error fetching playlists:', err);
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
    console.error('[Auth Server] Error creating playlist:', err);
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
    console.error('[Auth Server] Error deleting playlist:', err);
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

    const botResponse = await fetch('http://localhost:5001/play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guildId,
        userId,
        playlistName,
        tracks,
        playNow: !!playNow
      })
    });

    if (!botResponse.ok) {
      const botErr = await botResponse.json().catch(() => ({ error: 'Bot failed to process playback request' }));
      return res.status(botResponse.status).json({ error: botErr.error || 'Bot failed to play' });
    }

    res.json({ success: true, message: `Successfully queued/played "${playlistName}"` });
  } catch (err) {
    console.error('[Auth Server] Playback trigger error:', err);
    res.status(500).json({ error: 'Failed to trigger playback' });
  }
});

app.get('/api/auth/activity', async (req, res) => {
  const token = req.cookies.hikari_session;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userGuildIds = new Set(decoded.guilds?.map(g => g.id) || []);

    const botResponse = await fetch('http://localhost:5001/players');
    if (!botResponse.ok) {
      throw new Error('Bot API error');
    }

    const allPlayers = await botResponse.json();

    const sharedPlayers = allPlayers.filter(p => userGuildIds.has(p.guildId));

    res.json(sharedPlayers);
  } catch (err) {
    console.error('[Auth Server] Error fetching activity:', err);
    res.json([]);
  }
});

import fs from 'fs';
import path from 'path';

app.get('/api/auth/stats', (req, res) => {
  try {
    const statsPath = path.resolve('../bot_stats.json');
    if (fs.existsSync(statsPath)) {
      const raw = fs.readFileSync(statsPath, 'utf8');
      const data = JSON.parse(raw);
      return res.json(data);
    }
  } catch (err) {
    console.error('[Auth Server] Error reading bot_stats.json:', err);
  }

  res.json({
    serversCount: 0,
    usersCount: 0,
    commandsCount: 67,
    uptime: 0,
    apiLatency: 0,
    activePlayersCount: 0,
    shardsCount: 1,
    clustersCount: 1
  });
});

app.listen(PORT, () => {
  console.log(`[Auth Server] Express server online and listening on port ${PORT}`);
});

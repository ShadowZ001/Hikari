import http from 'http';
import https from 'https';

const LAVALINK_HOST = process.env.LAVALINK_HOST || 'sg1-nodelink.nyxbot.app';
const LAVALINK_PORT = parseInt(process.env.LAVALINK_PORT || '3000', 10);
const LAVALINK_PASSWORD = process.env.LAVALINK_PASSWORD || 'nyxbot.app/support';

/**
 * Formats milliseconds into mm:ss format.
 * @param {number} ms 
 * @returns {string}
 */
export function formatDuration(ms) {
  if (!ms || isNaN(ms)) return '3:44';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Queries the Lavalink rest endpoint to resolve track metadata.
 * Supports searching via YouTube (ytsearch:) or direct links.
 * @param {string} query 
 * @returns {Promise<object | null>}
 */
export async function resolveTrack(query) {
  const isUrl = query.startsWith('http://') || query.startsWith('https://');
  const identifier = isUrl ? query : `ytmsearch:${query}`;
  
  return new Promise((resolve) => {
    const encodedIdentifier = encodeURIComponent(identifier);
    const options = {
      host: LAVALINK_HOST,
      port: LAVALINK_PORT,
      path: `/v4/loadtracks?identifier=${encodedIdentifier}`,
      method: 'GET',
      headers: {
        'Authorization': LAVALINK_PASSWORD
      },
      timeout: 6000
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          console.error(`[Lavalink Utility] Error HTTP ${res.statusCode} loading track for query "${query}"`);
          return resolve(null);
        }
        try {
          const result = JSON.parse(body);
          let track = null;

          if (result.loadType === 'track') {
            track = result.data;
          } else if (result.loadType === 'search' && result.data && result.data.length > 0) {
            track = result.data[0];
          } else if (result.loadType === 'playlist' && result.data && result.data.tracks && result.data.tracks.length > 0) {
            track = result.data.tracks[0];
          }

          if (track && track.info) {
            resolve({
              title: track.info.title,
              uri: track.info.uri,
              artist: track.info.author || 'Unknown Artist',
              durationMs: track.info.length || 224000,
              duration: formatDuration(track.info.length),
              thumbnail: track.info.artworkUrl || 'https://i.imgur.com/8Q4W5vj.png'
            });
          } else {
            resolve(null);
          }
        } catch (e) {
          console.error('[Lavalink Utility] Failed to parse JSON response:', e);
          resolve(null);
        }
      });
    });

    req.on('error', (e) => {
      console.error('[Lavalink Utility] HTTP request error:', e.message);
      resolve(null);
    });

    req.on('timeout', () => {
      req.destroy();
      console.error('[Lavalink Utility] HTTP request timeout');
      resolve(null);
    });

    req.end();
  });
}

/**
 * Queries the Lavalink rest endpoint to resolve multiple tracks (or playlists).
 * @param {string} query 
 * @param {string} [engine] 
 * @returns {Promise<object[]>}
 */
export async function resolveTracks(query, engine) {
  const isUrl = query.startsWith('http://') || query.startsWith('https://');
  const identifier = isUrl ? query : `${engine || 'ytmsearch'}:${query}`;
  
  return new Promise((resolve) => {
    const encodedIdentifier = encodeURIComponent(identifier);
    const options = {
      host: LAVALINK_HOST,
      port: LAVALINK_PORT,
      path: `/v4/loadtracks?identifier=${encodedIdentifier}`,
      method: 'GET',
      headers: {
        'Authorization': LAVALINK_PASSWORD
      },
      timeout: 6000
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          console.error(`[Lavalink Utility] Error HTTP ${res.statusCode} loading tracks for query "${query}"`);
          return resolve([]);
        }
        try {
          const result = JSON.parse(body);
          let tracks = [];

          if (result.loadType === 'track') {
            tracks = [result.data];
          } else if (result.loadType === 'search' && result.data) {
            tracks = result.data;
          } else if (result.loadType === 'playlist' && result.data && result.data.tracks) {
            tracks = result.data.tracks;
          }

          if (tracks.length > 0) {
            const formatted = tracks.map(track => ({
              title: track.info.title,
              uri: track.info.uri,
              artist: track.info.author || 'Unknown Artist',
              durationMs: track.info.length || 224000,
              duration: formatDuration(track.info.length),
              thumbnail: track.info.artworkUrl || 'https://i.imgur.com/8Q4W5vj.png'
            }));
            resolve(formatted);
          } else {
            resolve([]);
          }
        } catch (e) {
          console.error('[Lavalink Utility] Failed to parse JSON response in resolveTracks:', e);
          resolve([]);
        }
      });
    });

    req.on('error', (e) => {
      console.error('[Lavalink Utility] HTTP request error in resolveTracks:', e.message);
      resolve([]);
    });

    req.on('timeout', () => {
      req.destroy();
      console.error('[Lavalink Utility] HTTP request timeout in resolveTracks');
      resolve([]);
    });

    req.end();
  });
}

/**
 * Queries connected Lavalink nodes to fetch their supported source managers.
 * Handles HTTPS/HTTP protocols dynamically depending on node setup.
 * @param {import('discord.js').Client} client 
 * @returns {Promise<string[]>} Supported source managers list (e.g. ['youtube', 'spotify'])
 */
export async function getLavalinkSupportedSources(client) {
  if (!client || !client.shoukaku) return [];

  const connectedNodes = Array.from(client.shoukaku.nodes.values()).filter(n => n.state === 1);
  if (connectedNodes.length === 0) return [];

  // Use connection details of the first active connected node
  const node = connectedNodes[0];
  const urlStr = node.connection.url;
  const auth = node.connection.auth;
  const secure = node.connection.secure;

  let host = urlStr;
  let port = secure ? 443 : 80;

  if (urlStr.includes(':')) {
    const parts = urlStr.split(':');
    host = parts[0];
    port = parseInt(parts[1], 10);
  }

  return new Promise((resolve) => {
    const options = {
      host: host,
      port: port,
      path: '/v4/info',
      method: 'GET',
      headers: {
        'Authorization': auth
      },
      timeout: 3000
    };

    const requestLib = secure ? https : http;
    const req = requestLib.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) return resolve([]);
        try {
          const data = JSON.parse(body);
          resolve(data.sourceManagers || []);
        } catch (e) {
          resolve([]);
        }
      });
    });

    req.on('error', () => resolve([]));
    req.on('timeout', () => {
      req.destroy();
      resolve([]);
    });
    req.end();
  });
}


import { Events, ActivityType, ApplicationCommandOptionType } from 'discord.js';
import fs from 'fs';
import Blacklist from '../models/Blacklist.js';
import { StatsLayout } from '../components/StatsLayout.js';

export default {
  name: Events.ClientReady,
  once: true,
  /**
   * Executes when the client successfully connects and is ready.
   * Registers slash commands globally.
   * @param {import('discord.js').Client} client 
   */
  async execute(client) {
    console.log(`\x1b[32m✔ [Client] Bot is online! Connected as ${client.user.tag}\x1b[0m`);

    // Periodically save real-time statistics for the dashboard
    const saveBotStats = () => {
      try {
        const stats = {
          serversCount: client.guilds.cache.size,
          usersCount: client.guilds.cache.reduce((acc, guild) => acc + (guild.memberCount || 0), 0),
          commandsCount: client.commands.size,
          uptime: client.uptime,
          apiLatency: client.ws.ping,
          activePlayersCount: client.activePlayers?.size || 0,
          shardsCount: 1,
          clustersCount: 1,
          timestamp: Date.now()
        };
        fs.writeFileSync('./bot_stats.json', JSON.stringify(stats, null, 2));
      } catch (err) {
        console.error('\x1b[31m✖ [Database] Error saving bot stats:\x1b[0m', err);
      }
    };
    setInterval(saveBotStats, 3000);
    saveBotStats();

    // Load blacklist cache from database
    client.blacklist = new Set();
    try {
      const dbList = await Blacklist.find();
      dbList.forEach(entry => client.blacklist.add(entry.userId));
      console.log(`\x1b[36mℹ [Database] Loaded ${client.blacklist.size} blacklisted users.\x1b[0m`);
    } catch (err) {
      console.error('\x1b[31m✖ [Database] Error loading blacklist from database:\x1b[0m', err);
    }
    
    let emojiText = '';
    client.emojis.cache.forEach(emoji => {
      emojiText += `Name: ${emoji.name}, ID: ${emoji.id}, Format: <:${emoji.name}:${emoji.id}>\n`;
    });
    fs.writeFileSync('./emojis_all.txt', emojiText);
    
    // Configured list of presence statuses to cycle through
    const statuses = [
      {
        type: ActivityType.Playing,
        name: 'with Components V2'
      },
      {
        type: ActivityType.Custom,
        name: 'custom',
        state: 'lofi songs for kavya',
        emoji: {
          name: 'woo',
          id: '1414225948089520198'
        }
      }
    ];

    let currentIndex = 0;
    let firstLog = true;

    const rotatePresence = () => {
      const activity = statuses[currentIndex];
      
      client.user.setPresence({
        activities: [activity],
        status: 'online',
      });
      
      const displayLog = activity.type === ActivityType.Custom
        ? `<:${activity.emoji.name}:${activity.emoji.id}> ${activity.state}`
        : `Playing ${activity.name}`;
        
      if (firstLog) {
        console.log(`\x1b[36mℹ [Presence] Status initialized: "${displayLog}"\x1b[0m`);
        firstLog = false;
      }
      
      currentIndex = (currentIndex + 1) % statuses.length;
    };

    // Set initial presence on startup
    rotatePresence();

    // Rotate status every 15 seconds (15000 ms)
    setInterval(rotatePresence, 15000);

    // Initialize stats sessions map for live real-time updates
    client.statsSessions = new Map();

    const updateStatsMessages = async () => {
      if (!client.statsSessions || client.statsSessions.size === 0) return;
      
      for (const [messageId, session] of client.statsSessions.entries()) {
        // Expire session after 5 minutes of inactivity (no interactions/updates)
        if (Date.now() - session.lastUpdated > 5 * 60 * 1000) {
          client.statsSessions.delete(messageId);
          continue;
        }
        
        try {
          const channel = await client.channels.fetch(session.channelId).catch(() => null);
          if (!channel) {
            client.statsSessions.delete(messageId);
            continue;
          }
          
          const msg = await channel.messages.fetch(messageId).catch(() => null);
          if (!msg) {
            client.statsSessions.delete(messageId);
            continue;
          }
          
          const timeString = new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          });
          
          const layout = new StatsLayout({
            client,
            category: session.category,
            username: session.username,
            timeString
          });
          
          await msg.edit(layout.toPayload()).catch(() => {
            client.statsSessions.delete(messageId);
          });
        } catch (err) {
          console.error('[Hikari Stats Auto-Update] Error:', err);
          client.statsSessions.delete(messageId);
        }
      }
    };

    // Auto-update stats every 5 seconds (5000 ms)
    setInterval(updateStatsMessages, 5000);

    // Register Application Slash Commands globally
    const commandsData = [
      {
        name: 'help',
        description: 'Displays the list of all available commands or specific command info.',
        options: [
          {
            name: 'command',
            description: 'Specific command to view help for.',
            type: ApplicationCommandOptionType.String,
            required: false
          }
        ]
      },
      {
        name: 'invite',
        description: 'Generates the bot invite link in a beautiful V2 layout.'
      },
      {
        name: 'ping',
        description: 'Checks the bot connection latency and system stats.'
      },
      {
        name: '247',
        description: 'Toggles or checks the bot 24/7 connection status.'
      },
      {
        name: 'stats',
        description: 'Displays the bot and system statistics.'
      },
      {
        name: 'forcefix',
        description: 'Force fixes stuck or erroring music players in the server.',
        options: [
          {
            name: 'action',
            description: 'The fix action to execute.',
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
              { name: 'full', value: 'full' },
              { name: 'player', value: 'player' },
              { name: 'voice', value: 'voice' },
              { name: 'lavalink', value: 'lavalink' }
            ]
          }
        ]
      },
      {
        name: 'join',
        description: 'Bot joins your voice channel.'
      },
      {
        name: 'leave',
        description: 'Bot leaves the voice channel.'
      },
      {
        name: 'support',
        description: 'Generates the support server link in a beautiful V2 layout.'
      },
      {
        name: 'ignore',
        description: 'Manage the ignored channels list for the bot.',
        options: [
          {
            name: 'add',
            description: 'Add a channel to the ignore list.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'channel',
                description: 'The channel to ignore.',
                type: ApplicationCommandOptionType.Channel,
                required: true
              }
            ]
          },
          {
            name: 'remove',
            description: 'Remove a channel from the ignore list.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'channel',
                description: 'The channel to stop ignoring.',
                type: ApplicationCommandOptionType.Channel,
                required: true
              }
            ]
          },
          {
            name: 'list',
            description: 'List all currently ignored channels.',
            type: ApplicationCommandOptionType.Subcommand
          },
          {
            name: 'reset',
            description: 'Clear all ignored channels from the list.',
            type: ApplicationCommandOptionType.Subcommand
          }
        ]
      },
      {
        name: 'setprefix',
        description: 'Set a custom prefix for this server.',
        options: [
          {
            name: 'prefix',
            description: 'The new command prefix.',
            type: ApplicationCommandOptionType.String,
            required: true
          }
        ]
      },
      {
        name: 'avatar',
        description: "Displays a user's avatar in a beautiful V2 layout.",
        options: [
          {
            name: 'user',
            description: 'The user whose avatar you want to view.',
            type: ApplicationCommandOptionType.User,
            required: false
          }
        ]
      },
      {
        name: 'banner',
        description: "Displays a user's banner in a beautiful V2 layout.",
        options: [
          {
            name: 'user',
            description: 'The user whose banner you want to view.',
            type: ApplicationCommandOptionType.User,
            required: false
          }
        ]
      },
      {
        name: 'serverbanner',
        description: "Displays the server's banner in a beautiful V2 layout."
      },
      {
        name: 'servericon',
        description: "Displays the server's icon in a beautiful V2 layout."
      },
      {
        name: 'membercount',
        description: "Displays the server's member counts in a beautiful V2 layout."
      },
      {
        name: 'mc',
        description: "Displays the server's member counts in a beautiful V2 layout."
      },
      {
        name: 'pl-create',
        description: 'Create a new playlist.',
        options: [
          {
            name: 'name',
            description: 'The name of the playlist.',
            type: ApplicationCommandOptionType.String,
            required: true
          }
        ]
      },
      {
        name: 'pl-add',
        description: 'Add a track to one of your playlists.',
        options: [
          {
            name: 'playlist',
            description: 'The name of the playlist.',
            type: ApplicationCommandOptionType.String,
            required: true
          },
          {
            name: 'song',
            description: 'The name or link of the song to add.',
            type: ApplicationCommandOptionType.String,
            required: false
          }
        ]
      },
      {
        name: 'playlist-add',
        description: 'Add a track to one of your playlists.',
        options: [
          {
            name: 'playlist',
            description: 'The name of the playlist.',
            type: ApplicationCommandOptionType.String,
            required: true
          },
          {
            name: 'song',
            description: 'The name or link of the song to add.',
            type: ApplicationCommandOptionType.String,
            required: false
          }
        ]
      },
      {
        name: 'pl-delete',
        description: 'Delete one of your playlists.',
        options: [
          {
            name: 'name',
            description: 'The name of the playlist to delete.',
            type: ApplicationCommandOptionType.String,
            required: true
          }
        ]
      },
      {
        name: 'pl-list',
        description: 'List all of your playlists.'
      },
      {
        name: 'pl-play',
        description: 'Queue and play one of your playlists.',
        options: [
          {
            name: 'name',
            description: 'The name of the playlist to play.',
            type: ApplicationCommandOptionType.String,
            required: true
          }
        ]
      },
      {
        name: 'pl-remove',
        description: 'Remove a track from one of your playlists.',
        options: [
          {
            name: 'playlist',
            description: 'The name of the playlist.',
            type: ApplicationCommandOptionType.String,
            required: true
          },
          {
            name: 'track',
            description: 'The name or number of the track to remove.',
            type: ApplicationCommandOptionType.String,
            required: true
          }
        ]
      },
      {
        name: 'blacklist',
        description: 'Manage the bot blacklist.',
        options: [
          {
            name: 'action',
            description: 'Action to perform.',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
              { name: 'add', value: 'add' },
              { name: 'remove', value: 'remove' },
              { name: 'check', value: 'check' },
              { name: 'list', value: 'list' }
            ]
          },
          {
            name: 'user',
            description: 'The user to add, remove, or check.',
            type: ApplicationCommandOptionType.User,
            required: false
          }
        ]
      },
      {
        name: 'source',
        description: 'Set your preferred music search source.',
        options: [
          {
            name: 'source',
            description: 'Choose your preferred search source',
            type: ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true
          }
        ]
      },
      {
        name: 'like',
        description: 'Add the currently playing song to your favorites.'
      },
      {
        name: 'likeall',
        description: 'Add all songs from the current queue to your favorites.'
      },
      {
        name: 'playliked',
        description: 'Queue and play your favorite songs.'
      },
      {
        name: 'showliked',
        description: 'Show your favorite songs.',
        options: [
          {
            name: 'page',
            description: 'Page number to display',
            type: ApplicationCommandOptionType.Integer,
            required: false
          }
        ]
      },
      {
        name: 'unlike',
        description: 'Remove songs from your favorites.'
      },
      {
        name: 'node',
        description: 'Shows details and performance scores for all connected Lavalink nodes.'
      },
      {
        name: 'play',
        description: 'Plays a song or playlist from search or link.',
        options: [
          {
            name: 'song',
            description: 'Song name or URL to play',
            type: ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true
          }
        ]
      },
      {
        name: 'autoplay',
        description: 'Toggle autoplay mode.'
      },
      {
        name: 'clear',
        description: 'Clears the music queue.'
      },
      {
        name: 'filter',
        description: "Sets the player's audio filter."
      },
      {
        name: 'forceskip',
        description: 'Force skips the current playing song.'
      },
      {
        name: 'forward',
        description: 'Fast forward the current song by specified seconds.',
        options: [
          {
            name: 'seconds',
            description: 'Seconds to fast forward',
            type: ApplicationCommandOptionType.Integer,
            required: false
          }
        ]
      },
      {
        name: 'grab',
        description: 'Grabs and sends you the song that is currently playing.'
      },
      {
        name: 'history',
        description: 'Show recently played songs.'
      },
      {
        name: 'leavecleanup',
        description: 'Removes songs from the queue queued by users who left the voice channel.'
      },
      {
        name: 'loop',
        description: 'Toggle or set loop mode (off, track, queue).',
        options: [
          {
            name: 'mode',
            description: 'Choose loop mode',
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
              { name: 'off', value: 'off' },
              { name: 'track', value: 'track' },
              { name: 'queue', value: 'queue' }
            ]
          }
        ]
      },
      {
        name: 'lyrics',
        description: 'Display lyrics for the currently playing song.'
      },
      {
        name: 'move',
        description: 'Move the bot to your current voice channel.'
      },
      {
        name: 'nowplaying',
        description: 'Show the current playing song.'
      },
      {
        name: 'pause',
        description: 'Pause the currently playing music.'
      },
      {
        name: 'previous',
        description: 'Play the previous song in queue.'
      },
      {
        name: 'queue',
        description: 'Show the music queue for this server.',
        options: [
          {
            name: 'page',
            description: 'Page number of the queue to view',
            type: ApplicationCommandOptionType.Integer,
            required: false
          }
        ]
      },
      {
        name: 'remove',
        description: 'Remove a track from the queue by its number.',
        options: [
          {
            name: 'position',
            description: 'Queue position of the track to remove',
            type: ApplicationCommandOptionType.Integer,
            required: true
          }
        ]
      },
      {
        name: 'replay',
        description: 'Replay the current song from the beginning.'
      },
      {
        name: 'resume',
        description: 'Resume currently paused music playback.'
      },
      {
        name: 'rewind',
        description: 'Rewind the current song by specified seconds.',
        options: [
          {
            name: 'seconds',
            description: 'Seconds to rewind',
            type: ApplicationCommandOptionType.Integer,
            required: false
          }
        ]
      },
      {
        name: 'search',
        description: 'Search for a song and select from results.',
        options: [
          {
            name: 'query',
            description: 'The search query.',
            type: ApplicationCommandOptionType.String,
            required: true
          }
        ]
      },
      {
        name: 'seek',
        description: 'Seek to a specific position in the current song.',
        options: [
          {
            name: 'time',
            description: 'Time to seek to (e.g. 40, 1:30, 10s, 1m)',
            type: ApplicationCommandOptionType.String,
            required: true
          }
        ]
      },
      {
        name: 'shuffle',
        description: 'Shuffles all upcoming tracks in the queue.'
      },
      {
        name: 'similar',
        description: 'Find similar tracks to the currently playing song.'
      },
      {
        name: 'skip',
        description: 'Skip the current playing song.'
      },
      {
        name: 'skipto',
        description: 'Skip to a specific song in the queue.',
        options: [
          {
            name: 'position',
            description: 'Position in queue to skip to.',
            type: ApplicationCommandOptionType.Integer,
            required: true
          }
        ]
      },
      {
        name: 'sleep',
        description: 'Set a sleep timer to stop music and leave VC after a duration.',
        options: [
          {
            name: 'duration',
            description: 'Duration (e.g. 30m, 1h, 45m) or "cancel" to cancel timer.',
            type: ApplicationCommandOptionType.String,
            required: true
          }
        ]
      },
      {
        name: 'speed',
        description: 'Change the playback speed of the current song.',
        options: [
          {
            name: 'speed',
            description: 'Playback speed (0.25 - 3.0)',
            type: ApplicationCommandOptionType.Number,
            required: false
          }
        ]
      },
      {
        name: 'stop',
        description: 'Stops music playback, clears the queue, and disconnects the bot.'
      },
      {
        name: 'volume',
        description: 'Change the volume of the music player.',
        options: [
          {
            name: 'amount',
            description: 'Volume amount (0-100)',
            type: ApplicationCommandOptionType.Integer,
            required: false
          }
        ]
      },
      {
        name: 'branding',
        description: "Customize the bot's server profile (avatar, banner, bio, nickname)."
      },
      {
        name: 'leaveserver',
        description: 'Force the bot to leave a specific server.',
        options: [
          {
            name: 'guild_id',
            description: 'The ID of the guild to leave.',
            type: ApplicationCommandOptionType.String,
            required: true
          }
        ]
      },
      {
        name: 'mutual',
        description: 'Show mutual servers between the bot and a user.',
        options: [
          {
            name: 'user',
            description: 'The user to check mutual servers with.',
            type: ApplicationCommandOptionType.User,
            required: true
          }
        ]
      },
      {
        name: 'nopaccess',
        description: 'Add, remove, list or check global no-prefix access for users.',
        options: [
          {
            name: 'add',
            description: 'Add a user to global no-prefix access.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'user',
                description: 'The user to add.',
                type: ApplicationCommandOptionType.User,
                required: true
              },
              {
                name: 'duration',
                description: 'Duration (e.g. 24h, 10d, 2w, 1m, 1y or "permanent")',
                type: ApplicationCommandOptionType.String,
                required: false
              }
            ]
          },
          {
            name: 'remove',
            description: 'Remove a user from global no-prefix access.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'user',
                description: 'The user to remove.',
                type: ApplicationCommandOptionType.User,
                required: true
              }
            ]
          },
          {
            name: 'clear',
            description: 'Clear all users from global no-prefix access.',
            type: ApplicationCommandOptionType.Subcommand
          },
          {
            name: 'status',
            description: "Check a user's global no-prefix access status.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'user',
                description: 'The user to check.',
                type: ApplicationCommandOptionType.User,
                required: true
              }
            ]
          },
          {
            name: 'list',
            description: 'List all users with global no-prefix access.',
            type: ApplicationCommandOptionType.Subcommand
          }
        ]
      },
      {
        name: 'reload',
        description: 'Reload a single command or all commands.',
        options: [
          {
            name: 'target',
            description: 'The command to reload, or "all" to reload all commands.',
            type: ApplicationCommandOptionType.String,
            required: true
          }
        ]
      },
      {
        name: 'restart',
        description: 'Restart the bot process.'
      },
      {
        name: 'serverlist',
        description: 'Lists all servers the bot is currently in (Owner-Only).'
      }
    ];

    client.application.commands.set(commandsData)
      .then(() => {
        console.log('[Hikari] Registered application commands globally.');
      })
      .catch((error) => {
        console.error('[Hikari] Error registering application commands:', error);
      });
  },
};

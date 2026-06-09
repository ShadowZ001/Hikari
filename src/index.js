import { Client, GatewayIntentBits, Collection } from 'discord.js';
import 'dotenv/config';
import { startDashboardServer } from './dashboard.js';
import { Shoukaku, Connectors } from 'shoukaku';
import { loadEvents } from './handlers/eventHandler.js';
import { loadCommands } from './handlers/commandHandler.js';
import { connectDatabase } from './database.js';

console.log('\n\x1b[1m\x1b[35m🌌 H I K A R I \x1b[36m— Next-Gen Music Experience\x1b[0m');
console.log('\x1b[37m===========================================\x1b[0m');

// Connect to MongoDB Database
connectDatabase();

// Initialize the Discord Client with standard Guild intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// Initialize collection to store bot commands
client.commands = new Collection();

// Configure Lavalink Node details (Primary & Backup with Auto-Failover)
const Nodes = [
  {
    name: 'NyxBot (Singapore)',
    url: `${process.env.LAVALINK_HOST || 'sg1-nodelink.nyxbot.app'}:${process.env.LAVALINK_PORT || '3000'}`,
    auth: process.env.LAVALINK_PASSWORD || 'nyxbot.app/support',
    secure: process.env.LAVALINK_SECURE === 'true'
  },
  {
    name: 'TriniumHost (US/Backup)',
    url: 'lavalink.triniumhost.com:4333',
    auth: 'free',
    secure: false
  }
];

// Initialize Shoukaku Manager with optimized reconnection, client-side resumption, and latency failover settings
client.shoukaku = new Shoukaku(new Connectors.DiscordJS(client), Nodes, {
  moveOnDisconnect: true,
  resume: true,
  resumeTimeout: 60,
  resumeByLibrary: true,
  reconnectTries: 15,
  reconnectInterval: 10,
  restTimeout: 60,
  voiceConnectionTimeout: 20
});

// Bind Shoukaku events for status tracking
client.shoukaku.on('ready', (name) => console.log(`\x1b[35m⚡ [Lavalink] Node "${name}" connected successfully.\x1b[0m`));
client.shoukaku.on('error', (name, error) => console.error(`\x1b[31m✖ [Lavalink] Node "${name}" encountered an error:\x1b[0m`, error));
client.shoukaku.on('close', (name, code, reason) => console.warn(`\x1b[33m⚠ [Lavalink] Node "${name}" closed. Code: ${code}, Reason: ${reason}\x1b[0m`));
client.shoukaku.on('disconnect', (name, players, moved) => console.warn(`\x1b[33m⚠ [Lavalink] Node "${name}" disconnected. Moved: ${moved}\x1b[0m`));

// Load dynamic commands
loadCommands(client);

// Load the dynamic event handler
loadEvents(client);

// Check if bot token is present
if (!process.env.DISCORD_TOKEN || process.env.DISCORD_TOKEN === 'your_discord_bot_token_here') {
  console.error('\x1b[31m✖ [Client] Error: DISCORD_TOKEN is missing or not configured in .env\x1b[0m');
  process.exit(1);
}

// Log in to the Discord API
console.log('\x1b[36mℹ [Client] Sending handshake to Discord API...\x1b[0m');
client.login(process.env.DISCORD_TOKEN)
  .catch((error) => {
    console.error('\x1b[31m✖ [Client] Login failed:\x1b[0m', error);
  });

// Start the unified Bot + Dashboard Express server
startDashboardServer(client);

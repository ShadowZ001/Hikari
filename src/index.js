import { Client, GatewayIntentBits, Collection } from 'discord.js';
import 'dotenv/config';
import { startDashboardServer } from './dashboard.js';
import { Shoukaku, Connectors } from 'shoukaku';
import { loadEvents } from './handlers/eventHandler.js';
import { loadCommands } from './handlers/commandHandler.js';
import { connectDatabase } from './database.js';

console.log('\n\x1b[1m\x1b[35m🌌 H I K A R I \x1b[36m— Next-Gen Music Experience\x1b[0m');
console.log('\x1b[37m===========================================\x1b[0m');

connectDatabase();

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

client.commands = new Collection();

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

client.shoukaku = new Shoukaku(new Connectors.DiscordJS(client), Nodes, {
  moveOnDisconnect: false,
  resume: true,
  resumeTimeout: 120,
  resumeByLibrary: true,
  reconnectTries: 100,
  reconnectInterval: 5,
  restTimeout: 60,
  voiceConnectionTimeout: 20
});

client.shoukaku.on('ready', (name) => console.log(`\x1b[35m⚡ [Lavalink] Node "${name}" connected successfully.\x1b[0m`));
client.shoukaku.on('error', (name, error) => console.error(`\x1b[31m✖ [Lavalink] Node "${name}" encountered an error:\x1b[0m`, error));
client.shoukaku.on('close', (name, code, reason) => console.warn(`\x1b[33m⚠ [Lavalink] Node "${name}" closed. Code: ${code}, Reason: ${reason}\x1b[0m`));
client.shoukaku.on('disconnect', async (name, players, moved) => {
  console.warn(`\x1b[33m⚠ [Lavalink] Node "${name}" disconnected. Moved: ${moved}\x1b[0m`);

  if (moved) return;

  const healthyNodes = Array.from(client.shoukaku.nodes.values()).filter(n => n.state === 1);
  if (healthyNodes.length > 0) {
    const backupNode = healthyNodes[0];
    console.log(`\x1b[32m✔ [Lavalink] Found healthy backup node "${backupNode.name}". Executing manual failover for ${players.length} players...\x1b[0m`);

    for (const player of players) {
      try {
        await player.move(backupNode.name);
        console.log(`\x1b[32m✔ Moved player in guild ${player.guildId} to ${backupNode.name}\x1b[0m`);
      } catch (e) {
        console.error(`\x1b[31m✖ Failed to move player ${player.guildId}:\x1b[0m`, e.message);
      }
    }
  } else {
    console.error(`\x1b[31m✖ [Lavalink] No backup nodes available. ${players.length} players are stranded until node "${name}" reconnects.\x1b[0m`);
  }
});

loadCommands(client);

loadEvents(client);

if (!process.env.DISCORD_TOKEN || process.env.DISCORD_TOKEN === 'your_discord_bot_token_here') {
  console.error('\x1b[31m✖ [Client] Error: DISCORD_TOKEN is missing or not configured in .env\x1b[0m');
  process.exit(1);
}

console.log('\x1b[36mℹ [Client] Sending handshake to Discord API...\x1b[0m');
client.login(process.env.DISCORD_TOKEN)
  .catch((error) => {
    console.error('\x1b[31m✖ [Client] Login failed:\x1b[0m', error);
  });

startDashboardServer(client);

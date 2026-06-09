import { 
  ContainerBuilder, 
  TextDisplayBuilder, 
  SeparatorBuilder, 
  SeparatorSpacingSize, 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  MessageFlags 
} from 'discord.js';
import os from 'os';
import mongoose from 'mongoose';
import { CONFIG } from '../emojis.js';

// Get total RAM dynamically in MB
const totalMemoryMB = (os.totalmem() / (1024 * 1024)).toFixed(2);

/**
 * Visual statistics layout using Discord Components V2 (Cv2).
 * Supports four interactive pages (Bot, Music, System, Node) selected via a string select menu.
 */
export class StatsLayout {
  /**
   * @param {object} options
   * @param {import('discord.js').Client} options.client The Discord Client instance
   * @param {'bot' | 'music' | 'system' | 'node'} options.category The active statistics category
   * @param {string} options.username The tag/username of the requester
   * @param {string} options.timeString The formatted time string (e.g. 2:22 PM)
   */
  constructor({ client, category = 'bot', username, timeString }) {
    this.container = new ContainerBuilder();
    // Do not call setAccentColor here to avoid a hex colored border, keeping it clean

    // 1. Header (Requested by user + time)
    const headerText = 
      `### Hikari's Statistics\n` +
      `Requested by ${username} • Last Updated: ${timeString}`;
    const headerDisplay = new TextDisplayBuilder().setContent(headerText);
    this.container.addTextDisplayComponents(headerDisplay);

    // 2. Line Divider
    const divider1 = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    this.container.addSeparatorComponents(divider1);

    // 3. Category Title Header
    let categoryTitle = 'Bot Statistics';
    if (category === 'music') categoryTitle = 'Music Statistics';
    else if (category === 'system') categoryTitle = 'System Information';
    else if (category === 'node') categoryTitle = 'Node Performance';

    const categoryHeader = new TextDisplayBuilder().setContent(`**${categoryTitle}**`);
    this.container.addTextDisplayComponents(categoryHeader);

    // 4. Line Divider
    const divider2 = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    this.container.addSeparatorComponents(divider2);

    // 5. Build Category specific statistics text
    let statsContent = '';

    if (category === 'bot') {
      const serverCount = client.guilds.cache.size;
      const userCount = client.guilds.cache.reduce((acc, guild) => acc + (guild.memberCount || 0), 0);
      const channelCount = client.channels.cache.size;
      const commandsCount = client.commands.size;

      statsContent = 
        `\`\`\`\n` +
        `Username      : ${client.user.tag}\n` +
        `Bot ID        : ${client.user.id}\n` +
        `Servers       : ${serverCount}\n` +
        `Users         : ${(userCount / 1000).toFixed(2)}K\n` +
        `Channels      : ${(channelCount / 1000).toFixed(2)}K\n` +
        `Commands      : ${commandsCount}\n` +
        `Shards        : 1 / 1\n` +
        `Clusters      : 1 / 1\n` +
        `\`\`\``;
    } 
    else if (category === 'music') {
      const activePlayers = client.activePlayers?.size || 0;
      let playingNow = 0;
      let pausedPlayers = 0;
      let totalSongsQueue = 0;

      if (client.activePlayers) {
        for (const player of client.activePlayers.values()) {
          if (player.shoukakuPlayer) {
            if (player.shoukakuPlayer.paused) {
              pausedPlayers += 1;
            } else {
              playingNow += 1;
            }
          } else {
            if (player.isPaused) {
              pausedPlayers += 1;
            } else {
              playingNow += 1;
            }
          }

          if (player.playlist?.tracks) {
            totalSongsQueue += player.playlist.tracks.length;
          }
        }
      }

      const connectedNodes = Array.from(client.shoukaku.nodes.values()).filter(n => n.state === 1);
      const nodeNames = connectedNodes.map(n => n.name).join(', ') || 'None';
      const nodeVersions = connectedNodes.map(n => n.info?.version?.semver || n.info?.version || 'v4').join(', ') || 'N/A';

      statsContent = 
        `\`\`\`\n` +
        `Active Players   : ${activePlayers}\n` +
        `Playing Now      : ${playingNow}\n` +
        `Paused Players   : ${pausedPlayers}\n` +
        `Total Songs Queue: ${totalSongsQueue}\n` +
        `Node             : ${nodeNames}\n` +
        `Lavalink Version : ${nodeVersions}\n` +
        `\`\`\``;
    } 
    else if (category === 'system') {
      const apiLatency = client.ws.ping;
      
      // Calculate uptime in format: 0d 14h 20m 15s
      const totalSeconds = Math.floor(client.uptime / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const formattedUptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;

      // Memory usage
      const memory = process.memoryUsage();
      const rssMB = (memory.rss / (1024 * 1024)).toFixed(2);
      const heapUsedMB = (memory.heapUsed / (1024 * 1024)).toFixed(2);
      const heapTotalMB = (memory.heapTotal / (1024 * 1024)).toFixed(2);

      // CPU Info
      const cpus = os.cpus();
      const cpuModel = cpus.length > 0 ? cpus[0].model : 'Unknown';
      const cpuCores = cpus.length;
      const cpuSpeed = cpus.length > 0 ? cpus[0].speed : 0;

      // Platform mapping
      const platform = `${os.platform()} (${os.arch()})`;

      // Dynamic database connection check
      let dbStatus = 'Disconnected';
      if (mongoose.connection.readyState === 1) {
        dbStatus = `${mongoose.connection.name} (Connected)`;
      } else if (mongoose.connection.readyState === 2) {
        dbStatus = 'Connecting...';
      } else if (mongoose.connection.readyState === 3) {
        dbStatus = 'Disconnecting...';
      }

      statsContent = 
        `\`\`\`\n` +
        `API Latency      : ${apiLatency} ms\n` +
        `Uptime           : ${formattedUptime}\n` +
        `Memory (RSS)     : ${rssMB} MB\n` +
        `Heap Used        : ${heapUsedMB} MB\n` +
        `Heap Total       : ${heapTotalMB} MB\n` +
        `Platform         : ${platform}\n` +
        `CPU Model        : ${cpuModel}\n` +
        `CPU Cores        : ${cpuCores}\n` +
        `CPU Speed        : ${cpuSpeed} MHz\n` +
        `Node.js          : ${process.version}\n` +
        `Discord.js       : v14.16.4\n` +
        `Database         : ${dbStatus}\n` +
        `\`\`\``;
    } 
    else if (category === 'node') {
      const freeMemoryMB = (os.freemem() / (1024 * 1024)).toFixed(2);
      const usedMemoryMB = (totalMemoryMB - freeMemoryMB).toFixed(2);

      let nodeDetails = '';
      const connectedNodes = Array.from(client.shoukaku.nodes.values()).filter(n => n.state === 1);

      if (connectedNodes.length === 0) {
        nodeDetails = 'No connected nodes.\n';
      } else {
        for (const n of connectedNodes) {
          const nStats = n.stats;
          const nMemoryUsed = nStats && nStats.memory ? (nStats.memory.used / (1024 * 1024)).toFixed(2) : '0.00';
          const nMemoryAlloc = nStats && nStats.memory ? (nStats.memory.allocated / (1024 * 1024)).toFixed(2) : '0.00';
          const nMemoryFree = nStats && nStats.memory ? (nStats.memory.free / (1024 * 1024)).toFixed(2) : '0.00';
          
          const nCpuLavalink = nStats && nStats.cpu ? (nStats.cpu.lavalinkLoad * 100).toFixed(2) : '0.00';
          const nCpuSystem = nStats && nStats.cpu ? (nStats.cpu.systemLoad * 100).toFixed(2) : '0.00';
          
          const nPing = n.ping !== Infinity && !isNaN(n.ping) ? `${n.ping} ms` : 'N/A';
          nodeDetails += 
            `Node Name        : ${n.name}\n` +
            `Node Ping        : ${nPing}\n` +
            `Node Memory      : ${nMemoryUsed} MB / ${nMemoryAlloc} MB (Free: ${nMemoryFree} MB)\n` +
            `Node CPU Load    : Process: ${nCpuLavalink}% | System: ${nCpuSystem}%\n\n`;
        }
      }

      statsContent = 
        `\`\`\`\n` +
        nodeDetails +
        `System RAM Total : ${totalMemoryMB} MB\n` +
        `System RAM Used  : ${usedMemoryMB} MB\n` +
        `System RAM Free  : ${freeMemoryMB} MB\n` +
        `\`\`\``;
    }

    const statsDisplay = new TextDisplayBuilder().setContent(statsContent);
    this.container.addTextDisplayComponents(statsDisplay);

    // 6. Action Row containing the Category Selection Select Menu
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('stats_select')
      .setPlaceholder(categoryTitle)
      .addOptions([
        {
          label: 'Bot Statistics',
          description: 'View bot information and server counts',
          value: 'bot',
          default: category === 'bot'
        },
        {
          label: 'Music Statistics',
          description: 'View music player and queue information',
          value: 'music',
          default: category === 'music'
        },
        {
          label: 'System Information',
          description: 'View system and platform details',
          value: 'system',
          default: category === 'system'
        },
        {
          label: 'Node Performance',
          description: 'View Lavalink node performance metrics',
          value: 'node',
          default: category === 'node'
        }
      ]);

    const actionRow = new ActionRowBuilder().addComponents(selectMenu);
    this.container.addActionRowComponents(actionRow);
  }

  /**
   * Compiles the layout into a complete Discord message payload object.
   * @param {object} [extraOptions]
   * @returns {object}
   */
  toPayload(extraOptions = {}) {
    return {
      components: [this.container],
      flags: MessageFlags.IsComponentsV2,
      ...extraOptions
    };
  }
}

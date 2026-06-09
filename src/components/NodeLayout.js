import { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } from 'discord.js';

export class NodeLayout {
  /**
   * Generates a dashboard showing stats for all Lavalink nodes.
   * @param {import('shoukaku').Node[]} nodes Array of connected Lavalink nodes
   * @returns {object} Discord message payload
   */
  static nodesCard(nodes) {
    const container = new ContainerBuilder();

    // 1. Title
    const headerDisplay = new TextDisplayBuilder().setContent(`### 🔌 Lavalink Node Monitor`);
    container.addTextDisplayComponents(headerDisplay);

    // 2. Line Divider
    const divider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    container.addSeparatorComponents(divider);

    let bodyContent = '';

    if (nodes.length === 0) {
      bodyContent = `❌ **No Lavalink nodes are currently connected.**`;
    } else {
      nodes.forEach((node, i) => {
        const isConnected = node.state === 1; // 1 = CONNECTED
        const statusEmoji = isConnected ? '🟢' : '🔴';
        const statusText = isConnected ? 'Connected' : 'Disconnected';
        
        bodyContent += `${statusEmoji} **Node #${i + 1}: \`${node.name}\`** [${statusText}]\n`;
        
        if (isConnected && node.stats) {
          const stats = node.stats;
          const players = stats.players || 0;
          const playing = stats.playingPlayers || 0;
          const pingStr = node.ping !== Infinity && !isNaN(node.ping) ? `\`${node.ping}ms\`` : '`N/A`';
          
          // Uptime conversion
          const uptimeMs = stats.uptime || 0;
          const uptimeSec = Math.floor(uptimeMs / 1000);
          const hrs = Math.floor(uptimeSec / 3600);
          const mins = Math.floor((uptimeSec % 3600) / 60);
          const secs = uptimeSec % 60;
          const uptimeStr = `${hrs}h ${mins}m ${secs}s`;

          // CPU percentage
          const sysCpu = ((stats.cpu?.systemLoad || 0) * 100).toFixed(1);
          const lavaCpu = ((stats.cpu?.lavalinkLoad || 0) * 100).toFixed(1);

          // Memory MB
          const usedMem = Math.round((stats.memory?.used || 0) / 1024 / 1024);
          const allocMem = Math.round((stats.memory?.allocated || 0) / 1024 / 1024);

          bodyContent += 
            `├─ 🌐 **Ping:** ${pingStr} • ⏱️ **Uptime:** \`${uptimeStr}\`\n` +
            `├─ 🎵 **Players:** \`${playing}\` playing / \`${players}\` active\n` +
            `├─ 💻 **CPU:** System \`${sysCpu}%\` / Lavalink \`${lavaCpu}%\` (Cores: \`${stats.cpu?.cores || 1}\`)\n` +
            `└─ 💾 **Memory:** \`${usedMem}MB\` used / \`${allocMem}MB\` allocated\n\n`;
        } else {
          bodyContent += `└─ *No statistics available for this node.*\n\n`;
        }
      });
    }

    const bodyDisplay = new TextDisplayBuilder().setContent(bodyContent.trim());
    container.addTextDisplayComponents(bodyDisplay);

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };
  }
}

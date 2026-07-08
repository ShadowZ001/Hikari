import { ContainerBuilder, TextDisplayBuilder, MessageFlags } from 'discord.js';
import { EMOJIS } from '../emojis.js';

function formatUptime(uptimeMs) {
  const totalSeconds = Math.floor(uptimeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h  ${minutes}m`;
}

export class PingLayout {

  constructor({ msgLatency, apiLatency, uptimeMs, commandsCount }) {
    this.container = new ContainerBuilder();

    const checkEmoji = EMOJIS.checkk || '<:checkk:1498633200346464276>';
    const bulletEmoji = EMOJIS.whitedot || '<:WhiteDot:1513098965325840394>';

    const uptime = formatUptime(uptimeMs);

    const content =
      `**${checkEmoji} Pong!**\n` +
      `**${bulletEmoji} Message Latency:** ${msgLatency}ms\n` +
      `**${bulletEmoji} API Latency:** ${apiLatency}ms\n` +
      `**${bulletEmoji} Uptime:** ${uptime}\n` +
      `**${bulletEmoji} Loaded Commands:** ${commandsCount}`;

    const textDisplay = new TextDisplayBuilder().setContent(content);
    this.container.addTextDisplayComponents(textDisplay);
  }

  toPayload(extraOptions = {}) {
    return {
      components: [this.container],
      flags: MessageFlags.IsComponentsV2,
      ...extraOptions
    };
  }
}

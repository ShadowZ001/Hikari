import { ContainerBuilder, TextDisplayBuilder, MessageFlags } from 'discord.js';
import { EMOJIS } from '../emojis.js';

/**
 * Formats bot uptime into human-readable format.
 * @param {number} uptimeMs 
 * @returns {string} e.g. "14h 3m" or "0h 5m"
 */
function formatUptime(uptimeMs) {
  const totalSeconds = Math.floor(uptimeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h  ${minutes}m`;
}

/**
 * Visual layout panel sent when checking the bot's ping/latency.
 * Utilizes Discord Components V2 (Cv2).
 */
export class PingLayout {
  /**
   * @param {object} options
   * @param {number} options.msgLatency Message round-trip latency in ms
   * @param {number} options.apiLatency WebSocket connection ping in ms
   * @param {number} options.uptimeMs Client uptime in ms
   * @param {number} options.commandsCount Total loaded commands count
   */
  constructor({ msgLatency, apiLatency, uptimeMs, commandsCount }) {
    this.container = new ContainerBuilder();
    // Do not call setAccentColor here to avoid a hex colored border, keeping it clean

    const checkEmoji = EMOJIS.checkk || '<:checkk:1498633200346464276>';
    const bulletEmoji = EMOJIS.whitedot || '<:WhiteDot:1513098965325840394>';

    const uptime = formatUptime(uptimeMs);

    // Build the ping stats in a single text block for close consecutive vertical alignment
    const content = 
      `**${checkEmoji} Pong!**\n` +
      `**${bulletEmoji} Message Latency:** ${msgLatency}ms\n` +
      `**${bulletEmoji} API Latency:** ${apiLatency}ms\n` +
      `**${bulletEmoji} Uptime:** ${uptime}\n` +
      `**${bulletEmoji} Loaded Commands:** ${commandsCount}`;

    const textDisplay = new TextDisplayBuilder().setContent(content);
    this.container.addTextDisplayComponents(textDisplay);
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

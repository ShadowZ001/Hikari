import { StatsLayout } from '../components/StatsLayout.js';

/**
 * Returns formatted time string matching H:MM AM/PM.
 * @returns {string}
 */
function getFormattedTime() {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

export default {
  name: 'stats',
  description: 'Displays the bot and system statistics.',

  /**
   * Execution handler for prefix commands (e.g. >stats).
   * @param {import('discord.js').Message} message 
   * @param {string[]} args 
   */
  async execute(message, args) {
    try {
      const client = message.client;
      const username = message.author.tag;
      const timeString = getFormattedTime();

      const layout = new StatsLayout({
        client,
        category: 'bot',
        username,
        timeString
      });

      const reply = await message.reply(layout.toPayload());
      
      // Register this message as an active stats session for live updates
      if (!client.statsSessions) {
        client.statsSessions = new Map();
      }
      client.statsSessions.set(reply.id, {
        channelId: message.channelId,
        category: 'bot',
        username,
        timeString,
        lastUpdated: Date.now()
      });

      console.log(`[Hikari] Stats dashboard sent to ${message.author.tag} in prefix mode`);
    } catch (error) {
      console.error('[Hikari] Error executing prefix stats command:', error);
    }
  },

  /**
   * Execution handler for slash commands (e.g. /stats).
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   */
  async executeSlash(interaction) {
    try {
      const client = interaction.client;
      const username = interaction.user.tag;
      const timeString = getFormattedTime();

      const layout = new StatsLayout({
        client,
        category: 'bot',
        username,
        timeString
      });

      const reply = await interaction.reply({ ...layout.toPayload(), fetchReply: true });
      
      // Register this message as an active stats session for live updates
      if (!client.statsSessions) {
        client.statsSessions = new Map();
      }
      client.statsSessions.set(reply.id, {
        channelId: interaction.channelId,
        category: 'bot',
        username,
        timeString,
        lastUpdated: Date.now()
      });

      console.log(`[Hikari] Stats dashboard sent to ${interaction.user.tag} in slash mode`);
    } catch (error) {
      console.error('[Hikari] Error executing slash stats command:', error);
    }
  }
};

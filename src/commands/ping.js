import { PingLayout } from '../components/PingLayout.js';

export default {
  name: 'ping',
  description: 'Checks the bot connection latency and system stats.',

  /**
   * Execution handler for prefix commands (e.g. >ping).
   * @param {import('discord.js').Message} message 
   * @param {string[]} args 
   */
  async execute(message, args) {
    try {
      // Calculate round-trip message latency
      const msgLatency = Date.now() - message.createdTimestamp;
      const apiLatency = message.client.ws.ping;
      const uptimeMs = message.client.uptime;
      const commandsCount = message.client.commands.size;

      const pingLayout = new PingLayout({
        msgLatency,
        apiLatency,
        uptimeMs,
        commandsCount
      });

      await message.reply(pingLayout.toPayload());
      console.log(`[Hikari] Ping response sent to ${message.author.tag} in prefix mode`);
    } catch (error) {
      console.error('[Hikari] Error executing prefix ping command:', error);
    }
  },

  /**
   * Execution handler for slash commands (e.g. /ping).
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   */
  async executeSlash(interaction) {
    try {
      // Calculate round-trip interaction latency
      const msgLatency = Date.now() - interaction.createdTimestamp;
      const apiLatency = interaction.client.ws.ping;
      const uptimeMs = interaction.client.uptime;
      const commandsCount = interaction.client.commands.size;

      const pingLayout = new PingLayout({
        msgLatency,
        apiLatency,
        uptimeMs,
        commandsCount
      });

      await interaction.reply(pingLayout.toPayload());
      console.log(`[Hikari] Ping response sent to ${interaction.user.tag} in slash mode`);
    } catch (error) {
      console.error('[Hikari] Error executing slash ping command:', error);
    }
  }
};

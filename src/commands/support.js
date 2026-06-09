import { SupportLayout } from '../components/SupportLayout.js';

export default {
  name: 'support',
  description: 'Generates the support server link in a beautiful V2 layout.',

  /**
   * Execution handler for prefix commands (e.g. >support).
   * @param {import('discord.js').Message} message 
   * @param {string[]} args 
   */
  async execute(message, args) {
    try {
      const supportLayout = new SupportLayout();
      
      await message.reply(supportLayout.toPayload());
      console.log(`[Hikari] Support server link sent to ${message.author.tag} in prefix mode`);
    } catch (error) {
      console.error('[Hikari] Error executing prefix support command:', error);
    }
  },

  /**
   * Execution handler for slash commands (e.g. /support).
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   */
  async executeSlash(interaction) {
    try {
      const supportLayout = new SupportLayout();

      await interaction.reply(supportLayout.toPayload());
      console.log(`[Hikari] Support server link sent to ${interaction.user.tag} in slash mode`);
    } catch (error) {
      console.error('[Hikari] Error executing slash support command:', error);
    }
  }
};

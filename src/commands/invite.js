import { InviteLayout } from '../components/InviteLayout.js';

export default {
  name: 'invite',
  description: 'Generates the bot invite link in a beautiful V2 layout.',

  /**
   * Execution handler for prefix commands (e.g. >invite).
   * @param {import('discord.js').Message} message 
   * @param {string[]} args 
   */
  async execute(message, args) {
    try {
      const clientId = message.client.user.id || process.env.CLIENT_ID;
      const inviteLayout = new InviteLayout(clientId);
      
      await message.reply(inviteLayout.toPayload());
      console.log(`[Hikari] Invite link sent to ${message.author.tag} in prefix mode`);
    } catch (error) {
      console.error('[Hikari] Error executing prefix invite command:', error);
    }
  },

  /**
   * Execution handler for slash commands (e.g. /invite).
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   */
  async executeSlash(interaction) {
    try {
      const clientId = interaction.client.user.id || process.env.CLIENT_ID;
      const inviteLayout = new InviteLayout(clientId);

      await interaction.reply(inviteLayout.toPayload());
      console.log(`[Hikari] Invite link sent to ${interaction.user.tag} in slash mode`);
    } catch (error) {
      console.error('[Hikari] Error executing slash invite command:', error);
    }
  }
};

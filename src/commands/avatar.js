import { AvatarLayout } from '../components/AvatarLayout.js';

/**
 * Returns formatted time string matching H:MM AM/PM.
 * @returns {string}
 */
function getFormattedTime() {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export default {
  name: 'avatar',
  description: "Displays a user's avatar in a beautiful V2 layout.",

  /**
   * Execution handler for prefix commands (e.g. >avatar).
   * @param {import('discord.js').Message} message 
   * @param {string[]} args 
   */
  async execute(message, args) {
    try {
      let targetUser = message.mentions.users.first();
      
      if (!targetUser && args[0]) {
        const userId = args[0].replace(/[<@!>]/g, '');
        if (/^\d+$/.test(userId)) {
          targetUser = await message.client.users.fetch(userId).catch(() => null);
        }
      }

      // Default to the message author if no user was resolved
      if (!targetUser) {
        targetUser = message.author;
      }

      const timeString = getFormattedTime();
      const layout = new AvatarLayout({
        targetUser,
        requester: message.author,
        timeString
      });

      await message.reply(layout.toPayload());
      console.log(`[Hikari] Avatar sent for ${targetUser.tag} requested by ${message.author.tag} in prefix mode`);
    } catch (error) {
      console.error('[Hikari] Error executing prefix avatar command:', error);
    }
  },

  /**
   * Execution handler for slash commands (e.g. /avatar).
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   */
  async executeSlash(interaction) {
    try {
      const targetUser = interaction.options.getUser('user') || interaction.user;
      const timeString = getFormattedTime();

      const layout = new AvatarLayout({
        targetUser,
        requester: interaction.user,
        timeString
      });

      await interaction.reply(layout.toPayload());
      console.log(`[Hikari] Avatar sent for ${targetUser.tag} requested by ${interaction.user.tag} in slash mode`);
    } catch (error) {
      console.error('[Hikari] Error executing slash avatar command:', error);
    }
  }
};

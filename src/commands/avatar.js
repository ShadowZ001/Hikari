import { AvatarLayout } from '../components/AvatarLayout.js';

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

  async execute(message, args) {
    try {
      let targetUser = message.mentions.users.first();

      if (!targetUser && args[0]) {
        const userId = args[0].replace(/[<@!>]/g, '');
        if (/^\d+$/.test(userId)) {
          targetUser = await message.client.users.fetch(userId).catch(() => null);
        }
      }

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

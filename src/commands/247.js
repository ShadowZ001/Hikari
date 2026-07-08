import { Status247Layout } from '../components/Status247Layout.js';

export default {
  name: '247',
  description: 'Toggles or checks the bot 24/7 connection status.',

  async execute(message, args) {
    try {
      const client = message.client;
      const guildId = message.guildId;

      if (!client.status247) {
        client.status247 = new Map();
      }

      const status = client.status247.get(guildId) || 'Disabled';
      const username = message.author.tag;

      const layout = new Status247Layout({ status, username });
      await message.reply(layout.toPayload());

      console.log(`[Hikari] 24/7 status card sent to ${message.author.tag} in prefix mode`);
    } catch (error) {
      console.error('[Hikari] Error executing prefix 247 command:', error);
    }
  },

  async executeSlash(interaction) {
    try {
      const client = interaction.client;
      const guildId = interaction.guildId;

      if (!client.status247) {
        client.status247 = new Map();
      }

      const status = client.status247.get(guildId) || 'Disabled';
      const username = interaction.user.tag;

      const layout = new Status247Layout({ status, username });
      await interaction.reply(layout.toPayload());

      console.log(`[Hikari] 24/7 status card sent to ${interaction.user.tag} in slash mode`);
    } catch (error) {
      console.error('[Hikari] Error executing slash 247 command:', error);
    }
  }
};

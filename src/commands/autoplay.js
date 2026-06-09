import { PrefixLayout } from '../components/PrefixLayout.js';
import { EMOJIS } from '../emojis.js';
import { checkVoiceChannel } from '../components/VoiceWarningLayout.js';

export default {
  name: 'autoplay',
  aliases: ['ap', 'auto'],
  description: 'Toggle autoplay mode.',

  async executeSlash(interaction) {
    try {
      const client = interaction.client;
      const player = client.activePlayers?.get(interaction.guildId);

      if (!player) {
        const card = PrefixLayout.messageCard('❌', '**No active music player found in this server.**');
        return interaction.reply({ ...card, ephemeral: false });
      }

      const connected = await checkVoiceChannel(interaction);
      if (!connected) return;

      player.autoplay = !player.autoplay;

      const checkEmoji = EMOJIS.checkk || '✅';
      const card = PrefixLayout.messageCard(checkEmoji, `**Autoplay has been \`${player.autoplay ? "Enabled" : "Disabled"}\`.**`);
      return interaction.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while toggling autoplay.**');
      return interaction.reply({ ...card, ephemeral: true });
    }
  },

  async execute(message, args) {
    try {
      const client = message.client;
      const player = client.activePlayers?.get(message.guildId);

      if (!player) {
        const card = PrefixLayout.messageCard('❌', '**No active music player found in this server.**');
        return message.reply(card);
      }

      const connected = await checkVoiceChannel(message);
      if (!connected) return;

      player.autoplay = !player.autoplay;

      const checkEmoji = EMOJIS.checkk || '✅';
      const card = PrefixLayout.messageCard(checkEmoji, `**Autoplay has been \`${player.autoplay ? "Enabled" : "Disabled"}\`.**`);
      return message.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while toggling autoplay.**');
      return message.reply(card);
    }
  }
};

import { QueueLayout } from '../components/QueueLayout.js';
import { PrefixLayout } from '../components/PrefixLayout.js';
import { EMOJIS } from '../emojis.js';

export default {
  name: 'queue',
  aliases: ['q'],
  description: 'Show the music queue for this server.',

  async executeSlash(interaction) {
    try {
      const client = interaction.client;
      const player = client.activePlayers?.get(interaction.guildId);

      if (!player || player.playlist.tracks.length === 0) {
        const card = PrefixLayout.messageCard(EMOJIS.infoo || 'ℹ️', '**The queue is currently empty.**');
        return interaction.reply({ ...card, ephemeral: false });
      }

      const pageInput = interaction.options.getInteger('page') || 1;
      const card = QueueLayout.queueCard(player, pageInput - 1, interaction.user);
      return interaction.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while loading the queue.**');
      return interaction.reply({ ...card, ephemeral: true });
    }
  },

  async execute(message, args) {
    try {
      const client = message.client;
      const player = client.activePlayers?.get(message.guildId);

      if (!player || player.playlist.tracks.length === 0) {
        const card = PrefixLayout.messageCard(EMOJIS.infoo || 'ℹ️', '**The queue is currently empty.**');
        return message.reply(card);
      }

      let pageInput = 1;
      if (args[0]) {
        const parsed = parseInt(args[0], 10);
        if (!isNaN(parsed) && parsed > 0) {
          pageInput = parsed;
        }
      }

      const card = QueueLayout.queueCard(player, pageInput - 1, message.author);
      return message.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while loading the queue.**');
      return message.reply(card);
    }
  }
};

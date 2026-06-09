import Liked from '../models/Liked.js';
import { LikedLayout } from '../components/LikedLayout.js';
import { PrefixLayout } from '../components/PrefixLayout.js';

export default {
  name: 'showliked',
  aliases: ['liked', 'favorites', 'favourites', 'showlike'],
  description: 'Show your favorite songs.',

  async executeSlash(interaction) {
    try {
      const userId = interaction.user.id;
      const userLiked = await Liked.findOne({ userId });
      const songs = userLiked ? userLiked.songs : [];

      const pageInput = interaction.options.getInteger('page') || 1;
      const itemsPerPage = 10;
      const totalPages = Math.max(1, Math.ceil(songs.length / itemsPerPage));
      const pageIndex = Math.max(0, Math.min(pageInput - 1, totalPages - 1));

      const card = LikedLayout.listCard(songs, pageIndex, totalPages, interaction.user);
      return interaction.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while loading your favorites list.**');
      return interaction.reply({ ...card, ephemeral: true });
    }
  },

  async execute(message, args) {
    try {
      const userId = message.author.id;
      const userLiked = await Liked.findOne({ userId });
      const songs = userLiked ? userLiked.songs : [];

      let pageInput = 1;
      if (args[0]) {
        const parsed = parseInt(args[0], 10);
        if (!isNaN(parsed) && parsed > 0) {
          pageInput = parsed;
        }
      }

      const itemsPerPage = 10;
      const totalPages = Math.max(1, Math.ceil(songs.length / itemsPerPage));
      const pageIndex = Math.max(0, Math.min(pageInput - 1, totalPages - 1));

      const card = LikedLayout.listCard(songs, pageIndex, totalPages, message.author);
      return message.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while loading your favorites list.**');
      return message.reply(card);
    }
  }
};

import Liked from '../models/Liked.js';
import { PrefixLayout } from '../components/PrefixLayout.js';
import { EMOJIS } from '../emojis.js';

export default {
  name: 'likeall',
  aliases: ['lall', 'likequeue', 'likeable'],
  description: 'Add all songs from the current queue to your favorites.',

  async executeSlash(interaction) {
    try {
      const client = interaction.client;
      const player = client.activePlayers?.get(interaction.guildId);

      if (!player || player.playlist.tracks.length === 0) {
        const card = PrefixLayout.messageCard('❌', '**There is no active queue to save to favorites.**');
        return interaction.reply({ ...card, ephemeral: false });
      }

      // Collect current and remaining tracks
      const tracks = player.playlist.tracks.slice(player.currentIndex);
      if (tracks.length === 0) {
        const card = PrefixLayout.messageCard('❌', '**There are no upcoming songs in the queue.**');
        return interaction.reply({ ...card, ephemeral: false });
      }

      const userId = interaction.user.id;
      let userLiked = await Liked.findOne({ userId });
      if (!userLiked) {
        userLiked = new Liked({ userId, songs: [] });
      }

      let addedCount = 0;
      let alreadyLikedCount = 0;
      const existingUrls = new Set(userLiked.songs.map(song => song.uri));

      for (const track of tracks) {
        if (track.uri && !existingUrls.has(track.uri)) {
          userLiked.songs.push({
            title: track.title,
            uri: track.uri,
            duration: track.duration,
            thumbnail: track.thumbnail,
            artist: track.artist || track.author || 'Unknown Artist',
            durationMs: track.durationMs
          });
          existingUrls.add(track.uri);
          addedCount++;
        } else if (track.uri) {
          alreadyLikedCount++;
        }
      }

      if (addedCount > 0) {
        await userLiked.save();
      }

      const checkEmoji = EMOJIS.checkk || '✅';
      const infoEmoji = EMOJIS.infoo || 'ℹ️';
      let statusStr = '';
      if (addedCount > 0) {
        statusStr += `**${checkEmoji} Added \`${addedCount}\` songs to your favorites.**\n`;
      }
      if (alreadyLikedCount > 0) {
        statusStr += `**${infoEmoji} \`${alreadyLikedCount}\` songs were already in your favorites.**`;
      }

      const card = PrefixLayout.messageCard(checkEmoji, statusStr.trim());
      return interaction.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while saving queue to favorites.**');
      return interaction.reply({ ...card, ephemeral: true });
    }
  },

  async execute(message, args) {
    try {
      const client = message.client;
      const player = client.activePlayers?.get(message.guildId);

      if (!player || player.playlist.tracks.length === 0) {
        const card = PrefixLayout.messageCard('❌', '**There is no active queue to save to favorites.**');
        return message.reply(card);
      }

      // Collect current and remaining tracks
      const tracks = player.playlist.tracks.slice(player.currentIndex);
      if (tracks.length === 0) {
        const card = PrefixLayout.messageCard('❌', '**There are no upcoming songs in the queue.**');
        return message.reply(card);
      }

      const userId = message.author.id;
      let userLiked = await Liked.findOne({ userId });
      if (!userLiked) {
        userLiked = new Liked({ userId, songs: [] });
      }

      let addedCount = 0;
      let alreadyLikedCount = 0;
      const existingUrls = new Set(userLiked.songs.map(song => song.uri));

      for (const track of tracks) {
        if (track.uri && !existingUrls.has(track.uri)) {
          userLiked.songs.push({
            title: track.title,
            uri: track.uri,
            duration: track.duration,
            thumbnail: track.thumbnail,
            artist: track.artist || track.author || 'Unknown Artist',
            durationMs: track.durationMs
          });
          existingUrls.add(track.uri);
          addedCount++;
        } else if (track.uri) {
          alreadyLikedCount++;
        }
      }

      if (addedCount > 0) {
        await userLiked.save();
      }

      const checkEmoji = EMOJIS.checkk || '✅';
      const infoEmoji = EMOJIS.infoo || 'ℹ️';
      let statusStr = '';
      if (addedCount > 0) {
        statusStr += `**${checkEmoji} Added \`${addedCount}\` songs to your favorites.**\n`;
      }
      if (alreadyLikedCount > 0) {
        statusStr += `**${infoEmoji} \`${alreadyLikedCount}\` songs were already in your favorites.**`;
      }

      const card = PrefixLayout.messageCard(checkEmoji, statusStr.trim());
      return message.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while saving queue to favorites.**');
      return message.reply(card);
    }
  }
};

import Liked from '../models/Liked.js';
import { LikedLayout } from '../components/LikedLayout.js';
import { PrefixLayout } from '../components/PrefixLayout.js';

export default {
  name: 'like',
  aliases: ['fav', 'favourite', 'favorite'],
  description: 'Add the currently playing song to your favorites.',

  async executeSlash(interaction) {
    try {
      const client = interaction.client;
      const player = client.activePlayers?.get(interaction.guildId);

      if (!player || !player.currentTrack) {
        const card = PrefixLayout.messageCard('❌', '**Nothing is playing right now.**');
        return interaction.reply({ ...card, ephemeral: false });
      }

      const song = player.currentTrack;
      const userId = interaction.user.id;

      let userLiked = await Liked.findOne({ userId });
      if (!userLiked) {
        userLiked = new Liked({ userId, songs: [] });
      }

      const songExists = userLiked.songs.find(s => s.uri === song.uri);
      if (songExists) {
        const card = LikedLayout.alreadyLiked(song);
        return interaction.reply({ ...card, ephemeral: false });
      }

      userLiked.songs.push({
        title: song.title,
        uri: song.uri,
        duration: song.duration,
        thumbnail: song.thumbnail,
        artist: song.artist || song.author || 'Unknown Artist',
        durationMs: song.durationMs
      });

      await userLiked.save();

      const card = LikedLayout.successLiked(song, interaction.user);
      return interaction.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while saving this song to favorites.**');
      return interaction.reply({ ...card, ephemeral: true });
    }
  },

  async execute(message, args) {
    try {
      const client = message.client;
      const player = client.activePlayers?.get(message.guildId);

      if (!player || !player.currentTrack) {
        const card = PrefixLayout.messageCard('❌', '**Nothing is playing right now.**');
        return message.reply(card);
      }

      const song = player.currentTrack;
      const userId = message.author.id;

      let userLiked = await Liked.findOne({ userId });
      if (!userLiked) {
        userLiked = new Liked({ userId, songs: [] });
      }

      const songExists = userLiked.songs.find(s => s.uri === song.uri);
      if (songExists) {
        const card = LikedLayout.alreadyLiked(song);
        return message.reply(card);
      }

      userLiked.songs.push({
        title: song.title,
        uri: song.uri,
        duration: song.duration,
        thumbnail: song.thumbnail,
        artist: song.artist || song.author || 'Unknown Artist',
        durationMs: song.durationMs
      });

      await userLiked.save();

      const card = LikedLayout.successLiked(song, message.author);
      return message.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while saving this song to favorites.**');
      return message.reply(card);
    }
  }
};

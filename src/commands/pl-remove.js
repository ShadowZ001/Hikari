import Playlist from '../models/Playlist.js';
import { PlaylistLayout } from '../components/PlaylistLayout.js';
import { EMOJIS } from '../emojis.js';

export default {
  name: 'pl-remove',
  description: 'Remove a track from one of your playlists.',
  category: 'Playlist',
  usage: '<playlist name> | <song name or index>',

  /**
   * @param {import('discord.js').Message} message 
   * @param {string[]} args 
   */
  async execute(message, args) {
    try {
      const content = args.join(' ').trim();
      const warnEmoji = EMOJIS.warnnn || '<:warnnn:1498633209246646393>';

      if (!content) {
        let prefix = '>';
        if (message.guildId && message.client.guildPrefixes) {
          prefix = message.client.guildPrefixes.get(message.guildId) || '>';
        }
        return message.reply(PlaylistLayout.messageCardWithDesc(
          warnEmoji,
          'Provide a playlist name and track to remove.',
          `Usage: ${prefix}pl-remove <playlist name> | <song name or index>`
        ));
      }

      let playlistName = '';
      let trackQuery = '';

      if (content.includes('|')) {
        const parts = content.split('|');
        playlistName = parts[0].trim();
        trackQuery = parts[1]?.trim();
      } else {
        // Try to match against existing playlist names for this user
        const playlists = await Playlist.find({ userId: message.author.id });
        const match = playlists.find(pl => content.toLowerCase().startsWith(pl.name.toLowerCase()));
        if (match) {
          playlistName = match.name;
          trackQuery = content.slice(match.name.length).trim();
        } else {
          // Fallback: first word is playlist, rest is track
          const words = content.split(/ +/);
          playlistName = words[0];
          trackQuery = words.slice(1).join(' ');
        }
      }

      const playlist = await Playlist.findOne({ userId: message.author.id, name: playlistName });
      if (!playlist) {
        return message.reply(PlaylistLayout.messageCard(warnEmoji, `I could not find a playlist named ${playlistName}.`));
      }

      if (!trackQuery) {
        let prefix = '>';
        if (message.guildId && message.client.guildPrefixes) {
          prefix = message.client.guildPrefixes.get(message.guildId) || '>';
        }
        return message.reply(PlaylistLayout.messageCardWithDesc(
          warnEmoji,
          'Provide the track to remove.',
          `Usage: ${prefix}pl-remove <playlist name> | <song name or index>`
        ));
      }

      let removedTrackTitle = '';
      
      // Try to parse track index
      const index = parseInt(trackQuery, 10);
      if (!isNaN(index) && index > 0 && index <= playlist.tracks.length) {
        const removed = playlist.tracks[index - 1];
        removedTrackTitle = removed.title;
        playlist.tracks = playlist.tracks.filter((_, idx) => idx !== index - 1);
      } else {
        // Try to search by track title (case-insensitive)
        const matchIndex = playlist.tracks.findIndex(
          t => t.title.toLowerCase().includes(trackQuery.toLowerCase())
        );
        if (matchIndex > -1) {
          const removed = playlist.tracks[matchIndex];
          removedTrackTitle = removed.title;
          playlist.tracks = playlist.tracks.filter((_, idx) => idx !== matchIndex);
        }
      }

      if (!removedTrackTitle) {
        return message.reply(PlaylistLayout.messageCard(warnEmoji, `Could not find track "${trackQuery}" in playlist ${playlistName}.`));
      }

      playlist.markModified('tracks');
      await playlist.save();

      const checkEmoji = EMOJIS.checkk || '<:checkk:1498633200346464276>';
      return message.reply(PlaylistLayout.messageCard(
        checkEmoji,
        `Removed track "${removedTrackTitle}" from playlist ${playlistName}.`
      ));
    } catch (error) {
      console.error('[Hikari] Error in pl-remove command:', error);
    }
  },

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   */
  async executeSlash(interaction) {
    try {
      const playlistName = interaction.options.getString('playlist', true).trim();
      const trackQuery = interaction.options.getString('track', true).trim();
      const warnEmoji = EMOJIS.warnnn || '<:warnnn:1498633209246646393>';

      const playlist = await Playlist.findOne({ userId: interaction.user.id, name: playlistName });
      if (!playlist) {
        return interaction.reply(PlaylistLayout.messageCard(warnEmoji, `I could not find a playlist named ${playlistName}.`));
      }

      let removedTrackTitle = '';
      
      const index = parseInt(trackQuery, 10);
      if (!isNaN(index) && index > 0 && index <= playlist.tracks.length) {
        const removed = playlist.tracks[index - 1];
        removedTrackTitle = removed.title;
        playlist.tracks = playlist.tracks.filter((_, idx) => idx !== index - 1);
      } else {
        const matchIndex = playlist.tracks.findIndex(
          t => t.title.toLowerCase().includes(trackQuery.toLowerCase())
        );
        if (matchIndex > -1) {
          const removed = playlist.tracks[matchIndex];
          removedTrackTitle = removed.title;
          playlist.tracks = playlist.tracks.filter((_, idx) => idx !== matchIndex);
        }
      }

      if (!removedTrackTitle) {
        return interaction.reply(PlaylistLayout.messageCard(warnEmoji, `Could not find track "${trackQuery}" in playlist ${playlistName}.`));
      }

      playlist.markModified('tracks');
      await playlist.save();

      const checkEmoji = EMOJIS.checkk || '<:checkk:1498633200346464276>';
      return interaction.reply(PlaylistLayout.messageCard(
        checkEmoji,
        `Removed track "${removedTrackTitle}" from playlist ${playlistName}.`
      ));
    } catch (error) {
      console.error('[Hikari] Error in pl-remove slash command:', error);
    }
  }
};

import Playlist from '../models/Playlist.js';
import { PlaylistLayout } from '../components/PlaylistLayout.js';
import { EMOJIS } from '../emojis.js';

export default {
  name: 'pl-delete',
  description: 'Delete one of your playlists.',
  category: 'Playlist',
  usage: '<playlist name>',

  /**
   * @param {import('discord.js').Message} message 
   * @param {string[]} args 
   */
  async execute(message, args) {
    try {
      const playlistName = args.join(' ').trim();
      const warnEmoji = EMOJIS.warnnn || '<:warnnn:1498633209246646393>';

      if (!playlistName) {
        let prefix = '>';
        if (message.guildId && message.client.guildPrefixes) {
          prefix = message.client.guildPrefixes.get(message.guildId) || '>';
        }
        return message.reply(PlaylistLayout.messageCardWithDesc(
          warnEmoji,
          'Provide a playlist name.',
          `Usage: ${prefix}pl-delete <playlist name>`
        ));
      }

      const result = await Playlist.deleteOne({ userId: message.author.id, name: playlistName });
      if (result.deletedCount === 0) {
        return message.reply(PlaylistLayout.messageCard(warnEmoji, `I could not find a playlist named ${playlistName}.`));
      }

      const checkEmoji = EMOJIS.checkk || '<:checkk:1498633200346464276>';
      return message.reply(PlaylistLayout.messageCardWithDesc(
        checkEmoji,
        `Deleted playlist ${playlistName}`,
        'The playlist and all its saved tracks have been removed.'
      ));
    } catch (error) {
      console.error('[Hikari] Error in pl-delete command:', error);
    }
  },

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   */
  async executeSlash(interaction) {
    try {
      const playlistName = interaction.options.getString('name', true).trim();
      const warnEmoji = EMOJIS.warnnn || '<:warnnn:1498633209246646393>';

      const result = await Playlist.deleteOne({ userId: interaction.user.id, name: playlistName });
      if (result.deletedCount === 0) {
        return interaction.reply(PlaylistLayout.messageCard(warnEmoji, `I could not find a playlist named ${playlistName}.`));
      }

      const checkEmoji = EMOJIS.checkk || '<:checkk:1498633200346464276>';
      return interaction.reply(PlaylistLayout.messageCardWithDesc(
        checkEmoji,
        `Deleted playlist ${playlistName}`,
        'The playlist and all its saved tracks have been removed.'
      ));
    } catch (error) {
      console.error('[Hikari] Error in pl-delete slash command:', error);
    }
  }
};

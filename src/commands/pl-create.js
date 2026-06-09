import Playlist from '../models/Playlist.js';
import { PlaylistLayout } from '../components/PlaylistLayout.js';
import { EMOJIS } from '../emojis.js';

export default {
  name: 'pl-create',
  description: 'Create a new playlist.',
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
          `Usage: ${prefix}pl-create <playlist name>`
        ));
      }

      const existing = await Playlist.findOne({ userId: message.author.id, name: playlistName });
      if (existing) {
        return message.reply(PlaylistLayout.messageCard(warnEmoji, `A playlist named ${playlistName} already exists.`));
      }

      const playlist = new Playlist({
        userId: message.author.id,
        name: playlistName,
        tracks: []
      });
      await playlist.save();

      const checkEmoji = EMOJIS.checkk || '<:checkk:1498633200346464276>';
      return message.reply(PlaylistLayout.messageCardWithDesc(
        checkEmoji,
        `Created playlist ${playlistName}`,
        `You can now use .pl-add ${playlistName} | song name to save tracks into it.`
      ));
    } catch (error) {
      console.error('[Hikari] Error in pl-create command:', error);
    }
  },

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   */
  async executeSlash(interaction) {
    try {
      const playlistName = interaction.options.getString('name', true).trim();
      const warnEmoji = EMOJIS.warnnn || '<:warnnn:1498633209246646393>';

      const existing = await Playlist.findOne({ userId: interaction.user.id, name: playlistName });
      if (existing) {
        return interaction.reply(PlaylistLayout.messageCard(warnEmoji, `A playlist named ${playlistName} already exists.`));
      }

      const playlist = new Playlist({
        userId: interaction.user.id,
        name: playlistName,
        tracks: []
      });
      await playlist.save();

      const checkEmoji = EMOJIS.checkk || '<:checkk:1498633200346464276>';
      return interaction.reply(PlaylistLayout.messageCardWithDesc(
        checkEmoji,
        `Created playlist ${playlistName}`,
        `You can now use .pl-add ${playlistName} | song name to save tracks into it.`
      ));
    } catch (error) {
      console.error('[Hikari] Error in pl-create slash command:', error);
    }
  }
};

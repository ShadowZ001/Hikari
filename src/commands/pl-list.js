import Playlist from '../models/Playlist.js';
import { PlaylistLayout } from '../components/PlaylistLayout.js';
import { EMOJIS } from '../emojis.js';

/**
 * Returns formatted time string matching H:MM AM/PM.
 * @returns {string}
 */
function getFormattedTime() {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export default {
  name: 'pl-list',
  description: 'List all of your playlists.',
  category: 'Playlist',

  /**
   * @param {import('discord.js').Message} message 
   * @param {string[]} args 
   */
  async execute(message, args) {
    try {
      const playlists = await Playlist.find({ userId: message.author.id }).sort({ updatedAt: -1 });

      if (playlists.length === 0) {
        const infoEmoji = EMOJIS.infoo || '<:infoo:1498633206339997777>';
        return message.reply(PlaylistLayout.messageCard(infoEmoji, 'You do not have any playlists.'));
      }

      const username = message.author.username;
      const timeString = getFormattedTime();
      
      const layout = PlaylistLayout.listCard(username, timeString, playlists);
      return message.reply(layout);
    } catch (error) {
      console.error('[Hikari] Error in pl-list command:', error);
    }
  },

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   */
  async executeSlash(interaction) {
    try {
      const playlists = await Playlist.find({ userId: interaction.user.id }).sort({ updatedAt: -1 });

      if (playlists.length === 0) {
        const infoEmoji = EMOJIS.infoo || '<:infoo:1498633206339997777>';
        return interaction.reply(PlaylistLayout.messageCard(infoEmoji, 'You do not have any playlists.'));
      }

      const username = interaction.user.username;
      const timeString = getFormattedTime();

      const layout = PlaylistLayout.listCard(username, timeString, playlists);
      return interaction.reply(layout);
    } catch (error) {
      console.error('[Hikari] Error in pl-list slash command:', error);
    }
  }
};

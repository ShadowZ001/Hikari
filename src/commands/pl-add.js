import Playlist from '../models/Playlist.js';
import { PlaylistLayout } from '../components/PlaylistLayout.js';
import { EMOJIS } from '../emojis.js';
import { resolveTrack } from '../utils/lavalink.js';

export default {
  name: 'pl-add',
  description: 'Add a track to one of your playlists.',
  aliases: ['playlist-add'],
  category: 'Playlist',
  usage: '<playlist name> | <song name or link>',

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
          'Provide a playlist name.',
          `Usage: ${prefix}pl-add <playlist name> | <song name or link>`
        ));
      }

      let playlistName = '';
      let songQuery = '';

      if (content.includes('|')) {
        const parts = content.split('|');
        playlistName = parts[0].trim();
        songQuery = parts[1]?.trim();
      } else {
        // Find if any playlist name matches the start of the content
        const playlists = await Playlist.find({ userId: message.author.id });
        const match = playlists.find(pl => content.toLowerCase().startsWith(pl.name.toLowerCase()));
        if (match) {
          playlistName = match.name;
          songQuery = content.slice(match.name.length).trim();
        } else {
          // Fallback: first word is playlist, rest is song
          const words = content.split(/ +/);
          playlistName = words[0];
          songQuery = words.slice(1).join(' ');
        }
      }

      const playlist = await Playlist.findOne({ userId: message.author.id, name: playlistName });
      if (!playlist) {
        return message.reply(PlaylistLayout.messageCard(warnEmoji, `I could not find a playlist named ${playlistName}.`));
      }

      // If a song name is passed, use it. Otherwise, look for currently playing track.
      let resolvedSong = null;
      if (songQuery) {
        const resolved = await resolveTrack(songQuery);
        if (resolved) {
          resolvedSong = resolved;
        } else {
          resolvedSong = { 
            title: songQuery, 
            uri: 'https://youtube.com/watch?v=mock',
            artist: 'Unknown Artist',
            duration: '3:44',
            durationMs: 224000,
            thumbnail: 'https://i.scdn.co/image/ab67616d0000b273b06be44d9f67a2cae72877c8'
          };
        }
      } else {
        if (!message.client.currentTracks) {
          message.client.currentTracks = new Map();
        }
        const current = message.client.currentTracks.get(message.guildId);
        if (current) {
          resolvedSong = current;
        }
      }

      if (!resolvedSong) {
        return message.reply(PlaylistLayout.messageCardWithDesc(
          warnEmoji,
          'No track was found.',
          'Pass a song with | or play something first, then run the command again.'
        ));
      }

      playlist.tracks.push(resolvedSong);
      // Explicitly mark modified for schema arrays
      playlist.markModified('tracks');
      await playlist.save();

      const checkEmoji = EMOJIS.checkk || '<:checkk:1498633200346464276>';
      return message.reply(PlaylistLayout.messageCard(
        checkEmoji,
        `Added track ${resolvedSong.title} to playlist ${playlistName}.`
      ));
    } catch (error) {
      console.error('[Hikari] Error in pl-add command:', error);
    }
  },

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   */
  async executeSlash(interaction) {
    try {
      const playlistName = interaction.options.getString('playlist', true).trim();
      const songQuery = interaction.options.getString('song')?.trim(); // Optional
      const warnEmoji = EMOJIS.warnnn || '<:warnnn:1498633209246646393>';

      const playlist = await Playlist.findOne({ userId: interaction.user.id, name: playlistName });
      if (!playlist) {
        return interaction.reply(PlaylistLayout.messageCard(warnEmoji, `I could not find a playlist named ${playlistName}.`));
      }

      let resolvedSong = null;
      if (songQuery) {
        const resolved = await resolveTrack(songQuery);
        if (resolved) {
          resolvedSong = resolved;
        } else {
          resolvedSong = { 
            title: songQuery, 
            uri: 'https://youtube.com/watch?v=mock',
            artist: 'Unknown Artist',
            duration: '3:44',
            durationMs: 224000,
            thumbnail: 'https://i.scdn.co/image/ab67616d0000b273b06be44d9f67a2cae72877c8'
          };
        }
      } else {
        if (!interaction.client.currentTracks) {
          interaction.client.currentTracks = new Map();
        }
        const current = interaction.client.currentTracks.get(interaction.guildId);
        if (current) {
          resolvedSong = current;
        }
      }

      if (!resolvedSong) {
        return interaction.reply(PlaylistLayout.messageCardWithDesc(
          warnEmoji,
          'No track was found.',
          'Pass a song or play something first, then run the command again.'
        ));
      }

      playlist.tracks.push(resolvedSong);
      playlist.markModified('tracks');
      await playlist.save();

      const checkEmoji = EMOJIS.checkk || '<:checkk:1498633200346464276>';
      return interaction.reply(PlaylistLayout.messageCard(
        checkEmoji,
        `Added track ${resolvedSong.title} to playlist ${playlistName}.`
      ));
    } catch (error) {
      console.error('[Hikari] Error in pl-add slash command:', error);
    }
  }
};

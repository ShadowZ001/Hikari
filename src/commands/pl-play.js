import Playlist from '../models/Playlist.js';
import { PlaylistLayout } from '../components/PlaylistLayout.js';
import { checkVoiceChannel } from '../components/VoiceWarningLayout.js';
import { EMOJIS } from '../emojis.js';
import { playTrack } from '../utils/playerManager.js';

export default {
  name: 'pl-play',
  description: 'Queue and play one of your playlists.',
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
          `Usage: ${prefix}pl-play <playlist name>`
        ));
      }

      // Check Voice Channel
      const connected = await checkVoiceChannel(message);
      if (!connected) return;

      const playlist = await Playlist.findOne({ userId: message.author.id, name: playlistName });
      if (!playlist) {
        return message.reply(PlaylistLayout.messageCard(warnEmoji, `I could not find a playlist named ${playlistName}.`));
      }

      if (playlist.tracks.length === 0) {
        return message.reply(PlaylistLayout.messageCard(warnEmoji, `The playlist ${playlistName} is empty.`));
      }

      let player = message.client.activePlayers?.get(message.guildId);
      if (player) {
        if (player.voiceChannelId !== message.member.voice.channelId) {
          return message.reply(PlaylistLayout.messageCard(
            warnEmoji,
            'You must be in the same voice channel as the bot.'
          ));
        }

        // Reuse existing player
        player.playlist = playlist;
        player.currentIndex = 0;
        player.currentTrack = playlist.tracks[0];
        player.requester = message.author;
        player.textChannelId = message.channel.id;

        // Reset player filters on connection reuse
        player.currentFilter = "None";
        player.speed = 1.0;
        player.pitch = 1.0;
        if (player.shoukakuPlayer) {
          try {
            await player.shoukakuPlayer.clearFilters();
          } catch (e) {
            console.error('[Hikari] Error clearing filters on player reuse:', e);
          }
        }

        if (player.timeoutId) {
          clearTimeout(player.timeoutId);
          player.timeoutId = null;
        }

        // Start track playback
        await playTrack(message.client, message.guildId, message.channel);
        console.log(`[Hikari Player] Playback updated for playlist "${playlistName}" in prefix command`);
      } else {
        const playerObj = {
          guildId: message.guildId,
          voiceChannelId: message.member.voice.channelId,
          textChannelId: message.channel.id,
          playlist: playlist,
          currentIndex: 0,
          currentTrack: playlist.tracks[0],
          isPaused: false,
          volume: 100,
          autoplay: false,
          liked: false,
          loopMode: 'off',
          playPrevious: false,
          message: null,
          requester: message.author,
          timeoutId: null
        };

        if (!message.client.activePlayers) {
          message.client.activePlayers = new Map();
        }
        message.client.activePlayers.set(message.guildId, playerObj);

        // Start track playback
        await playTrack(message.client, message.guildId, message.channel);
        console.log(`[Hikari Player] Playback started for playlist "${playlistName}" in prefix command`);
      }
    } catch (error) {
      console.error('[Hikari] Error in pl-play command:', error);
    }
  },

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   */
  async executeSlash(interaction) {
    try {
      const playlistName = interaction.options.getString('name', true).trim();
      const warnEmoji = EMOJIS.warnnn || '<:warnnn:1498633209246646393>';

      // Check Voice Channel
      const connected = await checkVoiceChannel(interaction);
      if (!connected) return;

      const playlist = await Playlist.findOne({ userId: interaction.user.id, name: playlistName });
      if (!playlist) {
        return interaction.reply(PlaylistLayout.messageCard(warnEmoji, `I could not find a playlist named ${playlistName}.`));
      }

      if (playlist.tracks.length === 0) {
        return interaction.reply(PlaylistLayout.messageCard(warnEmoji, `The playlist ${playlistName} is empty.`));
      }

      let player = interaction.client.activePlayers?.get(interaction.guildId);
      if (player) {
        if (player.voiceChannelId !== interaction.member.voice.channelId) {
          return interaction.reply(PlaylistLayout.messageCard(
            warnEmoji,
            'You must be in the same voice channel as the bot.'
          ));
        }

        // Reuse existing player
        player.playlist = playlist;
        player.currentIndex = 0;
        player.currentTrack = playlist.tracks[0];
        player.requester = interaction.user;
        player.textChannelId = interaction.channel.id;

        // Reset player filters on connection reuse
        player.currentFilter = "None";
        player.speed = 1.0;
        player.pitch = 1.0;
        if (player.shoukakuPlayer) {
          try {
            await player.shoukakuPlayer.clearFilters();
          } catch (e) {
            console.error('[Hikari] Error clearing filters on player reuse:', e);
          }
        }

        if (player.timeoutId) {
          clearTimeout(player.timeoutId);
          player.timeoutId = null;
        }

        await interaction.deferReply();
        const channel = interaction.channel;
        await playTrack(interaction.client, interaction.guildId, channel);

        await interaction.editReply({ content: `🎶 Now playing playlist: **${playlistName}**` });
        console.log(`[Hikari Player] Playback updated for playlist "${playlistName}" in slash command`);
      } else {
        const playerObj = {
          guildId: interaction.guildId,
          voiceChannelId: interaction.member.voice.channelId,
          textChannelId: interaction.channel.id,
          playlist: playlist,
          currentIndex: 0,
          currentTrack: playlist.tracks[0],
          isPaused: false,
          volume: 100,
          autoplay: false,
          liked: false,
          loopMode: 'off',
          playPrevious: false,
          message: null,
          requester: interaction.user,
          timeoutId: null
        };

        if (!interaction.client.activePlayers) {
          interaction.client.activePlayers = new Map();
        }
        interaction.client.activePlayers.set(interaction.guildId, playerObj);

        await interaction.deferReply();
        const channel = interaction.channel;
        await playTrack(interaction.client, interaction.guildId, channel);

        await interaction.editReply({ content: `🎶 Now playing playlist: **${playlistName}**` });
        console.log(`[Hikari Player] Playback started for playlist "${playlistName}" in slash command`);
      }
    } catch (error) {
      console.error('[Hikari] Error in pl-play slash command:', error);
    }
  }
};

import { PrefixLayout } from '../components/PrefixLayout.js';
import { EMOJIS } from '../emojis.js';
import { checkVoiceChannel } from '../components/VoiceWarningLayout.js';

export default {
  name: 'leavecleanup',
  aliases: ['lc'],
  description: "Removes songs from the queue queued by users who left the voice channel.",

  async executeSlash(interaction) {
    try {
      const client = interaction.client;
      const player = client.activePlayers?.get(interaction.guildId);

      if (!player || player.playlist.tracks.length === 0) {
        const card = PrefixLayout.messageCard('❌', '**No active music player or queue found in this server.**');
        return interaction.reply({ ...card, ephemeral: false });
      }

      const connected = await checkVoiceChannel(interaction);
      if (!connected) return;

      const voiceChannel = interaction.member.voice.channel;
      const voiceChannelMembers = voiceChannel.members.map(m => m.id);

      const removedTracks = [];
      const removedUsers = new Set();

      // Clean from player.currentIndex + 1 to end of playlist
      const upcoming = player.playlist.tracks.slice(player.currentIndex + 1);
      const keep = player.playlist.tracks.slice(0, player.currentIndex + 1);

      for (const track of upcoming) {
        if (track.requesterId && !voiceChannelMembers.includes(track.requesterId)) {
          removedTracks.push(track);
          removedUsers.add(track.requesterId);
        } else {
          keep.push(track);
        }
      }

      player.playlist.tracks = keep;

      if (removedTracks.length === 0) {
        const card = PrefixLayout.messageCard(EMOJIS.infoo || 'ℹ️', '**No songs found from users who left the voice channel.**');
        return interaction.reply(card);
      }

      const checkEmoji = EMOJIS.checkk || '✅';
      const card = PrefixLayout.messageCard(
        checkEmoji,
        `**Cleaned up \`${removedTracks.length}\` track(s) from \`${removedUsers.size}\` user(s) who left the channel.**`
      );
      return interaction.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred during leave cleanup.**');
      return interaction.reply({ ...card, ephemeral: true });
    }
  },

  async execute(message, args) {
    try {
      const client = message.client;
      const player = client.activePlayers?.get(message.guildId);

      if (!player || player.playlist.tracks.length === 0) {
        const card = PrefixLayout.messageCard('❌', '**No active music player or queue found in this server.**');
        return message.reply(card);
      }

      const connected = await checkVoiceChannel(message);
      if (!connected) return;

      const voiceChannel = message.member.voice.channel;
      const voiceChannelMembers = voiceChannel.members.map(m => m.id);

      const removedTracks = [];
      const removedUsers = new Set();

      // Clean from player.currentIndex + 1 to end of playlist
      const upcoming = player.playlist.tracks.slice(player.currentIndex + 1);
      const keep = player.playlist.tracks.slice(0, player.currentIndex + 1);

      for (const track of upcoming) {
        if (track.requesterId && !voiceChannelMembers.includes(track.requesterId)) {
          removedTracks.push(track);
          removedUsers.add(track.requesterId);
        } else {
          keep.push(track);
        }
      }

      player.playlist.tracks = keep;

      if (removedTracks.length === 0) {
        const card = PrefixLayout.messageCard(EMOJIS.infoo || 'ℹ️', '**No songs found from users who left the voice channel.**');
        return message.reply(card);
      }

      const checkEmoji = EMOJIS.checkk || '✅';
      const card = PrefixLayout.messageCard(
        checkEmoji,
        `**Cleaned up \`${removedTracks.length}\` track(s) from \`${removedUsers.size}\` user(s) who left the channel.**`
      );
      return message.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred during leave cleanup.**');
      return message.reply(card);
    }
  }
};

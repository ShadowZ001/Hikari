import { PrefixLayout } from '../components/PrefixLayout.js';
import { EMOJIS } from '../emojis.js';
import { checkVoiceChannel } from '../components/VoiceWarningLayout.js';

export default {
  name: 'remove',
  aliases: ['rm'],
  description: 'Remove a track from the queue by its number.',

  async executeSlash(interaction) {
    try {
      const client = interaction.client;
      const player = client.activePlayers?.get(interaction.guildId);

      if (!player || player.playlist.tracks.length === 0) {
        const card = PrefixLayout.messageCard('❌', '**No active music queue found in this server.**');
        return interaction.reply({ ...card, ephemeral: false });
      }

      const connected = await checkVoiceChannel(interaction);
      if (!connected) return;

      const positionInput = interaction.options.getInteger('position');
      const upcomingTracks = player.playlist.tracks.slice(player.currentIndex + 1);

      if (upcomingTracks.length === 0) {
        const card = PrefixLayout.messageCard('❌', '**There are no upcoming tracks in the queue to remove.**');
        return interaction.reply({ ...card, ephemeral: false });
      }

      if (positionInput <= 0 || positionInput > upcomingTracks.length) {
        const card = PrefixLayout.messageCard('❌', `**Invalid position! Please enter a number between 1 and ${upcomingTracks.length}.**`);
        return interaction.reply({ ...card, ephemeral: true });
      }

      const targetIndex = player.currentIndex + positionInput;
      const removedTrack = player.playlist.tracks[targetIndex];

      player.playlist.tracks.splice(targetIndex, 1);

      const checkEmoji = EMOJIS.checkk || '✅';
      const card = PrefixLayout.messageCard(checkEmoji, `**Removed from queue:** **${removedTrack.title}**`);
      return interaction.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while removing the track.**');
      return interaction.reply({ ...card, ephemeral: true });
    }
  },

  async execute(message, args) {
    try {
      const client = message.client;
      const player = client.activePlayers?.get(message.guildId);

      if (!player || player.playlist.tracks.length === 0) {
        const card = PrefixLayout.messageCard('❌', '**No active music queue found in this server.**');
        return message.reply(card);
      }

      const connected = await checkVoiceChannel(message);
      if (!connected) return;

      const upcomingTracks = player.playlist.tracks.slice(player.currentIndex + 1);

      if (upcomingTracks.length === 0) {
        const card = PrefixLayout.messageCard('❌', '**There are no upcoming tracks in the queue to remove.**');
        return message.reply(card);
      }

      const positionArg = args[0];
      if (!positionArg) {
        const card = PrefixLayout.messageCard('❌', '**Usage:** `>remove [queue position]` (e.g. `>remove 3`)');
        return message.reply(card);
      }

      const position = parseInt(positionArg, 10);
      if (isNaN(position) || position <= 0 || position > upcomingTracks.length) {
        const card = PrefixLayout.messageCard('❌', `**Invalid position! Please enter a number between 1 and ${upcomingTracks.length}.**`);
        return message.reply(card);
      }

      const targetIndex = player.currentIndex + position;
      const removedTrack = player.playlist.tracks[targetIndex];

      player.playlist.tracks.splice(targetIndex, 1);

      const checkEmoji = EMOJIS.checkk || '✅';
      const card = PrefixLayout.messageCard(checkEmoji, `**Removed from queue:** **${removedTrack.title}**`);
      return message.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while removing the track.**');
      return message.reply(card);
    }
  }
};

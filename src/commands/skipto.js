import { PrefixLayout } from '../components/PrefixLayout.js';
import { EMOJIS } from '../emojis.js';
import { checkVoiceChannel } from '../components/VoiceWarningLayout.js';
import { playTrack } from '../utils/playerManager.js';

export default {
  name: 'skipto',
  aliases: ['jump'],
  description: 'Skip to a specific song in the queue.',
  options: [
    {
      name: 'position',
      description: 'Position in queue to skip to.',
      type: 4, // INTEGER
      required: true
    }
  ],

  async executeSlash(interaction) {
    try {
      const client = interaction.client;
      const player = client.activePlayers?.get(interaction.guildId);

      if (!player || !player.currentTrack) {
        const card = PrefixLayout.messageCard('❌', '**No active music player found in this server.**');
        return interaction.reply({ ...card, ephemeral: false });
      }

      const connected = await checkVoiceChannel(interaction);
      if (!connected) return;

      const upcomingCount = player.playlist.tracks.length - 1 - player.currentIndex;
      if (upcomingCount <= 0) {
        const card = PrefixLayout.messageCard('❌', '**There are no upcoming songs in the queue to skip to.**');
        return interaction.reply({ ...card, ephemeral: false });
      }

      const position = interaction.options.getInteger('position');
      if (position < 1 || position > upcomingCount) {
        const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', `**Please provide a valid position (range: 1 - ${upcomingCount}).**`);
        return interaction.reply({ ...card, ephemeral: true });
      }

      const targetIndex = player.currentIndex + position;
      const targetTrack = player.playlist.tracks[targetIndex];

      player.currentIndex = targetIndex;
      await playTrack(client, interaction.guildId, interaction.channel);

      const checkEmoji = EMOJIS.checkk || '✅';
      const card = PrefixLayout.messageCard(checkEmoji, `**Successfully skipped to:** **${targetTrack.title}**`);
      return interaction.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while skipping to the track.**');
      return interaction.reply({ ...card, ephemeral: true });
    }
  },

  async execute(message, args) {
    try {
      const client = message.client;
      const player = client.activePlayers?.get(message.guildId);

      if (!player || !player.currentTrack) {
        const card = PrefixLayout.messageCard('❌', '**No active music player found in this server.**');
        return message.reply(card);
      }

      const connected = await checkVoiceChannel(message);
      if (!connected) return;

      const upcomingCount = player.playlist.tracks.length - 1 - player.currentIndex;
      if (upcomingCount <= 0) {
        const card = PrefixLayout.messageCard('❌', '**There are no upcoming songs in the queue to skip to.**');
        return message.reply(card);
      }

      const positionInput = args[0];
      if (!positionInput) {
        const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', `**Usage: \`skipto <position>\` (range: 1 - ${upcomingCount})**`);
        return message.reply(card);
      }

      const position = parseInt(positionInput);
      if (isNaN(position) || position < 1 || position > upcomingCount) {
        const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', `**Please provide a valid position (range: 1 - ${upcomingCount}).**`);
        return message.reply(card);
      }

      const targetIndex = player.currentIndex + position;
      const targetTrack = player.playlist.tracks[targetIndex];

      player.currentIndex = targetIndex;
      await playTrack(client, message.guildId, message.channel);

      const checkEmoji = EMOJIS.checkk || '✅';
      const card = PrefixLayout.messageCard(checkEmoji, `**Successfully skipped to:** **${targetTrack.title}**`);
      return message.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while skipping to the track.**');
      return message.reply(card);
    }
  }
};

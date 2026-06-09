import { PrefixLayout } from '../components/PrefixLayout.js';
import { EMOJIS } from '../emojis.js';
import { checkVoiceChannel } from '../components/VoiceWarningLayout.js';

export default {
  name: 'shuffle',
  description: 'Shuffles all upcoming tracks in the queue.',

  async executeSlash(interaction) {
    try {
      const client = interaction.client;
      const player = client.activePlayers?.get(interaction.guildId);

      if (!player || player.playlist.tracks.length === 0) {
        const card = PrefixLayout.messageCard('❌', '**No music player queue found in this server.**');
        return interaction.reply({ ...card, ephemeral: false });
      }

      const connected = await checkVoiceChannel(interaction);
      if (!connected) return;

      const upcomingCount = player.playlist.tracks.length - 1 - player.currentIndex;
      if (upcomingCount <= 1) {
        const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', '**There are not enough upcoming songs in the queue to shuffle.**');
        return interaction.reply({ ...card, ephemeral: false });
      }

      const upcoming = player.playlist.tracks.slice(player.currentIndex + 1);
      for (let i = upcoming.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [upcoming[i], upcoming[j]] = [upcoming[j], upcoming[i]];
      }
      player.playlist.tracks.splice(player.currentIndex + 1, upcoming.length, ...upcoming);

      const checkEmoji = EMOJIS.checkk || '✅';
      const card = PrefixLayout.messageCard(checkEmoji, `**Successfully shuffled \`${upcomingCount}\` upcoming songs in the queue.**`);
      return interaction.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while shuffling the queue.**');
      return interaction.reply({ ...card, ephemeral: true });
    }
  },

  async execute(message, args) {
    try {
      const client = message.client;
      const player = client.activePlayers?.get(message.guildId);

      if (!player || player.playlist.tracks.length === 0) {
        const card = PrefixLayout.messageCard('❌', '**No active music player found in this server.**');
        return message.reply(card);
      }

      const connected = await checkVoiceChannel(message);
      if (!connected) return;

      const upcomingCount = player.playlist.tracks.length - 1 - player.currentIndex;
      if (upcomingCount <= 1) {
        const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', '**There are not enough upcoming songs in the queue to shuffle.**');
        return message.reply(card);
      }

      const upcoming = player.playlist.tracks.slice(player.currentIndex + 1);
      for (let i = upcoming.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [upcoming[i], upcoming[j]] = [upcoming[j], upcoming[i]];
      }
      player.playlist.tracks.splice(player.currentIndex + 1, upcoming.length, ...upcoming);

      const checkEmoji = EMOJIS.checkk || '✅';
      const card = PrefixLayout.messageCard(checkEmoji, `**Successfully shuffled \`${upcomingCount}\` upcoming songs in the queue.**`);
      return message.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while shuffling the queue.**');
      return message.reply(card);
    }
  }
};

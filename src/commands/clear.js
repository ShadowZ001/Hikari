import { PrefixLayout } from '../components/PrefixLayout.js';
import { EMOJIS } from '../emojis.js';
import { checkVoiceChannel } from '../components/VoiceWarningLayout.js';

export default {
  name: 'clear',
  aliases: ['cq', 'clearqueue'],
  description: 'Clears the music queue.',

  async executeSlash(interaction) {
    try {
      const client = interaction.client;
      const player = client.activePlayers?.get(interaction.guildId);

      if (!player) {
        const card = PrefixLayout.messageCard('❌', '**No active music player found in this server.**');
        return interaction.reply({ ...card, ephemeral: false });
      }

      const connected = await checkVoiceChannel(interaction);
      if (!connected) return;

      const current = player.playlist.tracks[player.currentIndex];
      const previousCount = player.playlist.tracks.length - 1;

      if (previousCount <= 0) {
        const card = PrefixLayout.messageCard('❌', '**There are no upcoming songs in the queue to clear.**');
        return interaction.reply({ ...card, ephemeral: false });
      }

      if (current) {
        player.playlist.tracks = [current];
        player.currentIndex = 0;
      } else {
        player.playlist.tracks = [];
        player.currentIndex = 0;
      }

      const checkEmoji = EMOJIS.checkk || '✅';
      const card = PrefixLayout.messageCard(checkEmoji, `**Successfully cleared \`${previousCount}\` songs from the queue.**`);
      return interaction.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while clearing the queue.**');
      return interaction.reply({ ...card, ephemeral: true });
    }
  },

  async execute(message, args) {
    try {
      const client = message.client;
      const player = client.activePlayers?.get(message.guildId);

      if (!player) {
        const card = PrefixLayout.messageCard('❌', '**No active music player found in this server.**');
        return message.reply(card);
      }

      const connected = await checkVoiceChannel(message);
      if (!connected) return;

      const current = player.playlist.tracks[player.currentIndex];
      const previousCount = player.playlist.tracks.length - 1;

      if (previousCount <= 0) {
        const card = PrefixLayout.messageCard('❌', '**There are no upcoming songs in the queue to clear.**');
        return message.reply(card);
      }

      if (current) {
        player.playlist.tracks = [current];
        player.currentIndex = 0;
      } else {
        player.playlist.tracks = [];
        player.currentIndex = 0;
      }

      const checkEmoji = EMOJIS.checkk || '✅';
      const card = PrefixLayout.messageCard(checkEmoji, `**Successfully cleared \`${previousCount}\` songs from the queue.**`);
      return message.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while clearing the queue.**');
      return message.reply(card);
    }
  }
};

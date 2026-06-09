import { PlayerLayout } from '../components/PlayerLayout.js';
import { PrefixLayout } from '../components/PrefixLayout.js';

export default {
  name: 'nowplaying',
  aliases: ['np'],
  description: 'Show the current playing song.',

  async executeSlash(interaction) {
    try {
      const client = interaction.client;
      const player = client.activePlayers?.get(interaction.guildId);

      if (!player || !player.currentTrack) {
        const card = PrefixLayout.messageCard('❌', '**No song is currently playing.**');
        return interaction.reply({ ...card, ephemeral: false });
      }

      const payload = PlayerLayout.playingCard(player.currentTrack, player.requester, player);
      return interaction.reply(payload);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while fetching currently playing song.**');
      return interaction.reply({ ...card, ephemeral: true });
    }
  },

  async execute(message, args) {
    try {
      const client = message.client;
      const player = client.activePlayers?.get(message.guildId);

      if (!player || !player.currentTrack) {
        const card = PrefixLayout.messageCard('❌', '**No song is currently playing.**');
        return message.reply(card);
      }

      const payload = PlayerLayout.playingCard(player.currentTrack, player.requester, player);
      return message.reply(payload);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while fetching currently playing song.**');
      return message.reply(card);
    }
  }
};

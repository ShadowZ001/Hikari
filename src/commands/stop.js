import { PrefixLayout } from '../components/PrefixLayout.js';
import { EMOJIS } from '../emojis.js';
import { checkVoiceChannel } from '../components/VoiceWarningLayout.js';
import { stopTrack } from '../utils/playerManager.js';

export default {
  name: 'stop',
  description: 'Stops music playback, clears the queue, and disconnects the bot.',

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

      await interaction.deferReply();

      // Clear the queue tracks array
      player.playlist.tracks = [];
      player.currentIndex = 0;

      await stopTrack(client, interaction.guildId);

      const checkEmoji = EMOJIS.checkk || '✅';
      const card = PrefixLayout.messageCard(checkEmoji, '**Successfully stopped playback, cleared the queue, and left the voice channel.**');
      return interaction.editReply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while stopping the music.**');
      if (interaction.deferred || interaction.replied) {
        return interaction.editReply(card);
      } else {
        return interaction.reply({ ...card, ephemeral: true });
      }
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

      // Clear the queue tracks array
      player.playlist.tracks = [];
      player.currentIndex = 0;

      await stopTrack(client, message.guildId);

      const checkEmoji = EMOJIS.checkk || '✅';
      const card = PrefixLayout.messageCard(checkEmoji, '**Successfully stopped playback, cleared the queue, and left the voice channel.**');
      return message.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while stopping the music.**');
      return message.reply(card);
    }
  }
};

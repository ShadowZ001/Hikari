import { PrefixLayout } from '../components/PrefixLayout.js';
import { PlayerLayout } from '../components/PlayerLayout.js';
import { EMOJIS } from '../emojis.js';
import { checkVoiceChannel } from '../components/VoiceWarningLayout.js';

export default {
  name: 'pause',
  description: 'Pause the currently playing music.',

  async executeSlash(interaction) {
    try {
      const client = interaction.client;
      const player = client.activePlayers?.get(interaction.guildId);

      if (!player || !player.shoukakuPlayer) {
        const card = PrefixLayout.messageCard('❌', '**No active music player found in this server.**');
        return interaction.reply({ ...card, ephemeral: false });
      }

      const connected = await checkVoiceChannel(interaction);
      if (!connected) return;

      if (player.isPaused) {
        const card = PrefixLayout.messageCard(EMOJIS.infoo || 'ℹ️', '**Music playback is already paused.**');
        return interaction.reply({ ...card, ephemeral: false });
      }

      player.isPaused = true;
      await player.shoukakuPlayer.setPaused(true);

      // Edit active player message if available
      if (player.message && player.currentTrack) {
        const payload = PlayerLayout.playingCard(player.currentTrack, player.requester, player);
        await player.message.edit(payload).catch(() => {});
      }

      const checkEmoji = EMOJIS.checkk || '✅';
      const card = PrefixLayout.messageCard(checkEmoji, '**Successfully paused music playback.**');
      return interaction.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while pausing music.**');
      return interaction.reply({ ...card, ephemeral: true });
    }
  },

  async execute(message, args) {
    try {
      const client = message.client;
      const player = client.activePlayers?.get(message.guildId);

      if (!player || !player.shoukakuPlayer) {
        const card = PrefixLayout.messageCard('❌', '**No active music player found in this server.**');
        return message.reply(card);
      }

      const connected = await checkVoiceChannel(message);
      if (!connected) return;

      if (player.isPaused) {
        const card = PrefixLayout.messageCard(EMOJIS.infoo || 'ℹ️', '**Music playback is already paused.**');
        return message.reply(card);
      }

      player.isPaused = true;
      await player.shoukakuPlayer.setPaused(true);

      if (player.message && player.currentTrack) {
        const payload = PlayerLayout.playingCard(player.currentTrack, player.requester, player);
        await player.message.edit(payload).catch(() => {});
      }

      const checkEmoji = EMOJIS.checkk || '✅';
      const card = PrefixLayout.messageCard(checkEmoji, '**Successfully paused music playback.**');
      return message.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while pausing music.**');
      return message.reply(card);
    }
  }
};

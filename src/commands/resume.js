import { PrefixLayout } from '../components/PrefixLayout.js';
import { PlayerLayout } from '../components/PlayerLayout.js';
import { EMOJIS } from '../emojis.js';
import { checkVoiceChannel } from '../components/VoiceWarningLayout.js';

export default {
  name: 'resume',
  aliases: ['r'],
  description: 'Resume currently paused music playback.',

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

      if (!player.isPaused) {
        const card = PrefixLayout.messageCard(EMOJIS.infoo || 'ℹ️', '**Music playback is already running.**');
        return interaction.reply({ ...card, ephemeral: false });
      }

      player.isPaused = false;
      await player.shoukakuPlayer.setPaused(false);

      if (player.message && player.currentTrack) {
        const payload = PlayerLayout.playingCard(player.currentTrack, player.requester, player);
        await player.message.edit(payload).catch(() => {});
      }

      const checkEmoji = EMOJIS.checkk || '✅';
      const card = PrefixLayout.messageCard(checkEmoji, '**Successfully resumed music playback.**');
      return interaction.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while resuming music.**');
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

      if (!player.isPaused) {
        const card = PrefixLayout.messageCard(EMOJIS.infoo || 'ℹ️', '**Music playback is already running.**');
        return message.reply(card);
      }

      player.isPaused = false;
      await player.shoukakuPlayer.setPaused(false);

      if (player.message && player.currentTrack) {
        const payload = PlayerLayout.playingCard(player.currentTrack, player.requester, player);
        await player.message.edit(payload).catch(() => {});
      }

      const checkEmoji = EMOJIS.checkk || '✅';
      const card = PrefixLayout.messageCard(checkEmoji, '**Successfully resumed music playback.**');
      return message.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while resuming music.**');
      return message.reply(card);
    }
  }
};

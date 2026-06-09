import { PrefixLayout } from '../components/PrefixLayout.js';
import { EMOJIS } from '../emojis.js';
import { checkVoiceChannel } from '../components/VoiceWarningLayout.js';
import { playTrack } from '../utils/playerManager.js';

export default {
  name: 'previous',
  aliases: ['back', 'prev'],
  description: 'Play the previous song in queue.',

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

      if (player.currentIndex <= 0) {
        const card = PrefixLayout.messageCard(EMOJIS.infoo || 'ℹ️', '**There are no previous songs in the queue history.**');
        return interaction.reply({ ...card, ephemeral: false });
      }

      await interaction.deferReply();

      player.currentIndex -= 1;
      await playTrack(client, interaction.guildId, interaction.channel);

      const checkEmoji = EMOJIS.checkk || '✅';
      const prevTrack = player.playlist.tracks[player.currentIndex];
      const card = PrefixLayout.messageCard(checkEmoji, `**Now playing previous song:** **${prevTrack.title}**`);
      return interaction.editReply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while trying to play the previous song.**');
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

      if (!player || !player.shoukakuPlayer) {
        const card = PrefixLayout.messageCard('❌', '**No active music player found in this server.**');
        return message.reply(card);
      }

      const connected = await checkVoiceChannel(message);
      if (!connected) return;

      if (player.currentIndex <= 0) {
        const card = PrefixLayout.messageCard(EMOJIS.infoo || 'ℹ️', '**There are no previous songs in the queue history.**');
        return message.reply(card);
      }

      player.currentIndex -= 1;
      await playTrack(client, message.guildId, message.channel);

      const checkEmoji = EMOJIS.checkk || '✅';
      const prevTrack = player.playlist.tracks[player.currentIndex];
      const card = PrefixLayout.messageCard(checkEmoji, `**Now playing previous song:** **${prevTrack.title}**`);
      return message.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while trying to play the previous song.**');
      return message.reply(card);
    }
  }
};

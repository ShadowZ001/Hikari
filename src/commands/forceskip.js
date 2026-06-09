import { PrefixLayout } from '../components/PrefixLayout.js';
import { EMOJIS } from '../emojis.js';
import { checkVoiceChannel } from '../components/VoiceWarningLayout.js';
import { skipTrack } from '../utils/playerManager.js';

export default {
  name: 'forceskip',
  aliases: ['fs'],
  description: 'Force skips the current playing song.',

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

      await interaction.deferReply();

      const songTitle = player.currentTrack.title;
      await skipTrack(client, interaction.guildId, interaction.channel);

      const checkEmoji = EMOJIS.checkk || '✅';
      const card = PrefixLayout.messageCard(checkEmoji, `**Successfully skipped:** **${songTitle}**`);
      return interaction.editReply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while skipping the song.**');
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

      if (!player || !player.currentTrack) {
        const card = PrefixLayout.messageCard('❌', '**No active music player found in this server.**');
        return message.reply(card);
      }

      const connected = await checkVoiceChannel(message);
      if (!connected) return;

      const songTitle = player.currentTrack.title;
      await skipTrack(client, message.guildId, message.channel);

      const checkEmoji = EMOJIS.checkk || '✅';
      const card = PrefixLayout.messageCard(checkEmoji, `**Successfully skipped:** **${songTitle}**`);
      return message.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while skipping the song.**');
      return message.reply(card);
    }
  }
};

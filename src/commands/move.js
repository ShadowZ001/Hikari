import { PrefixLayout } from '../components/PrefixLayout.js';
import { EMOJIS } from '../emojis.js';
import { checkVoiceChannel } from '../components/VoiceWarningLayout.js';

export default {
  name: 'move',
  aliases: ['mv'],
  description: 'Move the bot to your current voice channel.',

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

      const voiceChannel = interaction.member.voice.channel;
      if (player.voiceChannelId === voiceChannel.id) {
        const card = PrefixLayout.messageCard(EMOJIS.infoo || 'ℹ️', '**I am already in your voice channel.**');
        return interaction.reply({ ...card, ephemeral: false });
      }

      // Move player by calling joinVoiceChannel on Shoukaku again
      await client.shoukaku.joinVoiceChannel({
        guildId: interaction.guildId,
        channelId: voiceChannel.id,
        shardId: interaction.guild?.shardId || 0,
        deaf: true
      });

      player.voiceChannelId = voiceChannel.id;

      const checkEmoji = EMOJIS.checkk || '✅';
      const card = PrefixLayout.messageCard(checkEmoji, `**Moved to voice channel:** <#${voiceChannel.id}>`);
      return interaction.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while moving the bot.**');
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

      const voiceChannel = message.member.voice.channel;
      if (player.voiceChannelId === voiceChannel.id) {
        const card = PrefixLayout.messageCard(EMOJIS.infoo || 'ℹ️', '**I am already in your voice channel.**');
        return message.reply(card);
      }

      // Move player
      await client.shoukaku.joinVoiceChannel({
        guildId: message.guildId,
        channelId: voiceChannel.id,
        shardId: message.guild?.shardId || 0,
        deaf: true
      });

      player.voiceChannelId = voiceChannel.id;

      const checkEmoji = EMOJIS.checkk || '✅';
      const card = PrefixLayout.messageCard(checkEmoji, `**Moved to voice channel:** <#${voiceChannel.id}>`);
      return message.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while moving the bot.**');
      return message.reply(card);
    }
  }
};

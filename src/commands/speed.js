import { PrefixLayout } from '../components/PrefixLayout.js';
import { EMOJIS } from '../emojis.js';
import { checkVoiceChannel } from '../components/VoiceWarningLayout.js';

export default {
  name: 'speed',
  aliases: ['playback', 'tempo'],
  description: 'Change the playback speed of the current song.',
  options: [
    {
      name: 'speed',
      description: 'Playback speed (0.25 - 3.0)',
      type: 10, // NUMBER
      required: false
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

      const currentSpeed = player.speed || 1.0;
      const speedArg = interaction.options.getNumber('speed');

      if (speedArg === null) {
        const infoEmoji = EMOJIS.infoo || 'ℹ️';
        const card = PrefixLayout.messageCard(infoEmoji, `**Current Speed:** \`${currentSpeed}x\` • **Range:** \`0.25x - 3.0x\``);
        return interaction.reply(card);
      }

      if (speedArg < 0.25 || speedArg > 3.0) {
        const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', '**Playback speed must be between 0.25 and 3.0.**');
        return interaction.reply({ ...card, ephemeral: true });
      }

      const currentPitch = player.pitch || 1.0;
      await player.shoukakuPlayer.setFilters({
        timescale: {
          speed: speedArg,
          pitch: currentPitch,
          rate: 1.0
        }
      });

      player.speed = speedArg;

      const checkEmoji = EMOJIS.checkk || '✅';
      const card = PrefixLayout.messageCard(checkEmoji, `**Successfully set playback speed to \`${speedArg}x\`.**`);
      return interaction.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while setting playback speed.**');
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

      const currentSpeed = player.speed || 1.0;
      const speedInput = args[0];

      if (!speedInput) {
        const infoEmoji = EMOJIS.infoo || 'ℹ️';
        const card = PrefixLayout.messageCard(infoEmoji, `**Current Speed:** \`${currentSpeed}x\` • **Range:** \`0.25x - 3.0x\``);
        return message.reply(card);
      }

      const speed = parseFloat(speedInput);
      if (isNaN(speed) || speed < 0.25 || speed > 3.0) {
        const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', '**Playback speed must be between 0.25 and 3.0.**');
        return message.reply(card);
      }

      const currentPitch = player.pitch || 1.0;
      await player.shoukakuPlayer.setFilters({
        timescale: {
          speed: speed,
          pitch: currentPitch,
          rate: 1.0
        }
      });

      player.speed = speed;

      const checkEmoji = EMOJIS.checkk || '✅';
      const card = PrefixLayout.messageCard(checkEmoji, `**Successfully set playback speed to \`${speed}x\`.**`);
      return message.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while setting playback speed.**');
      return message.reply(card);
    }
  }
};

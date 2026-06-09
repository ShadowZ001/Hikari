import { PrefixLayout } from '../components/PrefixLayout.js';
import { EMOJIS } from '../emojis.js';
import { checkVoiceChannel } from '../components/VoiceWarningLayout.js';
import { skipTrack } from '../utils/playerManager.js';

export default {
  name: 'forward',
  aliases: ['ff', 'fastforward'],
  description: 'Fast forward the current song by specified seconds.',

  async executeSlash(interaction) {
    try {
      const client = interaction.client;
      const player = client.activePlayers?.get(interaction.guildId);

      if (!player || !player.currentTrack || !player.shoukakuPlayer) {
        const card = PrefixLayout.messageCard('❌', '**No active music player found in this server.**');
        return interaction.reply({ ...card, ephemeral: false });
      }

      const connected = await checkVoiceChannel(interaction);
      if (!connected) return;

      const seconds = interaction.options.getInteger('seconds') || 10;
      if (seconds <= 0) {
        const card = PrefixLayout.messageCard('❌', '**Seconds must be a positive number.**');
        return interaction.reply({ ...card, ephemeral: true });
      }

      const currentPosition = player.shoukakuPlayer.position || 0;
      const duration = player.currentTrack.durationMs || 224000;
      const newPosition = currentPosition + (seconds * 1000);

      if (newPosition >= duration) {
        await interaction.reply(PrefixLayout.messageCard(EMOJIS.infoo || 'ℹ️', '**Fast forward exceeded song duration. Skipping track...**'));
        return skipTrack(client, interaction.guildId, interaction.channel);
      }

      await player.shoukakuPlayer.seekTo(newPosition);
      const totalSec = Math.floor(newPosition / 1000);
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      const timeStr = `${min}:${sec.toString().padStart(2, '0')}`;

      const card = PrefixLayout.messageCard(EMOJIS.checkk || '✅', `**Fast forwarded \`${seconds}s\` to \`${timeStr}\`**`);
      return interaction.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while fast forwarding.**');
      return interaction.reply({ ...card, ephemeral: true });
    }
  },

  async execute(message, args) {
    try {
      const client = message.client;
      const player = client.activePlayers?.get(message.guildId);

      if (!player || !player.currentTrack || !player.shoukakuPlayer) {
        const card = PrefixLayout.messageCard('❌', '**No active music player found in this server.**');
        return message.reply(card);
      }

      const connected = await checkVoiceChannel(message);
      if (!connected) return;

      let seconds = 10;
      if (args[0]) {
        const parsed = parseInt(args[0], 10);
        if (!isNaN(parsed) && parsed > 0) {
          seconds = parsed;
        } else {
          const card = PrefixLayout.messageCard('❌', '**Usage:** `>forward [seconds]` (e.g. `>forward 30`)');
          return message.reply(card);
        }
      }

      const currentPosition = player.shoukakuPlayer.position || 0;
      const duration = player.currentTrack.durationMs || 224000;
      const newPosition = currentPosition + (seconds * 1000);

      if (newPosition >= duration) {
        await message.reply(PrefixLayout.messageCard(EMOJIS.infoo || 'ℹ️', '**Fast forward exceeded song duration. Skipping track...**'));
        return skipTrack(client, message.guildId, message.channel);
      }

      await player.shoukakuPlayer.seekTo(newPosition);
      const totalSec = Math.floor(newPosition / 1000);
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      const timeStr = `${min}:${sec.toString().padStart(2, '0')}`;

      const card = PrefixLayout.messageCard(EMOJIS.checkk || '✅', `**Fast forwarded \`${seconds}s\` to \`${timeStr}\`**`);
      return message.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while fast forwarding.**');
      return message.reply(card);
    }
  }
};

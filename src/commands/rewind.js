import { PrefixLayout } from '../components/PrefixLayout.js';
import { EMOJIS } from '../emojis.js';
import { checkVoiceChannel } from '../components/VoiceWarningLayout.js';

export default {
  name: 'rewind',
  aliases: ['rw', 'backward'],
  description: 'Rewind the current song by specified seconds.',

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
      const newPosition = Math.max(0, currentPosition - (seconds * 1000));

      await player.shoukakuPlayer.seekTo(newPosition);

      const totalSec = Math.floor(newPosition / 1000);
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      const timeStr = `${min}:${sec.toString().padStart(2, '0')}`;

      const checkEmoji = EMOJIS.checkk || '✅';
      const card = PrefixLayout.messageCard(checkEmoji, `**Rewound \`${seconds}s\` to \`${timeStr}\`**`);
      return interaction.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while rewinding the song.**');
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
          const card = PrefixLayout.messageCard('❌', '**Usage:** `>rewind [seconds]` (e.g. `>rewind 30`)');
          return message.reply(card);
        }
      }

      const currentPosition = player.shoukakuPlayer.position || 0;
      const newPosition = Math.max(0, currentPosition - (seconds * 1000));

      await player.shoukakuPlayer.seekTo(newPosition);

      const totalSec = Math.floor(newPosition / 1000);
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      const timeStr = `${min}:${sec.toString().padStart(2, '0')}`;

      const checkEmoji = EMOJIS.checkk || '✅';
      const card = PrefixLayout.messageCard(checkEmoji, `**Rewound \`${seconds}s\` to \`${timeStr}\`**`);
      return message.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while rewinding the song.**');
      return message.reply(card);
    }
  }
};

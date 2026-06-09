import { PrefixLayout } from '../components/PrefixLayout.js';
import { EMOJIS } from '../emojis.js';
import { checkVoiceChannel } from '../components/VoiceWarningLayout.js';

export default {
  name: 'seek',
  description: 'Seek to a specific position in the current song.',
  options: [
    {
      name: 'time',
      description: 'Time to seek to (e.g. 40, 1:30, 10s, 1m)',
      type: 3, // STRING
      required: true
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

      const timeInput = interaction.options.getString('time');
      const timeMs = parseDuration(timeInput);

      if (timeMs === null || isNaN(timeMs)) {
        const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', '**Invalid time format. Examples: \`40\`, \`1:30\`, \`10s\`, \`1m\`**');
        return interaction.reply({ ...card, ephemeral: true });
      }

      const durationMs = player.currentTrack.durationMs || player.currentTrack.length || 0;
      if (timeMs > durationMs) {
        const card = PrefixLayout.messageCard('❌', `**Seek duration exceeds song duration (\`${formatMs(durationMs)}\`).**`);
        return interaction.reply({ ...card, ephemeral: true });
      }

      await player.shoukakuPlayer.seekTo(timeMs);
      const checkEmoji = EMOJIS.checkk || '✅';
      const card = PrefixLayout.messageCard(checkEmoji, `**Successfully seeked to \`${formatMs(timeMs)} / ${formatMs(durationMs)}\`**`);
      return interaction.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while seeking.**');
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

      const timeInput = args[0];
      if (!timeInput) {
        const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', '**Usage: \`seek <time>\` (e.g. \`1:30\`, \`45s\`, \`1m\` or \`120\` seconds)**');
        return message.reply(card);
      }

      const timeMs = parseDuration(timeInput);
      if (timeMs === null || isNaN(timeMs)) {
        const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', '**Invalid time format. Examples: \`40\`, \`1:30\`, \`10s\`, \`1m\`**');
        return message.reply(card);
      }

      const durationMs = player.currentTrack.durationMs || player.currentTrack.length || 0;
      if (timeMs > durationMs) {
        const card = PrefixLayout.messageCard('❌', `**Seek duration exceeds song duration (\`${formatMs(durationMs)}\`).**`);
        return message.reply(card);
      }

      await player.shoukakuPlayer.seekTo(timeMs);
      const checkEmoji = EMOJIS.checkk || '✅';
      const card = PrefixLayout.messageCard(checkEmoji, `**Successfully seeked to \`${formatMs(timeMs)} / ${formatMs(durationMs)}\`**`);
      return message.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while seeking.**');
      return message.reply(card);
    }
  }
};

function parseDuration(input) {
  if (!input) return null;
  const cleanInput = input.trim();
  if (/^\d+$/.test(cleanInput)) {
    return parseInt(cleanInput) * 1000;
  }
  
  if (/^\d+:\d+$/.test(cleanInput)) {
    const [minutes, seconds] = cleanInput.split(':').map(Number);
    return (minutes * 60 + seconds) * 1000;
  }

  if (/^\d+:\d+:\d+$/.test(cleanInput)) {
    const [hours, minutes, seconds] = cleanInput.split(':').map(Number);
    return (hours * 3600 + minutes * 60 + seconds) * 1000;
  }

  const match = cleanInput.match(/^(\d+)(s|m|h|d)$/i);
  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    if (unit === 's') return value * 1000;
    if (unit === 'm') return value * 60000;
    if (unit === 'h') return value * 3600000;
    if (unit === 'd') return value * 86400000;
  }

  return null;
}

function formatMs(ms) {
  if (!ms || ms < 0 || ms === Infinity) return 'Live';
  const seconds = Math.floor((ms / 1000) % 60).toString().padStart(2, '0');
  const minutes = Math.floor((ms / (1000 * 60)) % 60).toString().padStart(2, '0');
  const hours = Math.floor(ms / (1000 * 60 * 60));
  return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
}

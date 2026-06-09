import { PrefixLayout } from '../components/PrefixLayout.js';
import { EMOJIS } from '../emojis.js';
import { checkVoiceChannel } from '../components/VoiceWarningLayout.js';
import { stopTrack } from '../utils/playerManager.js';

export default {
  name: 'sleep',
  aliases: ['sleeptimer', 'timer'],
  description: 'Set a sleep timer to stop music and leave VC after a duration.',
  options: [
    {
      name: 'duration',
      description: 'Duration (e.g. 30m, 1h, 45m) or "cancel" to cancel timer.',
      type: 3, // STRING
      required: true
    }
  ],

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

      const durationArg = interaction.options.getString('duration');
      if (durationArg === 'cancel') {
        if (!player.sleepTimer) {
          const card = PrefixLayout.messageCard('❌', '**No active sleep timer exists for this server.**');
          return interaction.reply({ ...card, ephemeral: false });
        }

        clearTimeout(player.sleepTimer.timeout);
        player.sleepTimer = null;

        const checkEmoji = EMOJIS.checkk || '✅';
        const card = PrefixLayout.messageCard(checkEmoji, '**Successfully cancelled the active sleep timer.**');
        return interaction.reply(card);
      }

      const durationMinutes = parseDuration(durationArg);
      if (!durationMinutes || durationMinutes < 1 || durationMinutes > 180) {
        const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', '**Invalid duration. Examples: \`30m\`, \`1h\`, \`45m\` (range: 1 - 180 minutes).**');
        return interaction.reply({ ...card, ephemeral: true });
      }

      const endTime = Date.now() + durationMinutes * 60 * 1000;
      if (player.sleepTimer) {
        clearTimeout(player.sleepTimer.timeout);
      }

      const timeout = setTimeout(async () => {
        try {
          const textChannel = client.channels.cache.get(player.textChannelId);
          if (textChannel) {
            const card = PrefixLayout.messageCard(EMOJIS.infoo || 'ℹ️', '**Sleep timer ended - Music playback stopped.**');
            textChannel.send(card).catch(() => null);
          }
          await stopTrack(client, interaction.guildId);
        } catch (error) {
          console.error('[Sleep Timer] Error triggering stop:', error);
        }
      }, durationMinutes * 60 * 1000);

      player.sleepTimer = { timeout, endTime, duration: durationMinutes };

      const checkEmoji = EMOJIS.checkk || '✅';
      const card = PrefixLayout.messageCard(checkEmoji, `**Sleep timer set for \`${durationMinutes}m\` (Ends <t:${Math.floor(endTime / 1000)}:t>).**`);
      return interaction.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while setting the sleep timer.**');
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

      const durationArg = args[0];
      if (!durationArg) {
        let prefix = '>';
        if (message.guildId && client.guildPrefixes) {
          prefix = client.guildPrefixes.get(message.guildId) || '>';
        }
        const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', `**Usage: \`${prefix}sleep <duration/cancel>\` (e.g. \`30m\`, \`1h\`, \`cancel\`)**`);
        return message.reply(card);
      }

      if (durationArg === 'cancel') {
        if (!player.sleepTimer) {
          const card = PrefixLayout.messageCard('❌', '**No active sleep timer exists for this server.**');
          return message.reply(card);
        }

        clearTimeout(player.sleepTimer.timeout);
        player.sleepTimer = null;

        const checkEmoji = EMOJIS.checkk || '✅';
        const card = PrefixLayout.messageCard(checkEmoji, '**Successfully cancelled the active sleep timer.**');
        return message.reply(card);
      }

      const durationMinutes = parseDuration(durationArg);
      if (!durationMinutes || durationMinutes < 1 || durationMinutes > 180) {
        const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', '**Invalid duration. Examples: \`30m\`, \`1h\`, \`45m\` (range: 1 - 180 minutes).**');
        return message.reply(card);
      }

      const endTime = Date.now() + durationMinutes * 60 * 1000;
      if (player.sleepTimer) {
        clearTimeout(player.sleepTimer.timeout);
      }

      const timeout = setTimeout(async () => {
        try {
          const textChannel = client.channels.cache.get(player.textChannelId);
          if (textChannel) {
            const card = PrefixLayout.messageCard(EMOJIS.infoo || 'ℹ️', '**Sleep timer ended - Music playback stopped.**');
            textChannel.send(card).catch(() => null);
          }
          await stopTrack(client, message.guildId);
        } catch (error) {
          console.error('[Sleep Timer] Error triggering stop:', error);
        }
      }, durationMinutes * 60 * 1000);

      player.sleepTimer = { timeout, endTime, duration: durationMinutes };

      const checkEmoji = EMOJIS.checkk || '✅';
      const card = PrefixLayout.messageCard(checkEmoji, `**Sleep timer set for \`${durationMinutes}m\` (Ends <t:${Math.floor(endTime / 1000)}:t>).**`);
      return message.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while setting the sleep timer.**');
      return message.reply(card);
    }
  }
};

function parseDuration(input) {
  if (!input) return null;
  const match = input.trim().match(/^(\d+)(m|h)$/i);
  if (!match) return null;

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  if (unit === 'm') return value;
  if (unit === 'h') return value * 60;
  return null;
}

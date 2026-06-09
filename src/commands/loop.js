import { PrefixLayout } from '../components/PrefixLayout.js';
import { EMOJIS } from '../emojis.js';
import { checkVoiceChannel } from '../components/VoiceWarningLayout.js';

export default {
  name: 'loop',
  description: 'Toggle or set loop mode (off, track, queue).',

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

      const modeInput = interaction.options.getString('mode');
      let newMode = player.loopMode;

      if (modeInput) {
        if (['off', 'track', 'queue'].includes(modeInput)) {
          newMode = modeInput;
        }
      } else {
        // Toggle cycle: off -> track -> queue -> off
        if (player.loopMode === 'off') newMode = 'track';
        else if (player.loopMode === 'track') newMode = 'queue';
        else newMode = 'off';
      }

      player.loopMode = newMode;

      const checkEmoji = EMOJIS.checkk || '✅';
      const modeLabels = { off: 'Disabled', track: 'Loop Track 🔂', queue: 'Loop Queue 🔁' };
      const card = PrefixLayout.messageCard(checkEmoji, `**Loop mode has been set to \`${modeLabels[newMode]}\`.**`);
      return interaction.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while setting loop mode.**');
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

      const argMode = args[0]?.toLowerCase().trim();
      let newMode = player.loopMode;

      if (argMode) {
        if (['off', 'track', 'queue', 'song', 'all'].includes(argMode)) {
          if (argMode === 'song') newMode = 'track';
          else if (argMode === 'all') newMode = 'queue';
          else newMode = argMode;
        } else {
          const card = PrefixLayout.messageCard('❌', '**Usage:** `>loop [off/track/queue]`');
          return message.reply(card);
        }
      } else {
        // Toggle cycle
        if (player.loopMode === 'off') newMode = 'track';
        else if (player.loopMode === 'track') newMode = 'queue';
        else newMode = 'off';
      }

      player.loopMode = newMode;

      const checkEmoji = EMOJIS.checkk || '✅';
      const modeLabels = { off: 'Disabled', track: 'Loop Track 🔂', queue: 'Loop Queue 🔁' };
      const card = PrefixLayout.messageCard(checkEmoji, `**Loop mode has been set to \`${modeLabels[newMode]}\`.**`);
      return message.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while setting loop mode.**');
      return message.reply(card);
    }
  }
};

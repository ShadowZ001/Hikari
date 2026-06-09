import { LeaveLayout } from '../components/LeaveLayout.js';
import { PrefixLayout } from '../components/PrefixLayout.js';
import { EMOJIS } from '../emojis.js';

export default {
  name: 'leave',
  description: 'Bot leaves the voice channel.',

  /**
   * Execution handler for prefix commands (e.g. >leave).
   * @param {import('discord.js').Message} message 
   * @param {string[]} args 
   */
  async execute(message, args) {
    try {
      const client = message.client;
      const guildId = message.guildId;
      const warnEmoji = EMOJIS.warnnn || '⚠️';

      const player = client.activePlayers?.get(guildId);
      const guild = client.guilds.cache.get(guildId);
      const voiceChannelId = player?.voiceChannelId || guild?.members?.me?.voice?.channelId;

      if (!voiceChannelId) {
        const card = PrefixLayout.messageCard(warnEmoji, '**I am not connected to any voice channel.**');
        return message.reply(card).catch(console.error);
      }

      // Disconnect
      try {
        if (player && player.shoukakuPlayer) {
          player.shoukakuPlayer.removeAllListeners();
        }
        await client.shoukaku.leaveVoiceChannel(guildId).catch(() => null);
      } catch (err) {
        console.error(err);
      }

      // Cleanup player timeouts and state
      if (player) {
        if (player.timeoutId) {
          clearTimeout(player.timeoutId);
        }
        client.activePlayers.delete(guildId);
      }

      const card = LeaveLayout.successCard(voiceChannelId, message.author.tag);
      await message.reply(card).catch(console.error);
      console.log(`[Hikari Leave] Bot left voice channel in prefix command`);
    } catch (error) {
      console.error('[Hikari] Error in leave command:', error);
    }
  },

  /**
   * Execution handler for slash commands (e.g. /leave).
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   */
  async executeSlash(interaction) {
    try {
      const client = interaction.client;
      const guildId = interaction.guildId;
      const warnEmoji = EMOJIS.warnnn || '⚠️';

      const player = client.activePlayers?.get(guildId);
      const guild = client.guilds.cache.get(guildId);
      const voiceChannelId = player?.voiceChannelId || guild?.members?.me?.voice?.channelId;

      if (!voiceChannelId) {
        const card = PrefixLayout.messageCard(warnEmoji, '**I am not connected to any voice channel.**');
        return interaction.reply({ ...card, ephemeral: false }).catch(console.error);
      }

      // Disconnect
      try {
        if (player && player.shoukakuPlayer) {
          player.shoukakuPlayer.removeAllListeners();
        }
        await client.shoukaku.leaveVoiceChannel(guildId).catch(() => null);
      } catch (err) {
        console.error(err);
      }

      // Cleanup player timeouts and state
      if (player) {
        if (player.timeoutId) {
          clearTimeout(player.timeoutId);
        }
        client.activePlayers.delete(guildId);
      }

      const card = LeaveLayout.successCard(voiceChannelId, interaction.user.tag);
      await interaction.reply(card).catch(console.error);
      console.log(`[Hikari Leave] Bot left voice channel in slash command`);
    } catch (error) {
      console.error('[Hikari] Error in slash leave command:', error);
    }
  }
};

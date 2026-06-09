import GuildConfig from '../models/GuildConfig.js';
import { PrefixLayout } from '../components/PrefixLayout.js';
import { EMOJIS } from '../emojis.js';

export default {
  name: 'setprefix',
  description: 'Set a custom prefix for this server.',

  /**
   * Execution handler for prefix commands (e.g. >setprefix).
   * @param {import('discord.js').Message} message 
   * @param {string[]} args 
   */
  async execute(message, args) {
    try {
      const guildId = message.guildId;
      if (!guildId) return;

      // Initialize client memory cache if missing
      if (!message.client.guildPrefixes) {
        message.client.guildPrefixes = new Map();
      }

      const newPrefix = args[0];

      if (!newPrefix) {
        const infoEmoji = EMOJIS.infoo || '<:infoo:1498633206339997777>';
        return message.reply(PrefixLayout.messageCard(infoEmoji, 'Provide a new prefix.'));
      }

      // Update prefix in database
      let config = await GuildConfig.findOne({ guildId });
      if (!config) {
        config = new GuildConfig({ guildId, ignoredChannels: [], prefix: newPrefix });
      } else {
        config.prefix = newPrefix;
      }
      await config.save();

      // Update memory cache
      message.client.guildPrefixes.set(guildId, newPrefix);

      const checkEmoji = EMOJIS.checkk || '<:checkk:1498633200346464276>';
      return message.reply(PrefixLayout.messageCard(checkEmoji, `Prefix updated to ${newPrefix}`));
    } catch (error) {
      console.error('[Hikari] Error executing prefix setprefix command:', error);
    }
  },

  /**
   * Execution handler for slash commands (e.g. /setprefix).
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   */
  async executeSlash(interaction) {
    try {
      const guildId = interaction.guildId;
      if (!guildId) return;

      if (!interaction.client.guildPrefixes) {
        interaction.client.guildPrefixes = new Map();
      }

      const newPrefix = interaction.options.getString('prefix', true);

      // Update database
      let config = await GuildConfig.findOne({ guildId });
      if (!config) {
        config = new GuildConfig({ guildId, ignoredChannels: [], prefix: newPrefix });
      } else {
        config.prefix = newPrefix;
      }
      await config.save();

      // Update memory cache
      interaction.client.guildPrefixes.set(guildId, newPrefix);

      const checkEmoji = EMOJIS.checkk || '<:checkk:1498633200346464276>';
      await interaction.reply(PrefixLayout.messageCard(checkEmoji, `Prefix updated to ${newPrefix}`));
    } catch (error) {
      console.error('[Hikari] Error executing slash setprefix command:', error);
    }
  }
};

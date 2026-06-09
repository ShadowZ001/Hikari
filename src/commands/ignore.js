import GuildConfig from '../models/GuildConfig.js';
import { IgnoreLayout } from '../components/IgnoreLayout.js';
import { EMOJIS } from '../emojis.js';

export default {
  name: 'ignore',
  description: 'Manage the ignored channels list for the bot.',

  /**
   * Execution handler for prefix commands (e.g. >ignore).
   * @param {import('discord.js').Message} message 
   * @param {string[]} args 
   */
  async execute(message, args) {
    try {
      const guildId = message.guildId;
      if (!guildId) return;

      const subcommand = args[0]?.toLowerCase();

      // Initialize ignoredChannels Map on the client if it doesn't exist
      if (!message.client.ignoredChannels) {
        message.client.ignoredChannels = new Map();
      }

      if (subcommand === 'add' || subcommand === 'remove') {
        let channelId = null;
        if (args[1]) {
          const match = args[1].match(/<#(\d+)>/);
          if (match) {
            channelId = match[1];
          } else if (/^\d+$/.test(args[1])) {
            channelId = args[1];
          }
        }

        // Verify channel is valid and exists in this server
        if (!channelId || !message.guild.channels.cache.has(channelId)) {
          const warnEmoji = EMOJIS.warnnn || '<:warnnn:1498633209246646393>';
          return message.reply(IgnoreLayout.messageCard(warnEmoji, 'Please provide a valid channel.'));
        }

        let config = await GuildConfig.findOne({ guildId });
        if (!config) {
          config = new GuildConfig({ guildId, ignoredChannels: [] });
        }

        if (subcommand === 'add') {
          if (!config.ignoredChannels.includes(channelId)) {
            config.ignoredChannels.push(channelId);
            await config.save();
          }
          message.client.ignoredChannels.set(guildId, config.ignoredChannels);

          const checkEmoji = EMOJIS.checkk || '<:checkk:1498633200346464276>';
          return message.reply(IgnoreLayout.messageCard(checkEmoji, `Successfully added <#${channelId}> to the ignore channel list.`));
        } else {
          const index = config.ignoredChannels.indexOf(channelId);
          if (index > -1) {
            config.ignoredChannels.splice(index, 1);
            await config.save();
          }
          message.client.ignoredChannels.set(guildId, config.ignoredChannels);

          const checkEmoji = EMOJIS.checkk || '<:checkk:1498633200346464276>';
          return message.reply(IgnoreLayout.messageCard(checkEmoji, `Successfully removed <#${channelId}> from the ignore channel list.`));
        }
      } 
      
      else if (subcommand === 'list') {
        let config = await GuildConfig.findOne({ guildId });
        const ignoredChannels = config ? config.ignoredChannels : [];

        if (ignoredChannels.length === 0) {
          const infoEmoji = EMOJIS.infoo || '<:infoo:1498633206339997777>';
          return message.reply(IgnoreLayout.messageCard(infoEmoji, 'There are no channels in the ignore channel list.'));
        } else {
          return message.reply(IgnoreLayout.listCard(ignoredChannels));
        }
      } 
      
      else if (subcommand === 'reset') {
        let config = await GuildConfig.findOne({ guildId });
        const ignoredChannels = config ? config.ignoredChannels : [];

        if (ignoredChannels.length === 0) {
          const infoEmoji = EMOJIS.infoo || '<:infoo:1498633206339997777>';
          return message.reply(IgnoreLayout.messageCard(infoEmoji, 'There are no channels in the ignore channel list.'));
        } else {
          if (config) {
            config.ignoredChannels = [];
            await config.save();
          }
          message.client.ignoredChannels.set(guildId, []);

          const checkEmoji = EMOJIS.checkk || '<:checkk:1498633200346464276>';
          return message.reply(IgnoreLayout.messageCard(checkEmoji, 'Successfully cleared the ignore channel list.'));
        }
      }

      // If no valid subcommand is provided, show the help layout
      const username = message.member?.displayName || message.author.username;
      await message.reply(IgnoreLayout.help(username));
    } catch (error) {
      console.error('[Hikari] Error executing prefix ignore command:', error);
    }
  },

  /**
   * Execution handler for slash commands (e.g. /ignore).
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   */
  async executeSlash(interaction) {
    try {
      const guildId = interaction.guildId;
      if (!guildId) return;

      const subcommand = interaction.options.getSubcommand(true);

      if (!interaction.client.ignoredChannels) {
        interaction.client.ignoredChannels = new Map();
      }

      let config = await GuildConfig.findOne({ guildId });
      if (!config) {
        config = new GuildConfig({ guildId, ignoredChannels: [] });
      }

      if (subcommand === 'add') {
        const channel = interaction.options.getChannel('channel', true);
        const channelId = channel.id;

        if (!config.ignoredChannels.includes(channelId)) {
          config.ignoredChannels.push(channelId);
          await config.save();
        }
        interaction.client.ignoredChannels.set(guildId, config.ignoredChannels);

        const checkEmoji = EMOJIS.checkk || '<:checkk:1498633200346464276>';
        await interaction.reply(IgnoreLayout.messageCard(checkEmoji, `Successfully added <#${channelId}> to the ignore channel list.`));
      } 
      
      else if (subcommand === 'remove') {
        const channel = interaction.options.getChannel('channel', true);
        const channelId = channel.id;

        const index = config.ignoredChannels.indexOf(channelId);
        if (index > -1) {
          config.ignoredChannels.splice(index, 1);
          await config.save();
        }
        interaction.client.ignoredChannels.set(guildId, config.ignoredChannels);

        const checkEmoji = EMOJIS.checkk || '<:checkk:1498633200346464276>';
        await interaction.reply(IgnoreLayout.messageCard(checkEmoji, `Successfully removed <#${channelId}> from the ignore channel list.`));
      } 
      
      else if (subcommand === 'list') {
        const ignoredChannels = config ? config.ignoredChannels : [];

        if (ignoredChannels.length === 0) {
          const infoEmoji = EMOJIS.infoo || '<:infoo:1498633206339997777>';
          await interaction.reply(IgnoreLayout.messageCard(infoEmoji, 'There are no channels in the ignore channel list.'));
        } else {
          await interaction.reply(IgnoreLayout.listCard(ignoredChannels));
        }
      } 
      
      else if (subcommand === 'reset') {
        const ignoredChannels = config ? config.ignoredChannels : [];

        if (ignoredChannels.length === 0) {
          const infoEmoji = EMOJIS.infoo || '<:infoo:1498633206339997777>';
          await interaction.reply(IgnoreLayout.messageCard(infoEmoji, 'There are no channels in the ignore channel list.'));
        } else {
          config.ignoredChannels = [];
          await config.save();
          interaction.client.ignoredChannels.set(guildId, []);

          const checkEmoji = EMOJIS.checkk || '<:checkk:1498633200346464276>';
          await interaction.reply(IgnoreLayout.messageCard(checkEmoji, 'Successfully cleared the ignore channel list.'));
        }
      }
    } catch (error) {
      console.error('[Hikari] Error executing slash ignore command:', error);
    }
  }
};

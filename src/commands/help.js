import { HelpLayout } from '../components/HelpLayout.js';
import { PlaylistLayout } from '../components/PlaylistLayout.js';
import GuildConfig from '../models/GuildConfig.js';
import { CONFIG, EMOJIS } from '../emojis.js';

/**
 * Resolves the guild-specific command prefix.
 * @param {import('discord.js').Client} client 
 * @param {string} guildId 
 * @returns {Promise<string>}
 */
async function getPrefix(client, guildId) {
  if (!guildId) return CONFIG.prefix;
  if (!client.guildPrefixes) {
    client.guildPrefixes = new Map();
  }
  let prefix = client.guildPrefixes.get(guildId);
  if (prefix === undefined) {
    try {
      const config = await GuildConfig.findOne({ guildId });
      prefix = config && config.prefix ? config.prefix : CONFIG.prefix;
      client.guildPrefixes.set(guildId, prefix);
    } catch (err) {
      console.error('[Hikari] Error loading prefix in help command:', err);
      prefix = CONFIG.prefix;
    }
  }
  return prefix;
}

export default {
  name: 'help',
  description: 'Displays the list of all available commands or specific command info.',
  
  /**
   * Execution handler for prefix commands (e.g. >help [command]).
   * @param {import('discord.js').Message} message The original Discord message
   * @param {string[]} args Command arguments
   */
  async execute(message, args) {
    try {
      const prefix = await getPrefix(message.client, message.guildId);
      const query = args[0]?.toLowerCase().trim();

      if (query) {
        const command = message.client.commands.get(query) || 
                        message.client.commands.find(cmd => cmd.aliases?.includes(query));

        if (!command) {
          const warnEmoji = EMOJIS.warnnn || '<:warnnn:1498633209246646393>';
          return message.reply(PlaylistLayout.messageCard(warnEmoji, `I couldn't find a command named ${query}.`));
        }

        const details = HelpLayout.commandDetails(prefix, command);
        return message.reply(details);
      }

      const clientId = message.client.user.id || process.env.CLIENT_ID;
      const helpLayout = new HelpLayout(prefix, clientId);
      await message.reply(helpLayout.toPayload());
    } catch (error) {
      console.error('[Hikari] Error executing prefix help command:', error);
    }
  },

  /**
   * Execution handler for slash commands (e.g. /help [command]).
   * @param {import('discord.js').ChatInputCommandInteraction} interaction The slash command interaction
   */
  async executeSlash(interaction) {
    try {
      const prefix = await getPrefix(interaction.client, interaction.guildId);
      const query = interaction.options.getString('command')?.toLowerCase().trim();

      if (query) {
        const command = interaction.client.commands.get(query) || 
                        interaction.client.commands.find(cmd => cmd.aliases?.includes(query));

        if (!command) {
          const warnEmoji = EMOJIS.warnnn || '<:warnnn:1498633209246646393>';
          return interaction.reply(PlaylistLayout.messageCard(warnEmoji, `I couldn't find a command named ${query}.`));
        }

        const details = HelpLayout.commandDetails(prefix, command);
        return interaction.reply(details);
      }

      const clientId = interaction.client.user.id || process.env.CLIENT_ID;
      const helpLayout = new HelpLayout(prefix, clientId);
      await interaction.reply(helpLayout.toPayload());
    } catch (error) {
      console.error('[Hikari] Error executing slash help command:', error);
    }
  }
};

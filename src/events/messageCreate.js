import { Events } from 'discord.js';
import { MentionLayout } from '../components/MentionLayout.js';
import { CONFIG } from '../emojis.js';
import GuildConfig from '../models/GuildConfig.js';
import NoPrefix from '../models/NoPrefix.js';

export default {
  name: Events.MessageCreate,
  once: false,
  /**
   * Fired when a message is sent in any channel the bot can access.
   * Handles prefix-based commands and bot pings/mentions.
   * @param {import('discord.js').Message} message 
   * @param {import('discord.js').Client} client 
   */
  async execute(message, client) {
    // Avoid responding to bots to prevent loop recursion
    if (message.author.bot) return;

    // Check if user is blacklisted bot-wide
    if (client.blacklist?.has(message.author.id)) {
      return; // Silently ignore completely
    }

    // Check if channel is ignored in this server
    const guildId = message.guildId;
    if (guildId) {
      if (!client.ignoredChannels) {
        client.ignoredChannels = new Map();
      }

      let ignoredList = client.ignoredChannels.get(guildId);
      if (!ignoredList) {
        try {
          const config = await GuildConfig.findOne({ guildId });
          ignoredList = config ? config.ignoredChannels : [];
          client.ignoredChannels.set(guildId, ignoredList);
        } catch (err) {
          console.error('[Hikari] Error loading ignored channels from database:', err);
          ignoredList = [];
        }
      }

      if (ignoredList.includes(message.channel.id)) {
        return; // Silently ignore all prefix commands and mentions in this channel
      }
    }

    // Resolve dynamic guild-specific prefix
    let prefix = CONFIG.prefix;
    if (guildId) {
      if (!client.guildPrefixes) {
        client.guildPrefixes = new Map();
      }

      let cachedPrefix = client.guildPrefixes.get(guildId);
      if (cachedPrefix === undefined) {
        try {
          const config = await GuildConfig.findOne({ guildId });
          cachedPrefix = config && config.prefix ? config.prefix : CONFIG.prefix;
          client.guildPrefixes.set(guildId, cachedPrefix);
        } catch (err) {
          console.error('[Hikari] Error loading guild prefix from database:', err);
          cachedPrefix = CONFIG.prefix;
        }
      }
      prefix = cachedPrefix;
    }

    // Check if user has global no-prefix access
    let hasNoPrefix = false;
    try {
      const npData = await NoPrefix.findOne({
        userId: message.author.id,
        noprefix: true,
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } }
        ]
      });
      if (npData) hasNoPrefix = true;
    } catch (err) {
      console.error('[Hikari NoPrefix Check] Error:', err);
    }

    // 1. Handle Prefix-based Commands (e.g. >help)
    let usedPrefix = null;
    if (message.content.startsWith(prefix)) {
      usedPrefix = prefix;
    } else if (hasNoPrefix) {
      usedPrefix = '';
    }

    if (usedPrefix !== null) {
      const args = message.content.slice(usedPrefix.length).trim().split(/ +/);
      const commandName = args.shift()?.toLowerCase();

      if (commandName) {
        const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases?.includes(commandName));
        if (command) {
          try {
            await command.execute(message, args);
            console.log(`[Hikari] Executed prefix command: "${commandName}" for ${message.author.tag}`);
          } catch (error) {
            console.error(`[Hikari] Error executing prefix command "${commandName}":`, error);
            await message.reply('There was an error while executing this command!').catch(err => console.error(err));
          }
          return;
        }
      }
    }

    // 2. Handle Bot Mentions (pings)
    const isMentioned = message.mentions.has(client.user, {
      ignoreRoles: true,
      ignoreEveryone: true
    });

    if (isMentioned) {
      try {
        // Construct the visual response container using the sender's user ID and current prefix
        const mentionLayout = new MentionLayout(message.author.id, client.user.id || process.env.CLIENT_ID, prefix);

        // Send reply with Components V2 format
        await message.reply(mentionLayout.toPayload());
        
        console.log(`[Hikari] Mention reply sent successfully to ${message.author.tag}`);
      } catch (error) {
        console.error('[Hikari] Error responding to mention:', error);
      }
    }
  }
};

import { Events } from 'discord.js';
import { MentionLayout } from '../components/MentionLayout.js';
import { CONFIG } from '../emojis.js';
import GuildConfig from '../models/GuildConfig.js';
import NoPrefix from '../models/NoPrefix.js';

export default {
  name: Events.MessageCreate,
  once: false,

  async execute(message, client) {

    if (message.author.bot) return;

    if (client.blacklist?.has(message.author.id)) {
      return;
    }

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
        return;
      }
    }

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

    const isMentioned = message.mentions.has(client.user, {
      ignoreRoles: true,
      ignoreEveryone: true
    });

    if (isMentioned) {
      try {

        const mentionLayout = new MentionLayout(message.author.id, client.user.id || process.env.CLIENT_ID, prefix);

        await message.reply(mentionLayout.toPayload());

        console.log(`[Hikari] Mention reply sent successfully to ${message.author.tag}`);
      } catch (error) {
        console.error('[Hikari] Error responding to mention:', error);
      }
    }
  }
};

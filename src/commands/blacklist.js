import Blacklist from '../models/Blacklist.js';
import { EMOJIS } from '../emojis.js';
import { PrefixLayout } from '../components/PrefixLayout.js';

export default {
  name: 'blacklist',
  description: 'Manage the bot blacklist.',

  /**
   * Execution handler for prefix commands (e.g. >blacklist).
   * @param {import('discord.js').Message} message 
   * @param {string[]} args 
   */
  async execute(message, args) {
    try {
      const warnEmoji = EMOJIS.warnnn || '⚠️';
      const checkEmoji = EMOJIS.checkk || '✅';
      const infoEmoji = EMOJIS.infoo || 'ℹ️';

      // Check owner permission (read OWNER_IDS from process.env)
      const ownerIds = (process.env.OWNER_IDS || '').split(',').map(id => id.trim());
      if (!ownerIds.includes(message.author.id)) {
        const card = PrefixLayout.messageCard(warnEmoji, '**This command only for bot owners.**');
        return message.reply(card).catch(console.error);
      }

      const subcommand = args[0]?.toLowerCase();
      const client = message.client;

      if (!client.blacklist) {
        client.blacklist = new Set();
      }

      if (subcommand === 'add' || subcommand === 'remove' || subcommand === 'check') {
        let userId = null;
        if (args[1]) {
          const match = args[1].match(/<@!?(\d+)>/);
          if (match) {
            userId = match[1];
          } else if (/^\d+$/.test(args[1])) {
            userId = args[1];
          }
        }

        if (!userId) {
          const card = PrefixLayout.messageCard(warnEmoji, '**Please provide a valid user or user ID.**');
          return message.reply(card).catch(console.error);
        }

        if (subcommand === 'add') {
          if (client.blacklist.has(userId)) {
            const card = PrefixLayout.messageCard(infoEmoji, `**<@${userId}> is already blacklisted.**`);
            return message.reply(card).catch(console.error);
          }

          const entry = new Blacklist({
            userId,
            addedBy: message.author.id
          });
          await entry.save();
          client.blacklist.add(userId);

          const card = PrefixLayout.messageCard(checkEmoji, `**<@${userId}> has been blacklisted.**`);
          return message.reply(card).catch(console.error);
        } 
        
        else if (subcommand === 'remove') {
          if (!client.blacklist.has(userId)) {
            const card = PrefixLayout.messageCard(infoEmoji, `**<@${userId}> is not blacklisted.**`);
            return message.reply(card).catch(console.error);
          }

          await Blacklist.deleteOne({ userId });
          client.blacklist.delete(userId);

          const card = PrefixLayout.messageCard(checkEmoji, `**<@${userId}> has been removed from the blacklist.**`);
          return message.reply(card).catch(console.error);
        } 
        
        else if (subcommand === 'check') {
          const isBlacklisted = client.blacklist.has(userId);
          if (isBlacklisted) {
            const card = PrefixLayout.messageCard(infoEmoji, `**<@${userId}> is blacklisted.**`);
            return message.reply(card).catch(console.error);
          } else {
            const card = PrefixLayout.messageCard(infoEmoji, `**<@${userId}> is not blacklisted.**`);
            return message.reply(card).catch(console.error);
          }
        }
      } 
      
      else if (subcommand === 'list') {
        const list = Array.from(client.blacklist);
        if (list.length === 0) {
          const card = PrefixLayout.messageCard(infoEmoji, '**No blacklisted users.**');
          return message.reply(card).catch(console.error);
        } else {
          const mentions = list.map(id => `<@${id}> (\`${id}\`)`).join('\n');
          const card = PrefixLayout.messageCard(infoEmoji, `**Blacklisted Users:**\n${mentions}`);
          return message.reply(card).catch(console.error);
        }
      } 
      
      else {
        // Show usage instructions
        const card = PrefixLayout.messageCard(infoEmoji, `**Usage:** \`${process.env.PREFIX || '>'}blacklist <add/remove/check/list> [user/ID]\``);
        return message.reply(card).catch(console.error);
      }
    } catch (error) {
      console.error('[Hikari] Error executing prefix blacklist command:', error);
    }
  },

  /**
   * Execution handler for slash commands (e.g. /blacklist).
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   */
  async executeSlash(interaction) {
    try {
      const warnEmoji = EMOJIS.warnnn || '⚠️';
      const checkEmoji = EMOJIS.checkk || '✅';
      const infoEmoji = EMOJIS.infoo || 'ℹ️';

      // Check owner permission (read OWNER_IDS from process.env)
      const ownerIds = (process.env.OWNER_IDS || '').split(',').map(id => id.trim());
      if (!ownerIds.includes(interaction.user.id)) {
        const card = PrefixLayout.messageCard(warnEmoji, '**This command only for bot owners.**');
        return interaction.reply({ ...card, ephemeral: true }).catch(console.error);
      }

      const action = interaction.options.getString('action', true);
      const targetUser = interaction.options.getUser('user');
      const client = interaction.client;

      if (!client.blacklist) {
        client.blacklist = new Set();
      }

      if (action === 'add' || action === 'remove' || action === 'check') {
        if (!targetUser) {
          const card = PrefixLayout.messageCard(warnEmoji, '**Please provide a user for this action.**');
          return interaction.reply({ ...card, ephemeral: false }).catch(console.error);
        }

        const userId = targetUser.id;

        if (action === 'add') {
          if (client.blacklist.has(userId)) {
            const card = PrefixLayout.messageCard(infoEmoji, `**<@${userId}> is already blacklisted.**`);
            return interaction.reply({ ...card, ephemeral: false }).catch(console.error);
          }

          const entry = new Blacklist({
            userId,
            addedBy: interaction.user.id
          });
          await entry.save();
          client.blacklist.add(userId);

          const card = PrefixLayout.messageCard(checkEmoji, `**<@${userId}> has been blacklisted.**`);
          return interaction.reply({ ...card, ephemeral: false }).catch(console.error);
        } 
        
        else if (action === 'remove') {
          if (!client.blacklist.has(userId)) {
            const card = PrefixLayout.messageCard(infoEmoji, `**<@${userId}> is not blacklisted.**`);
            return interaction.reply({ ...card, ephemeral: false }).catch(console.error);
          }

          await Blacklist.deleteOne({ userId });
          client.blacklist.delete(userId);

          const card = PrefixLayout.messageCard(checkEmoji, `**<@${userId}> has been removed from the blacklist.**`);
          return interaction.reply({ ...card, ephemeral: false }).catch(console.error);
        } 
        
        else if (action === 'check') {
          const isBlacklisted = client.blacklist.has(userId);
          if (isBlacklisted) {
            const card = PrefixLayout.messageCard(infoEmoji, `**<@${userId}> is blacklisted.**`);
            return interaction.reply({ ...card, ephemeral: false }).catch(console.error);
          } else {
            const card = PrefixLayout.messageCard(infoEmoji, `**<@${userId}> is not blacklisted.**`);
            return interaction.reply({ ...card, ephemeral: false }).catch(console.error);
          }
        }
      } 
      
      else if (action === 'list') {
        const list = Array.from(client.blacklist);
        if (list.length === 0) {
          const card = PrefixLayout.messageCard(infoEmoji, '**No blacklisted users.**');
          return interaction.reply({ ...card, ephemeral: false }).catch(console.error);
        } else {
          const mentions = list.map(id => `<@${id}> (\`${id}\`)`).join('\n');
          const card = PrefixLayout.messageCard(infoEmoji, `**Blacklisted Users:**\n${mentions}`);
          return interaction.reply({ ...card, ephemeral: false }).catch(console.error);
        }
      }
    } catch (error) {
      console.error('[Hikari] Error executing slash blacklist command:', error);
    }
  }
};

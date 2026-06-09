import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ContainerBuilder, 
  TextDisplayBuilder, 
  SeparatorBuilder, 
  MessageFlags,
  ComponentType,
  ApplicationCommandOptionType
} from 'discord.js';
import NoPrefix from '../models/NoPrefix.js';
import { PrefixLayout } from '../components/PrefixLayout.js';
import { EMOJIS } from '../emojis.js';

export default {
  name: 'nopaccess',
  aliases: ['nopperms', 'nop'],
  description: 'Add, remove, list or check global no-prefix access for users.',
  options: [
    {
      name: 'add',
      description: 'Add a user to global no-prefix access.',
      type: 1, // SUB_COMMAND
      options: [
        {
          name: 'user',
          description: 'The user to add.',
          type: 6, // USER
          required: true
        },
        {
          name: 'duration',
          description: 'Duration (e.g. 24h, 10d, 2w, 1m, 1y or "permanent")',
          type: 3, // STRING
          required: false
        }
      ]
    },
    {
      name: 'remove',
      description: 'Remove a user from global no-prefix access.',
      type: 1, // SUB_COMMAND
      options: [
        {
          name: 'user',
          description: 'The user to remove.',
          type: 6, // USER
          required: true
        }
      ]
    },
    {
      name: 'clear',
      description: 'Clear all users from global no-prefix access.',
      type: 1, // SUB_COMMAND
      options: []
    },
    {
      name: 'status',
      description: "Check a user's global no-prefix access status.",
      type: 1, // SUB_COMMAND
      options: [
        {
          name: 'user',
          description: 'The user to check.',
          type: 6, // USER
          required: true
        }
      ]
    },
    {
      name: 'list',
      description: 'List all users with global no-prefix access.',
      type: 1, // SUB_COMMAND
      options: []
    }
  ],

  async executeSlash(interaction) {
    const ownerIds = (process.env.OWNER_IDS || '').split(',').map(id => id.trim());
    if (!ownerIds.includes(interaction.user.id)) {
      const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', '**This command only for bot owners.**');
      return interaction.reply({ ...card, ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser('user');
    const duration = interaction.options.getString('duration');

    const args = [subcommand];
    if (targetUser) args.push(targetUser.id);
    if (duration) args.push(duration);

    return this.execute(interaction, args);
  },

  async execute(message, args) {
    try {
      const client = message.guild.client;
      const authorId = message.user ? message.user.id : message.author.id;
      const isSlash = !!message.user;

      const ownerIds = (process.env.OWNER_IDS || '').split(',').map(id => id.trim());
      if (!ownerIds.includes(authorId)) {
        const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', '**This command only for bot owners.**');
        if (isSlash) return message.reply({ ...card, ephemeral: true });
        return message.reply(card);
      }

      const subcommand = args[0]?.toLowerCase();
      if (!subcommand) {
        let prefix = '>';
        if (message.guildId && client.guildPrefixes) {
          prefix = client.guildPrefixes.get(message.guildId) || '>';
        }

        const helpHeader = new TextDisplayBuilder().setContent(`### ⚙️ No-Prefix Access Management`);
        const separator = new SeparatorBuilder();
        const usage = new TextDisplayBuilder().setContent(
          `**Usage:**\n` +
          `\`${prefix}nopadd @user [duration]\` - Give no-prefix access (duration: 24h, 10d, perm, etc.)\n` +
          `\`${prefix}nopremove @user\` - Remove no-prefix access\n` +
          `\`${prefix}nopremove all\` - Remove all users\n` +
          `\`${prefix}nopstatus @user\` - Check status\n` +
          `\`${prefix}noplist\` - List users`
        );

        const container = new ContainerBuilder()
          .addTextDisplayComponents(helpHeader)
          .addSeparatorComponents(separator)
          .addTextDisplayComponents(usage);

        const payload = { components: [container], flags: MessageFlags.IsComponentsV2 };
        if (isSlash) return message.reply({ ...payload, ephemeral: true });
        return message.reply(payload);
      }

      const warnEmoji = EMOJIS.warnnn || '⚠️';
      const checkEmoji = EMOJIS.checkk || '✅';

      // 1. ADD SUBCOMMAND
      if (subcommand === 'add' || subcommand === 'a' || subcommand === '+') {
        const targetArg = args[1];
        if (!targetArg) {
          const card = PrefixLayout.messageCard(warnEmoji, '**Please provide a user ID or mention.**');
          if (isSlash) return message.reply({ ...card, ephemeral: true });
          return message.reply(card);
        }

        const targetId = targetArg.replace(/[<@!>]/g, '');
        let targetUser = null;
        try {
          targetUser = await client.users.fetch(targetId);
        } catch (e) {
          const card = PrefixLayout.messageCard('❌', `**Could not find any user with ID \`${targetId}\`.**`);
          if (isSlash) return message.reply({ ...card, ephemeral: true });
          return message.reply(card);
        }

        let expiresAt = null;
        const durationArg = args[2];
        if (durationArg) {
          const durationLower = durationArg.toLowerCase();
          if (!['p', 'perm', 'permanent'].includes(durationLower)) {
            const match = durationArg.match(/^(\d+)(h|hr|hrs|d|day|days|w|week|weeks|m|month|months|y|yr|yrs|year|years)$/i);
            if (match) {
              const value = parseInt(match[1]);
              const unit = match[2].toLowerCase();
              const now = Date.now();
              let ms = 0;

              if (unit.startsWith('h')) ms = value * 3600000;
              else if (unit.startsWith('d')) ms = value * 86400000;
              else if (unit.startsWith('w')) ms = value * 604800000;
              else if (unit.startsWith('m')) ms = value * 2592000000;
              else if (unit.startsWith('y')) ms = value * 31536000000;

              expiresAt = new Date(now + ms);
            } else {
              const card = PrefixLayout.messageCard(warnEmoji, '**Invalid duration format. Examples: \`24h\`, \`10d\`, \`2w\`, \`permanent\`**');
              if (isSlash) return message.reply({ ...card, ephemeral: true });
              return message.reply(card);
            }
          }
        }

        await NoPrefix.findOneAndUpdate(
          { userId: targetUser.id },
          {
            userId: targetUser.id,
            noprefix: true,
            expiresAt: expiresAt
          },
          { upsert: true, new: true }
        );

        const expiryText = expiresAt ? `Expiring <t:${Math.floor(expiresAt.getTime() / 1000)}:R>` : 'Permanent';
        const card = PrefixLayout.messageCard(checkEmoji, `**Granted global no-prefix access to ${targetUser.username} (${expiryText}).**`);
        if (isSlash) return message.reply(card);
        return message.reply(card);
      }

      // 2. REMOVE SUBCOMMAND
      if (subcommand === 'remove' || subcommand === 'r' || subcommand === '-') {
        const targetArg = args[1];
        if (!targetArg) {
          const card = PrefixLayout.messageCard(warnEmoji, '**Please provide a user ID or mention.**');
          if (isSlash) return message.reply({ ...card, ephemeral: true });
          return message.reply(card);
        }

        if (targetArg.toLowerCase() === 'all') {
          const res = await NoPrefix.deleteMany({});
          const card = PrefixLayout.messageCard(checkEmoji, `**Successfully cleared no-prefix access from all \`${res.deletedCount}\` users.**`);
          if (isSlash) return message.reply(card);
          return message.reply(card);
        }

        const targetId = targetArg.replace(/[<@!>]/g, '');
        const res = await NoPrefix.deleteOne({ userId: targetId });

        if (res.deletedCount === 0) {
          const card = PrefixLayout.messageCard(warnEmoji, `**User with ID \`${targetId}\` does not have no-prefix access.**`);
          if (isSlash) return message.reply({ ...card, ephemeral: true });
          return message.reply(card);
        }

        const card = PrefixLayout.messageCard(checkEmoji, `**Successfully revoked no-prefix access from user \`${targetId}\`.**`);
        if (isSlash) return message.reply(card);
        return message.reply(card);
      }

      // 3. CLEAR SUBCOMMAND
      if (subcommand === 'clear') {
        const res = await NoPrefix.deleteMany({});
        const card = PrefixLayout.messageCard(checkEmoji, `**Successfully cleared no-prefix access from all \`${res.deletedCount}\` users.**`);
        if (isSlash) return message.reply(card);
        return message.reply(card);
      }

      // 4. STATUS SUBCOMMAND
      if (subcommand === 'status' || subcommand === 's' || subcommand === 'check') {
        const targetArg = args[1];
        if (!targetArg) {
          const card = PrefixLayout.messageCard(warnEmoji, '**Please provide a user ID or mention.**');
          if (isSlash) return message.reply({ ...card, ephemeral: true });
          return message.reply(card);
        }

        const targetId = targetArg.replace(/[<@!>]/g, '');
        const entry = await NoPrefix.findOne({ userId: targetId });

        if (!entry) {
          const card = PrefixLayout.messageCard(EMOJIS.infoo || 'ℹ️', `**User with ID \`${targetId}\` does not have no-prefix access.**`);
          if (isSlash) return message.reply(card);
          return message.reply(card);
        }

        const isExpired = entry.expiresAt && entry.expiresAt.getTime() <= Date.now();
        if (isExpired) {
          const card = PrefixLayout.messageCard(EMOJIS.infoo || 'ℹ️', `**User with ID \`${targetId}\` had access, but it expired <t:${Math.floor(entry.expiresAt.getTime() / 1000)}:R>.**`);
          if (isSlash) return message.reply(card);
          return message.reply(card);
        }

        const expiryText = entry.expiresAt ? `Expires <t:${Math.floor(entry.expiresAt.getTime() / 1000)}:R>` : 'Permanent';
        const card = PrefixLayout.messageCard(checkEmoji, `**User with ID \`${targetId}\` has valid no-prefix access (${expiryText}).**`);
        if (isSlash) return message.reply(card);
        return message.reply(card);
      }

      // 5. LIST SUBCOMMAND
      if (subcommand === 'list' || subcommand === 'l') {
        const list = await NoPrefix.find({});
        const activeList = list.filter(entry => !entry.expiresAt || entry.expiresAt.getTime() > Date.now());

        if (activeList.length === 0) {
          const card = PrefixLayout.messageCard(EMOJIS.infoo || 'ℹ️', '**No users have global no-prefix access.**');
          if (isSlash) return message.reply(card);
          return message.reply(card);
        }

        if (isSlash && !message.deferred && !message.replied) {
          await message.deferReply();
        }

        const itemsPerPage = 10;
        const pages = Math.ceil(activeList.length / itemsPerPage);
        let currentPage = 0;

        const createContainer = async (page) => {
          const start = page * itemsPerPage;
          const end = start + itemsPerPage;
          const currentEntries = activeList.slice(start, end);

          const userList = await Promise.all(currentEntries.map(async (entry, idx) => {
            const user = await client.users.fetch(entry.userId).catch(() => null);
            const tag = user ? user.tag : `Unknown (\`${entry.userId}\`)`;
            const expiry = entry.expiresAt ? `<t:${Math.floor(entry.expiresAt.getTime() / 1000)}:R>` : '`Permanent`';
            return `**\`${start + idx + 1}\` | ${tag} • ${expiry}**`;
          }));

          const header = new TextDisplayBuilder().setContent(`### ${checkEmoji} Global No-Prefix Access List`);
          const separator1 = new SeparatorBuilder();
          const display = new TextDisplayBuilder().setContent(userList.join('\n'));
          const separator2 = new SeparatorBuilder();
          const footer = new TextDisplayBuilder().setContent(`*Page ${page + 1} of ${pages} • Total: ${activeList.length} users*`);

          return new ContainerBuilder()
            .addTextDisplayComponents(header)
            .addSeparatorComponents(separator1)
            .addTextDisplayComponents(display)
            .addSeparatorComponents(separator2)
            .addTextDisplayComponents(footer);
        };

        const components = [await createContainer(currentPage)];
        let row = null;

        if (pages > 1) {
          row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('nop_prev').setLabel('Previous').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('nop_next').setLabel('Next').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('nop_close').setLabel('Close').setStyle(ButtonStyle.Danger)
          );
          components.push(row);
        }

        const payload = {
          components,
          flags: MessageFlags.IsComponentsV2
        };

        const msg = isSlash ? await message.editReply(payload) : await message.reply(payload);

        if (pages > 1) {
          const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: (i) => i.user.id === authorId,
            time: 120000
          });

          collector.on('collect', async (i) => {
            if (i.customId === 'nop_close') {
              collector.stop();
              return await i.message.delete().catch(() => {});
            }

            if (i.customId === 'nop_prev') {
              currentPage = (currentPage - 1 + pages) % pages;
            } else if (i.customId === 'nop_next') {
              currentPage = (currentPage + 1) % pages;
            }

            await i.update({
              components: [await createContainer(currentPage), row],
              flags: MessageFlags.IsComponentsV2
            });
          });

          collector.on('end', async () => {
            try {
              await msg.edit({
                components: [await createContainer(currentPage)],
                flags: MessageFlags.IsComponentsV2
              }).catch(() => {});
            } catch (err) {}
          });
        }
      }

    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while managing no-prefix access.**');
      if (message.deferred || message.replied) {
        return message.editReply(card);
      } else {
        return message.reply(card);
      }
    }
  }
};

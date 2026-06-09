import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ContainerBuilder, 
  TextDisplayBuilder, 
  SeparatorBuilder, 
  MessageFlags,
  ComponentType
} from 'discord.js';
import { PrefixLayout } from '../components/PrefixLayout.js';
import { EMOJIS } from '../emojis.js';

export default {
  name: 'mutual',
  aliases: ['mutualservers', 'sharedservers'],
  description: 'Show mutual servers between the bot and a user.',
  options: [
    {
      name: 'user',
      description: 'The user to check mutual servers with.',
      type: 6, // USER
      required: true
    }
  ],

  async executeSlash(interaction) {
    const ownerIds = (process.env.OWNER_IDS || '').split(',').map(id => id.trim());
    if (!ownerIds.includes(interaction.user.id)) {
      const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', '**This command only for bot owners.**');
      return interaction.reply({ ...card, ephemeral: true });
    }

    const targetUser = interaction.options.getUser('user');
    const args = [targetUser.id];
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

      const rawInput = args[0];
      if (!rawInput) {
        const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', '**Please mention a user or provide a user ID.**');
        if (isSlash) return message.reply({ ...card, ephemeral: true });
        return message.reply(card);
      }

      const targetId = rawInput.replace(/[<@!>]/g, '');
      let targetUser = null;
      try {
        targetUser = await client.users.fetch(targetId);
      } catch (err) {
        const card = PrefixLayout.messageCard('❌', `**Could not find any user with ID \`${targetId}\`.**`);
        if (isSlash) return message.reply({ ...card, ephemeral: true });
        return message.reply(card);
      }

      if (isSlash && !message.deferred && !message.replied) {
        await message.deferReply();
      }

      const mutualGuilds = [];
      for (const [guildId, guild] of client.guilds.cache) {
        try {
          const member = await guild.members.fetch(targetUser.id).catch(() => null);
          if (member) {
            mutualGuilds.push({
              id: guild.id,
              name: guild.name,
              memberCount: guild.memberCount,
              ownerId: guild.ownerId
            });
          }
        } catch (e) {}
      }

      if (mutualGuilds.length === 0) {
        const card = PrefixLayout.messageCard(EMOJIS.infoo || 'ℹ️', `**No mutual servers found with ${targetUser.tag} (\`${targetUser.id}\`).**`);
        if (isSlash) return message.editReply(card);
        return message.reply(card);
      }

      const serversPerPage = 10;
      const pages = Math.ceil(mutualGuilds.length / serversPerPage);
      let currentPage = 0;

      const createContainer = (page) => {
        const start = page * serversPerPage;
        const end = start + serversPerPage;
        const currentServers = mutualGuilds.slice(start, end);

        const checkEmoji = EMOJIS.checkk || '✅';
        const header = new TextDisplayBuilder().setContent(`### ${checkEmoji} Mutual Servers with ${targetUser.username}`);
        const separator1 = new SeparatorBuilder();

        const serverList = currentServers.map((guild, i) => {
          const position = start + i + 1;
          const ownerTag = guild.ownerId === targetUser.id ? ' 👑' : '';
          return `**\`${position}\` | ${guild.name}${ownerTag} | \`${guild.id}\` | \`${guild.memberCount} members\`**`;
        }).join('\n');

        const display = new TextDisplayBuilder().setContent(serverList);
        const separator2 = new SeparatorBuilder();
        const footer = new TextDisplayBuilder().setContent(`*Page ${page + 1} of ${pages} • Total: ${mutualGuilds.length} servers*`);

        return new ContainerBuilder()
          .addTextDisplayComponents(header)
          .addSeparatorComponents(separator1)
          .addTextDisplayComponents(display)
          .addSeparatorComponents(separator2)
          .addTextDisplayComponents(footer);
      };

      const components = [createContainer(currentPage)];
      let row = null;

      if (pages > 1) {
        row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('mutual_prev').setLabel('Previous').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('mutual_next').setLabel('Next').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('mutual_close').setLabel('Close').setStyle(ButtonStyle.Danger)
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
          if (i.customId === 'mutual_close') {
            collector.stop();
            return await i.message.delete().catch(() => {});
          }

          if (i.customId === 'mutual_prev') {
            currentPage = (currentPage - 1 + pages) % pages;
          } else if (i.customId === 'mutual_next') {
            currentPage = (currentPage + 1) % pages;
          }

          await i.update({
            components: [createContainer(currentPage), row],
            flags: MessageFlags.IsComponentsV2
          });
        });

        collector.on('end', async () => {
          try {
            await msg.edit({
              components: [createContainer(currentPage)],
              flags: MessageFlags.IsComponentsV2
            }).catch(() => {});
          } catch (err) {}
        });
      }

    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while fetching mutual servers.**');
      if (message.deferred || message.replied) {
        return message.editReply(card);
      } else {
        return message.reply(card);
      }
    }
  }
};

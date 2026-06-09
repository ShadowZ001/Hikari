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
  name: 'serverlist',
  aliases: ['sl', 'servers'],
  description: 'Lists all servers the bot is currently in (Owner-Only).',

  async executeSlash(interaction) {
    try {
      const client = interaction.client;
      const ownerIds = (process.env.OWNER_IDS || '').split(',').map(id => id.trim());
      if (!ownerIds.includes(interaction.user.id)) {
        const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', '**This command only for bot owners.**');
        return interaction.reply({ ...card, ephemeral: true });
      }

      const guilds = Array.from(client.guilds.cache.values()).sort((a, b) => b.memberCount - a.memberCount);

      if (guilds.length === 0) {
        const card = PrefixLayout.messageCard('ℹ️', '**No servers found.**');
        return interaction.reply(card);
      }

      const serversPerPage = 10;
      const pages = Math.ceil(guilds.length / serversPerPage);
      let currentPage = 0;

      const createContainer = (page) => {
        const start = page * serversPerPage;
        const end = start + serversPerPage;
        const currentGuilds = guilds.slice(start, end);

        const serverList = currentGuilds.map((guild, i) => {
          return `**\`${start + i + 1}\`** | **${guild.name}** | \`${guild.id}\` | \`${guild.memberCount}\` members`;
        });

        const checkEmoji = EMOJIS.checkk || '✅';
        const header = new TextDisplayBuilder()
          .setContent(`### ${checkEmoji} ${client.user.username} Server List (Page ${page + 1}/${pages})`);
        const separator = new SeparatorBuilder();
        const listDisplay = new TextDisplayBuilder().setContent(serverList.join('\n'));

        return new ContainerBuilder()
          .addTextDisplayComponents(header)
          .addSeparatorComponents(separator)
          .addTextDisplayComponents(listDisplay);
      };

      const getButtonsRow = (page) => {
        return new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`sl_home_${interaction.user.id}`)
            .setLabel('Home')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId(`sl_prev_${interaction.user.id}`)
            .setLabel('Previous')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId(`sl_next_${interaction.user.id}`)
            .setLabel('Next')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === pages - 1),
          new ButtonBuilder()
            .setCustomId(`sl_close_${interaction.user.id}`)
            .setLabel('Close')
            .setStyle(ButtonStyle.Danger)
        );
      };

      const payload = {
        components: [createContainer(currentPage)],
        flags: MessageFlags.IsComponentsV2
      };

      if (pages > 1) {
        payload.components.push(getButtonsRow(currentPage));
      } else {
        // Just add a close button
        payload.components.push(new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`sl_close_${interaction.user.id}`)
            .setLabel('Close')
            .setStyle(ButtonStyle.Danger)
        ));
      }

      const msg = await interaction.reply(payload);

      const collector = msg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: (i) => {
          if (i.user.id === interaction.user.id) return true;
          i.reply({ content: '❌ You cannot control this session.', ephemeral: true });
          return false;
        },
        time: 120000,
        idle: 60000
      });

      collector.on('collect', async (i) => {
        const parts = i.customId.split('_');
        const action = parts[1];

        if (action === 'close') {
          collector.stop();
          return await interaction.deleteReply().catch(() => {});
        } else if (action === 'home') {
          currentPage = 0;
        } else if (action === 'prev') {
          currentPage = Math.max(0, currentPage - 1);
        } else if (action === 'next') {
          currentPage = Math.min(pages - 1, currentPage + 1);
        }

        const updatedPayload = {
          components: [createContainer(currentPage), getButtonsRow(currentPage)],
          flags: MessageFlags.IsComponentsV2
        };

        await i.update(updatedPayload);
      });

      collector.on('end', async (collected, reason) => {
        if (reason === 'time' || reason === 'idle') {
          // Edit to remove buttons
          await interaction.editReply({
            components: [createContainer(currentPage)],
            flags: MessageFlags.IsComponentsV2
          }).catch(() => {});
        }
      });

    } catch (error) {
      console.error('Error in serverlist slash command:', error);
      const card = PrefixLayout.messageCard('❌', `**An error occurred while running the serverlist command.**`);
      return interaction.reply({ ...card, ephemeral: true });
    }
  },

  async execute(message, args) {
    try {
      const client = message.client;
      const ownerIds = (process.env.OWNER_IDS || '').split(',').map(id => id.trim());
      if (!ownerIds.includes(message.author.id)) {
        const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', '**This command only for bot owners.**');
        return message.reply(card);
      }

      const guilds = Array.from(client.guilds.cache.values()).sort((a, b) => b.memberCount - a.memberCount);

      if (guilds.length === 0) {
        const card = PrefixLayout.messageCard('ℹ️', '**No servers found.**');
        return message.reply(card);
      }

      const serversPerPage = 10;
      const pages = Math.ceil(guilds.length / serversPerPage);
      let currentPage = 0;

      const createContainer = (page) => {
        const start = page * serversPerPage;
        const end = start + serversPerPage;
        const currentGuilds = guilds.slice(start, end);

        const serverList = currentGuilds.map((guild, i) => {
          return `**\`${start + i + 1}\`** | **${guild.name}** | \`${guild.id}\` | \`${guild.memberCount}\` members`;
        });

        const checkEmoji = EMOJIS.checkk || '✅';
        const header = new TextDisplayBuilder()
          .setContent(`### ${checkEmoji} ${client.user.username} Server List (Page ${page + 1}/${pages})`);
        const separator = new SeparatorBuilder();
        const listDisplay = new TextDisplayBuilder().setContent(serverList.join('\n'));

        return new ContainerBuilder()
          .addTextDisplayComponents(header)
          .addSeparatorComponents(separator)
          .addTextDisplayComponents(listDisplay);
      };

      const getButtonsRow = (page) => {
        return new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`sl_home_${message.author.id}`)
            .setLabel('Home')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId(`sl_prev_${message.author.id}`)
            .setLabel('Previous')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId(`sl_next_${message.author.id}`)
            .setLabel('Next')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === pages - 1),
          new ButtonBuilder()
            .setCustomId(`sl_close_${message.author.id}`)
            .setLabel('Close')
            .setStyle(ButtonStyle.Danger)
        );
      };

      const payload = {
        components: [createContainer(currentPage)],
        flags: MessageFlags.IsComponentsV2
      };

      if (pages > 1) {
        payload.components.push(getButtonsRow(currentPage));
      } else {
        payload.components.push(new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`sl_close_${message.author.id}`)
            .setLabel('Close')
            .setStyle(ButtonStyle.Danger)
        ));
      }

      const msg = await message.reply(payload);

      const collector = msg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: (i) => {
          if (i.user.id === message.author.id) return true;
          i.reply({ content: '❌ You cannot control this session.', ephemeral: true });
          return false;
        },
        time: 120000,
        idle: 60000
      });

      collector.on('collect', async (i) => {
        const parts = i.customId.split('_');
        const action = parts[1];

        if (action === 'close') {
          collector.stop();
          return await msg.delete().catch(() => {});
        } else if (action === 'home') {
          currentPage = 0;
        } else if (action === 'prev') {
          currentPage = Math.max(0, currentPage - 1);
        } else if (action === 'next') {
          currentPage = Math.min(pages - 1, currentPage + 1);
        }

        const updatedPayload = {
          components: [createContainer(currentPage), getButtonsRow(currentPage)],
          flags: MessageFlags.IsComponentsV2
        };

        await i.update(updatedPayload);
      });

      collector.on('end', async (collected, reason) => {
        if (reason === 'time' || reason === 'idle') {
          await msg.edit({
            components: [createContainer(currentPage)],
            flags: MessageFlags.IsComponentsV2
          }).catch(() => {});
        }
      });

    } catch (error) {
      console.error('Error in serverlist command:', error);
      const card = PrefixLayout.messageCard('❌', `**An error occurred while running the serverlist command.**`);
      return message.reply(card);
    }
  }
};

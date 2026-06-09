import Liked from '../models/Liked.js';
import { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ComponentType, MessageFlags } from 'discord.js';
import { EMOJIS } from '../emojis.js';
import { PrefixLayout } from '../components/PrefixLayout.js';

function formatDuration(ms) {
  if (!ms || ms === 0 || ms === 'Unknown') return 'Unknown';
  if (typeof ms === 'string' && ms.includes(':')) return ms;

  const duration = parseInt(ms, 10);
  if (isNaN(duration)) return 'Unknown';

  const seconds = Math.floor((duration / 1000) % 60);
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  const hours = Math.floor(duration / (1000 * 60 * 60));

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default {
  name: 'unlike',
  aliases: ['delfav', 'removefav', 'unliked', 'deleteliked'],
  description: 'Remove songs from your favorites.',

  async executeSlash(interaction) {
    const interactionWrapper = {
      guild: interaction.guild,
      channel: interaction.channel,
      author: interaction.user,
      member: interaction.member,
      createdTimestamp: interaction.createdTimestamp,
      reply: async (options) => {
        if (interaction.deferred) {
          return await interaction.editReply(options);
        } else if (interaction.replied) {
          return await interaction.followUp(options);
        } else {
          return await interaction.reply(options);
        }
      },
    };
    return this.execute(interactionWrapper, []);
  },

  async execute(message, args) {
    const userId = message.author.id;
    const client = message.guild.client;

    try {
      const userLiked = await Liked.findOne({ userId });

      if (!userLiked || !userLiked.songs.length) {
        const card = PrefixLayout.messageCard(EMOJIS.infoo || 'ℹ️', "**You don't have any favorite songs!**");
        return message.reply(card);
      }

      const songsPerPage = 10;
      let currentPage = 0;

      const generateContainer = (page, currentFavorites) => {
        const start = page * songsPerPage;
        const end = Math.min(start + songsPerPage, currentFavorites.length);
        const pageTracks = currentFavorites.slice(start, end);

        const container = new ContainerBuilder();

        const headerDisplay = new TextDisplayBuilder()
          .setContent(`### 💔 Remove Favorites`);

        const separator1 = new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small);

        const infoDisplay = new TextDisplayBuilder()
          .setContent(
            `**Favorites:** \`${currentFavorites.length} tracks\` • **Page:** \`${page + 1} of ${Math.ceil(currentFavorites.length / songsPerPage)}\``
          );

        const separator2 = new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small);

        const tracksText = pageTracks.map((track, i) => {
          const position = start + i;
          const duration = track.duration || track.length;
          return `\`${position + 1}.\` **[${track.title}](${track.uri})** - \`${formatDuration(duration)}\``;
        }).join('\n');

        const tracksDisplay = new TextDisplayBuilder()
          .setContent(tracksText);

        container.addTextDisplayComponents(headerDisplay)
          .addSeparatorComponents(separator1)
          .addTextDisplayComponents(infoDisplay)
          .addSeparatorComponents(separator2)
          .addTextDisplayComponents(tracksDisplay);

        return container;
      };

      const generateSelectMenu = (page, currentFavorites) => {
        const start = page * songsPerPage;
        const end = Math.min(start + songsPerPage, currentFavorites.length);
        const pageTracks = currentFavorites.slice(start, end);

        const options = pageTracks.map((track, i) => {
          const position = start + i;
          return {
            label: `${position + 1}. ${track.title.substring(0, 90)}`,
            description: `Duration: ${formatDuration(track.duration || track.length)}`,
            value: `unlike_${position}`
          };
        });

        return new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('select_favorite')
            .setPlaceholder('Select favorites to remove')
            .setMinValues(1)
            .setMaxValues(Math.min(options.length, 10))
            .addOptions(options)
        );
      };

      const generateButtons = (page, currentFavorites) => {
        const currentTotalPages = Math.ceil(currentFavorites.length / songsPerPage);
        return new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('clear_favorites')
            .setLabel('Clear All')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('previous')
            .setLabel('Previous')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentTotalPages <= 1),
          new ButtonBuilder()
            .setCustomId('next')
            .setLabel('Next')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentTotalPages <= 1),
          new ButtonBuilder()
            .setCustomId('close_session')
            .setLabel('Close')
            .setStyle(ButtonStyle.Secondary)
        );
      };

      const initialContainer = generateContainer(currentPage, userLiked.songs);
      const initialSelect = generateSelectMenu(currentPage, userLiked.songs);
      const initialButtons = generateButtons(currentPage, userLiked.songs);

      initialContainer.addActionRowComponents(initialSelect);
      initialContainer.addActionRowComponents(initialButtons);

      const msg = await message.reply({
        components: [initialContainer],
        flags: MessageFlags.IsComponentsV2
      });

      const collector = msg.createMessageComponentCollector({
        filter: (i) => {
          if (i.user.id === message.author.id) return true;
          i.reply({
            content: '❌ You cannot interact with this menu.',
            ephemeral: true
          });
          return false;
        },
        idle: 60000
      });

      collector.on('collect', async (interaction) => {
        const currentUserLiked = await Liked.findOne({ userId });

        if (!currentUserLiked || (interaction.customId !== 'clear_favorites' && currentUserLiked.songs.length === 0)) {
          const card = PrefixLayout.messageCard(EMOJIS.infoo || 'ℹ️', "**You don't have any favorite songs left!**");
          await interaction.reply({ ...card, ephemeral: true });
          collector.stop();
          return;
        }

        if (interaction.customId === 'select_favorite') {
          await interaction.deferUpdate();

          const selectedValues = interaction.values;
          const positions = selectedValues.map(v => parseInt(v.split('_')[1], 10)).sort((a, b) => b - a);

          const removedTracks = [];
          for (const pos of positions) {
            const track = currentUserLiked.songs[pos];
            if (track) {
              removedTracks.push(track.title);
              currentUserLiked.songs.splice(pos, 1);
            }
          }

          await currentUserLiked.save();

          // Reset page if current page is now empty
          const newTotalPages = Math.ceil(currentUserLiked.songs.length / songsPerPage);
          if (currentPage >= newTotalPages && newTotalPages > 0) {
            currentPage = newTotalPages - 1;
          }

          if (currentUserLiked.songs.length === 0) {
            const card = PrefixLayout.messageCard(EMOJIS.checkk || '✅', `**Removed ${removedTracks.length} favorite(s). Your favorites list is now empty!**`);
            await msg.edit({ ...card, components: [] });
            collector.stop();
          } else {
            const container = generateContainer(currentPage, currentUserLiked.songs);
            const selectMenu = generateSelectMenu(currentPage, currentUserLiked.songs);
            const buttons = generateButtons(currentPage, currentUserLiked.songs);
            
            container.addActionRowComponents(selectMenu);
            container.addActionRowComponents(buttons);

            await msg.edit({
              components: [container],
              flags: MessageFlags.IsComponentsV2
            });
          }
        } else if (interaction.customId === 'previous') {
          await interaction.deferUpdate();
          const currentFavs = currentUserLiked.songs;
          const totalPagesNow = Math.ceil(currentFavs.length / songsPerPage);
          currentPage = currentPage > 0 ? currentPage - 1 : totalPagesNow - 1;

          const container = generateContainer(currentPage, currentFavs);
          const selectMenu = generateSelectMenu(currentPage, currentFavs);
          const buttons = generateButtons(currentPage, currentFavs);
          
          container.addActionRowComponents(selectMenu);
          container.addActionRowComponents(buttons);

          await msg.edit({
            components: [container],
            flags: MessageFlags.IsComponentsV2
          });
        } else if (interaction.customId === 'next') {
          await interaction.deferUpdate();
          const currentFavs = currentUserLiked.songs;
          const totalPagesNow = Math.ceil(currentFavs.length / songsPerPage);
          currentPage = currentPage < totalPagesNow - 1 ? currentPage + 1 : 0;

          const container = generateContainer(currentPage, currentFavs);
          const selectMenu = generateSelectMenu(currentPage, currentFavs);
          const buttons = generateButtons(currentPage, currentFavs);
          
          container.addActionRowComponents(selectMenu);
          container.addActionRowComponents(buttons);

          await msg.edit({
            components: [container],
            flags: MessageFlags.IsComponentsV2
          });
        } else if (interaction.customId === 'clear_favorites') {
          await interaction.deferUpdate();

          const favCount = currentUserLiked.songs.length;
          currentUserLiked.songs = [];
          await currentUserLiked.save();

          const card = PrefixLayout.messageCard(EMOJIS.checkk || '✅', `**Cleared all ${favCount} favorites.**`);
          await msg.edit({ ...card, components: [] });

          collector.stop();
        } else if (interaction.customId === 'close_session') {
          await interaction.deferUpdate();
          collector.stop('manual');
          await msg.delete().catch(() => {});
        }
      });

      collector.on('end', async (collected, reason) => {
        if (reason === 'idle' || reason === 'time') {
          const card = PrefixLayout.messageCard(EMOJIS.infoo || 'ℹ️', '**Session timed out. Run the command again.**');
          await msg.edit({ ...card, components: [] }).catch(() => {});
        }
      });

    } catch (err) {
      console.error(err);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while removing from favorites.**');
      return message.reply(card);
    }
  }
};

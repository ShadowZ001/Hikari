import { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';

export class LikedLayout {
  /**
   * Card for successfully liking a track.
   * @param {object} track 
   * @param {import('discord.js').User} user 
   * @returns {object} Discord message payload
   */
  static successLiked(track, user) {
    const container = new ContainerBuilder();

    const headerDisplay = new TextDisplayBuilder().setContent(`### ❤️ Added to Favorites`);
    container.addTextDisplayComponents(headerDisplay);

    const divider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    container.addSeparatorComponents(divider);

    const bodyContent = 
      `Successfully liked **[${track.title}](${track.uri})**.\n\n` +
      `-# Action by ${user.tag}`;
    const bodyDisplay = new TextDisplayBuilder().setContent(bodyContent);
    container.addTextDisplayComponents(bodyDisplay);

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };
  }

  /**
   * Card for already liked track.
   * @param {object} track 
   * @returns {object} Discord message payload
   */
  static alreadyLiked(track) {
    const container = new ContainerBuilder();

    const headerDisplay = new TextDisplayBuilder().setContent(`### ℹ️ Already in Favorites`);
    container.addTextDisplayComponents(headerDisplay);

    const divider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    container.addSeparatorComponents(divider);

    const bodyContent = `**[${track.title}](${track.uri})** is already in your favorites list.`;
    const bodyDisplay = new TextDisplayBuilder().setContent(bodyContent);
    container.addTextDisplayComponents(bodyDisplay);

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };
  }

  /**
   * Card for successfully unliking a track.
   * @param {object} track 
   * @param {import('discord.js').User} user 
   * @returns {object} Discord message payload
   */
  static successUnliked(track, user) {
    const container = new ContainerBuilder();

    const headerDisplay = new TextDisplayBuilder().setContent(`### 💔 Removed from Favorites`);
    container.addTextDisplayComponents(headerDisplay);

    const divider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    container.addSeparatorComponents(divider);

    const bodyContent = 
      `Successfully removed **[${track.title}](${track.uri})** from your favorites.\n\n` +
      `-# Action by ${user.tag}`;
    const bodyDisplay = new TextDisplayBuilder().setContent(bodyContent);
    container.addTextDisplayComponents(bodyDisplay);

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };
  }

  /**
   * Paginated favorites list card.
   * @param {object[]} songs 
   * @param {number} page (0-based)
   * @param {number} totalPages 
   * @param {import('discord.js').User} requester 
   * @returns {object} Discord message payload
   */
  static listCard(songs, page, totalPages, requester) {
    const container = new ContainerBuilder();

    const headerDisplay = new TextDisplayBuilder().setContent(`### ❤️ Your Favorite Songs`);
    container.addTextDisplayComponents(headerDisplay);

    const divider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    container.addSeparatorComponents(divider);

    let contentText = '';
    if (songs.length === 0) {
      contentText = `You haven't liked any songs yet! Use \`>like\` while a track is playing.`;
    } else {
      const startIndex = page * 10;
      songs.forEach((song, i) => {
        contentText += `\`${startIndex + i + 1}.\` **[${song.title}](${song.uri})**\n`;
      });
      contentText += `\n*Page \`${page + 1}\` of \`${totalPages}\` (Total: \`${songs.length}\` songs)*`;
    }

    const bodyDisplay = new TextDisplayBuilder().setContent(contentText);
    container.addTextDisplayComponents(bodyDisplay);

    // Pagination buttons
    if (totalPages > 1) {
      const prevBtn = new ButtonBuilder()
        .setCustomId(`liked_prev_${page}_${requester.id}`)
        .setLabel('◀ Previous')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 0);

      const nextBtn = new ButtonBuilder()
        .setCustomId(`liked_next_${page}_${requester.id}`)
        .setLabel('Next ▶')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page >= totalPages - 1);

      const actionRow = new ActionRowBuilder().addComponents(prevBtn, nextBtn);
      container.addActionRowComponents(actionRow);
    }

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };
  }
}

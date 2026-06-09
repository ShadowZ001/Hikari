import { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';

export class QueueLayout {
  /**
   * Generates a paginated card for the server queue.
   * @param {object} player The player instance
   * @param {number} page (0-based page index)
   * @param {import('discord.js').User} requester User requesting the list
   * @returns {object} Discord message payload
   */
  static queueCard(player, page, requester) {
    const container = new ContainerBuilder();

    const currentTrack = player.currentTrack || player.playlist.tracks[player.currentIndex];
    
    // 1. Header (Title)
    const headerDisplay = new TextDisplayBuilder().setContent(`### 🎶 Server Music Queue`);
    container.addTextDisplayComponents(headerDisplay);

    // 2. Line Divider
    const divider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    container.addSeparatorComponents(divider);

    let queueContent = '';

    // Now Playing section
    if (currentTrack) {
      const artist = currentTrack.artist || currentTrack.author || 'Unknown Artist';
      const duration = currentTrack.duration || '3:44';
      queueContent += `**Now Playing:**\n`;
      queueContent += `🎵 **[${currentTrack.title}](${currentTrack.uri})**\n`;
      queueContent += `👤 \`${artist}\` • ⏱️ \`${duration}\` • Requested by <@${player.requester?.id || requester.id}>\n\n`;
    } else {
      queueContent += `*Nothing is currently playing.*\n\n`;
    }

    // Upcoming section
    // player.playlist.tracks holds all tracks. The upcoming tracks are from player.currentIndex + 1 onwards.
    const upcomingTracks = player.playlist.tracks.slice(player.currentIndex + 1);
    
    const itemsPerPage = 10;
    const totalPages = Math.max(1, Math.ceil(upcomingTracks.length / itemsPerPage));
    const currentPage = Math.min(page, totalPages - 1);
    
    queueContent += `**Up Next:**\n`;
    if (upcomingTracks.length === 0) {
      queueContent += `*No songs in queue. Add songs with \`>play\`!*\n`;
    } else {
      const startIndex = currentPage * itemsPerPage;
      const endIndex = Math.min(startIndex + itemsPerPage, upcomingTracks.length);
      const pageTracks = upcomingTracks.slice(startIndex, endIndex);

      pageTracks.forEach((track, i) => {
        const idx = startIndex + i + 1;
        const duration = track.duration || '3:44';
        const trackRequester = track.requesterTag ? ` • *Requested by ${track.requesterTag}*` : '';
        queueContent += `\`${idx}.\` **[${track.title}](${track.uri})** - \`${duration}\`${trackRequester}\n`;
      });
    }

    // Queue metadata summary
    const totalTracks = player.playlist.tracks.length;
    const loopStatus = player.loopMode === 'track' ? '🔂 Track' : (player.loopMode === 'queue' ? '🔁 Queue' : '❌ Off');
    const autoplayStatus = player.autoplay ? '🟢 On' : '❌ Off';
    
    queueContent += `\n`;
    queueContent += `**Settings:** Loop: \`${loopStatus}\` • Autoplay: \`${autoplayStatus}\`\n`;
    queueContent += `*Page \`${currentPage + 1}\` of \`${totalPages}\` (Total: \`${totalTracks}\` tracks)*`;

    const bodyDisplay = new TextDisplayBuilder().setContent(queueContent);
    container.addTextDisplayComponents(bodyDisplay);

    // Pagination buttons
    if (totalPages > 1) {
      const prevBtn = new ButtonBuilder()
        .setCustomId(`queue_prev_${currentPage}_${requester.id}`)
        .setLabel('◀ Previous')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === 0);

      const nextBtn = new ButtonBuilder()
        .setCustomId(`queue_next_${currentPage}_${requester.id}`)
        .setLabel('Next ▶')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage >= totalPages - 1);

      const actionRow = new ActionRowBuilder().addComponents(prevBtn, nextBtn);
      container.addActionRowComponents(actionRow);
    }

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };
  }
}

import { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';

export class QueueLayout {

  static queueCard(player, page, requester) {
    const container = new ContainerBuilder();

    const currentTrack = player.currentTrack || player.playlist.tracks[player.currentIndex];

    const headerDisplay = new TextDisplayBuilder().setContent(`### 🎶 Server Music Queue`);
    container.addTextDisplayComponents(headerDisplay);

    const divider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    container.addSeparatorComponents(divider);

    let queueContent = '';

    if (currentTrack) {
      const artist = currentTrack.artist || currentTrack.author || 'Unknown Artist';
      const duration = currentTrack.duration || '3:44';
      queueContent += `**Now Playing:**\n`;
      queueContent += `🎵 **[${currentTrack.title}](${currentTrack.uri})**\n`;
      queueContent += `👤 \`${artist}\` • ⏱️ \`${duration}\` • Requested by <@${player.requester?.id || requester.id}>\n\n`;
    } else {
      queueContent += `*Nothing is currently playing.*\n\n`;
    }

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

    const totalTracks = player.playlist.tracks.length;
    const loopStatus = player.loopMode === 'track' ? '🔂 Track' : (player.loopMode === 'queue' ? '🔁 Queue' : '❌ Off');
    const autoplayStatus = player.autoplay ? '🟢 On' : '❌ Off';

    queueContent += `\n`;
    queueContent += `**Settings:** Loop: \`${loopStatus}\` • Autoplay: \`${autoplayStatus}\`\n`;
    queueContent += `*Page \`${currentPage + 1}\` of \`${totalPages}\` (Total: \`${totalTracks}\` tracks)*`;

    const bodyDisplay = new TextDisplayBuilder().setContent(queueContent);
    container.addTextDisplayComponents(bodyDisplay);

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

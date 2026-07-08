import { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';

export class EnqueueLayout {

  static trackCard(track, position, requester, queueLength, trackIndex) {
    const container = new ContainerBuilder();

    const headerDisplay = new TextDisplayBuilder().setContent(`### 📥 Enqueued Track`);
    container.addTextDisplayComponents(headerDisplay);

    const divider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    container.addSeparatorComponents(divider);

    const durationStr = track.duration || '3:44';
    const artistStr = track.artist || track.author || 'Unknown Artist';
    const bodyContent =
      `**[${track.title}](${track.uri})**\n` +
      `👤 **Artist:** \`${artistStr}\` • ⏱️ **Duration:** \`${durationStr}\`\n` +
      `🔢 **Queue Position:** \`#${position}\`\n\n` +
      `-# Enqueued by ${requester.tag}`;
    const bodyDisplay = new TextDisplayBuilder().setContent(bodyContent);
    container.addTextDisplayComponents(bodyDisplay);

    if (position > 0) {
      const removeBtn = new ButtonBuilder()
        .setCustomId(`enqueue_remove_${trackIndex}`)
        .setLabel('Remove')
        .setStyle(ButtonStyle.Danger);

      const playNextBtn = new ButtonBuilder()
        .setCustomId(`enqueue_playnext_${trackIndex}`)
        .setLabel('Play Next')
        .setStyle(ButtonStyle.Secondary);

      const actionRow = new ActionRowBuilder().addComponents(playNextBtn, removeBtn);
      container.addActionRowComponents(actionRow);
    }

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };
  }

  static playlistCard(playlistName, trackCount, totalDuration, startPosition, requester) {
    const container = new ContainerBuilder();

    const headerDisplay = new TextDisplayBuilder().setContent(`### 📥 Playlist Enqueued`);
    container.addTextDisplayComponents(headerDisplay);

    const divider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    container.addSeparatorComponents(divider);

    const bodyContent =
      `**Playlist:** \`${playlistName}\`\n` +
      `🎶 **Tracks Added:** \`${trackCount}\` • ⏱️ **Total Duration:** \`${totalDuration}\`\n` +
      `🔢 **Queue Position Starts:** \`#${startPosition}\`\n\n` +
      `-# Enqueued by ${requester.tag}`;
    const bodyDisplay = new TextDisplayBuilder().setContent(bodyContent);
    container.addTextDisplayComponents(bodyDisplay);

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };
  }
}

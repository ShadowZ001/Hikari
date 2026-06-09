import { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';

export class EnqueueLayout {
  /**
   * Generates a card for a single enqueued track.
   * @param {object} track The track object
   * @param {number} position The position in the queue (1-based)
   * @param {import('discord.js').User} requester The user who queued it
   * @param {number} queueLength Total queue length
   * @param {number} trackIndex The track index in the active player list
   * @returns {object} Discord message payload
   */
  static trackCard(track, position, requester, queueLength, trackIndex) {
    const container = new ContainerBuilder();
    // Do not call setAccentColor here to avoid a hex colored border, keeping it clean

    // 1. Title
    const headerDisplay = new TextDisplayBuilder().setContent(`### 📥 Enqueued Track`);
    container.addTextDisplayComponents(headerDisplay);

    // 2. Divider
    const divider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    container.addSeparatorComponents(divider);

    // 3. Body text
    const durationStr = track.duration || '3:44';
    const artistStr = track.artist || track.author || 'Unknown Artist';
    const bodyContent = 
      `**[${track.title}](${track.uri})**\n` +
      `👤 **Artist:** \`${artistStr}\` • ⏱️ **Duration:** \`${durationStr}\`\n` +
      `🔢 **Queue Position:** \`#${position}\`\n\n` +
      `-# Enqueued by ${requester.tag}`;
    const bodyDisplay = new TextDisplayBuilder().setContent(bodyContent);
    container.addTextDisplayComponents(bodyDisplay);

    // 4. Action Buttons (only show if it's not playing immediately)
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

  /**
   * Generates a card for an enqueued playlist.
   * @param {string} playlistName The playlist name
   * @param {number} trackCount Count of tracks added
   * @param {string} totalDuration Formatted total duration of tracks
   * @param {number} startPosition Starting position in queue
   * @param {import('discord.js').User} requester The user who queued it
   * @returns {object} Discord message payload
   */
  static playlistCard(playlistName, trackCount, totalDuration, startPosition, requester) {
    const container = new ContainerBuilder();

    // 1. Title
    const headerDisplay = new TextDisplayBuilder().setContent(`### 📥 Playlist Enqueued`);
    container.addTextDisplayComponents(headerDisplay);

    // 2. Divider
    const divider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    container.addSeparatorComponents(divider);

    // 3. Body text
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

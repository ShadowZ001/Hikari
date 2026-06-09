import { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } from 'discord.js';

/**
 * Visual layout panel for the leave command using Discord Components V2 (Cv2).
 */
export class LeaveLayout {
  /**
   * Generates the voice channel leave status card.
   * @param {string} channelId The voice channel ID (optional)
   * @param {string} username The tag/username of the user
   * @returns {object} Discord message payload
   */
  static successCard(channelId, username) {
    const container = new ContainerBuilder();
    // Do not call setAccentColor here to avoid a hex colored border, keeping it clean

    // 1. Header (Title)
    const headerDisplay = new TextDisplayBuilder().setContent(`### 🔇 Left Voice Channel`);
    container.addTextDisplayComponents(headerDisplay);

    // 2. Line Divider
    const divider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    container.addSeparatorComponents(divider);

    // 3. Body text
    const channelMention = channelId ? `<#${channelId}>` : 'the voice channel';
    const bodyContent = 
      `Successfully left ${channelMention}.\n\n` +
      `-# Requested by ${username}`;
    const bodyDisplay = new TextDisplayBuilder().setContent(bodyContent);
    container.addTextDisplayComponents(bodyDisplay);

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };
  }
}

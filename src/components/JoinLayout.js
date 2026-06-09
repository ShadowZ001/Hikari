import { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } from 'discord.js';

/**
 * Visual layout panel for the join command using Discord Components V2 (Cv2).
 */
export class JoinLayout {
  /**
   * Generates the voice channel join status card.
   * @param {string} channelId The voice channel ID
   * @param {string} username The tag/username of the user
   * @returns {object} Discord message payload
   */
  static successCard(channelId, username) {
    const container = new ContainerBuilder();
    // Do not call setAccentColor here to avoid a hex colored border, keeping it clean

    // 1. Header (Title)
    const headerDisplay = new TextDisplayBuilder().setContent(`### 🔊 Joined Voice Channel`);
    container.addTextDisplayComponents(headerDisplay);

    // 2. Line Divider
    const divider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    container.addSeparatorComponents(divider);

    // 3. Body text
    const bodyContent = 
      `Successfully joined voice channel <#${channelId}>!\n\n` +
      `-# Requested by ${username}`;
    const bodyDisplay = new TextDisplayBuilder().setContent(bodyContent);
    container.addTextDisplayComponents(bodyDisplay);

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };
  }
}

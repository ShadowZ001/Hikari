import { ContainerBuilder, TextDisplayBuilder, MessageFlags } from 'discord.js';

/**
 * Visual layout panel for the prefix configuration using Discord Components V2 (Cv2).
 */
export class PrefixLayout {
  /**
   * Generates a simple notification card with an emoji and message text.
   * @param {string} emoji The emoji prefix
   * @param {string} text The message text
   * @returns {object} Discord message payload
   */
  static messageCard(emoji, text) {
    const container = new ContainerBuilder();
    // Do not call setAccentColor here to avoid a hex colored border, keeping it clean
    
    const content = `${emoji} ${text}`;
    const textDisplay = new TextDisplayBuilder().setContent(content);
    container.addTextDisplayComponents(textDisplay);

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };
  }
}

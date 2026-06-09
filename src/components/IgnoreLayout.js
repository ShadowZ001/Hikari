import { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } from 'discord.js';
import { EMOJIS } from '../emojis.js';

/**
 * Visual layout panel for the ignore command utilizing Discord Components V2 (Cv2).
 */
export class IgnoreLayout {
  /**
   * Generates help layout displaying aliases, usage, and monospace argument notation.
   * @param {string} username The username of the command requester
   * @returns {object} Discord message payload
   */
  static help(username) {
    const container = new ContainerBuilder();
    // Do not call setAccentColor here to avoid a hex colored border, keeping it clean
    
    // 1. Monospace argument block
    const codeBlock = `\`\`\`\n[ ] = Optional Argument\n<> = Required Argument\nDo NOT type these when using commands!\n\`\`\``;
    const textDisplay1 = new TextDisplayBuilder().setContent(codeBlock);
    container.addTextDisplayComponents(textDisplay1);

    // 2. Separator line
    const divider1 = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    container.addSeparatorComponents(divider1);

    // 3. Aliases and Usage
    const middleText = `**Aliases:** [ignore]\n**Usage:** add/remove/list/reset`;
    const textDisplay2 = new TextDisplayBuilder().setContent(middleText);
    container.addTextDisplayComponents(textDisplay2);

    // 4. Separator line
    const divider2 = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    container.addSeparatorComponents(divider2);

    // 5. Requested by footer
    const footerText = `Requested By ${username}`;
    const textDisplay3 = new TextDisplayBuilder().setContent(footerText);
    container.addTextDisplayComponents(textDisplay3);

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };
  }

  /**
   * Generates a simple notification card with an emoji and message text.
   * @param {string} emoji The emoji prefix
   * @param {string} text The message text
   * @returns {object} Discord message payload
   */
  static messageCard(emoji, text) {
    const container = new ContainerBuilder();
    const content = `${emoji} ${text}`;
    const textDisplay = new TextDisplayBuilder().setContent(content);
    container.addTextDisplayComponents(textDisplay);

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };
  }

  /**
   * Generates the list of ignored channels.
   * @param {string[]} channelIds Array of ignored channel IDs
   * @returns {object} Discord message payload
   */
  static listCard(channelIds) {
    const container = new ContainerBuilder();
    const checkEmoji = EMOJIS.checkk || '<:checkk:1498633200346464276>';
    
    let content = `**${checkEmoji} Ignore channel list :**`;
    if (channelIds.length > 0) {
      const formattedList = channelIds.map((id, index) => `${index + 1}. <#${id}>`).join('\n');
      content += `\n\n${formattedList}`;
    }
    
    const textDisplay = new TextDisplayBuilder().setContent(content);
    container.addTextDisplayComponents(textDisplay);

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };
  }
}

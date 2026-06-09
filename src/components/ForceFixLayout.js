import { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } from 'discord.js';

/**
 * Visual layout panel for the forcefix command confirmation using Discord Components V2 (Cv2).
 */
export class ForceFixLayout {
  /**
   * Generates the force fix status card.
   * @param {string} action The action string used (e.g. 'full')
   * @param {string} username The tag/username of the user who executed the command
   * @returns {object} Discord message payload
   */
  static successCard(action, username) {
    const container = new ContainerBuilder();
    // Do not call setAccentColor here to avoid a hex colored border, keeping it clean

    // 1. Header (Title)
    const headerDisplay = new TextDisplayBuilder().setContent(`### ☑️ Music Bot Fixed`);
    container.addTextDisplayComponents(headerDisplay);

    // 2. Line Divider
    const divider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    container.addSeparatorComponents(divider);

    // 3. Body text
    const bodyContent = 
      `Music bot has been force fixed using \`${action}\` action!\n\n` +
      `-# Action: ${action} | Fixed by ${username}`;
    const bodyDisplay = new TextDisplayBuilder().setContent(bodyContent);
    container.addTextDisplayComponents(bodyDisplay);

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };
  }
}

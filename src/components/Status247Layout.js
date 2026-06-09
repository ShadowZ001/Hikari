import { 
  ContainerBuilder, 
  TextDisplayBuilder, 
  SeparatorBuilder, 
  SeparatorSpacingSize, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  MessageFlags 
} from 'discord.js';

/**
 * Visual layout panel sent when checking/modifying the bot's 24/7 status.
 * Utilizes Discord Components V2 (Cv2).
 * Formats status information, a divider line, an audit username, and action buttons.
 */
export class Status247Layout {
  /**
   * @param {object} options
   * @param {'Enabled' | 'Disabled'} options.status The current status
   * @param {string} options.username The tag/username of the user performing the action
   */
  constructor({ status, username }) {
    this.container = new ContainerBuilder();
    // Do not call setAccentColor here to avoid a hex colored border, keeping it clean

    // 1. Current Status Header
    const statusText = `**247 Current Status:** ${status}`;
    const statusDisplay = new TextDisplayBuilder().setContent(statusText);
    this.container.addTextDisplayComponents(statusDisplay);

    // 2. Horizontal Divider Line
    const divider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    this.container.addSeparatorComponents(divider);

    // 3. Audit User Info
    const auditText = `Action by: ${username}`;
    const auditDisplay = new TextDisplayBuilder().setContent(auditText);
    this.container.addTextDisplayComponents(auditDisplay);

    // 4. Action Row containing Enable and Disable Buttons
    const enableButton = new ButtonBuilder()
      .setCustomId('247_enable')
      .setLabel('Enable')
      .setStyle(ButtonStyle.Success)
      .setDisabled(status === 'Enabled'); // Disable Enable button if already enabled

    const disableButton = new ButtonBuilder()
      .setCustomId('247_disable')
      .setLabel('Disable')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(status === 'Disabled'); // Disable Disable button if already disabled

    const actionRow = new ActionRowBuilder().addComponents(enableButton, disableButton);
    this.container.addActionRowComponents(actionRow);
  }

  /**
   * Compiles the layout into a complete Discord message payload object.
   * @param {object} [extraOptions]
   * @returns {object}
   */
  toPayload(extraOptions = {}) {
    return {
      components: [this.container],
      flags: MessageFlags.IsComponentsV2,
      ...extraOptions
    };
  }
}

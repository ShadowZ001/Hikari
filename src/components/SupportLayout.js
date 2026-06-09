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
import { EMOJIS } from '../emojis.js';

/**
 * Visual layout panel sent when requesting the support server link.
 * Utilizes Discord Components V2 (Cv2).
 * Formats a text display, a divider line, and a Support Link button.
 */
export class SupportLayout {
  constructor() {
    this.container = new ContainerBuilder();
    // Do not call setAccentColor here to avoid a hex colored border, keeping it clean

    // 1. Text display for the support message
    const infoEmoji = EMOJIS.infoo || '<:infoo:1498633206339997777>';
    const textContent = `**${infoEmoji} Join Hikari support server.**`;
    const textDisplay = new TextDisplayBuilder().setContent(textContent);
    this.container.addTextDisplayComponents(textDisplay);

    // 2. Add divider line (straight white/light line)
    const divider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    this.container.addSeparatorComponents(divider);

    // 3. Action row with the Support Link Button
    const supportUrl = process.env.SUPPORT_URL || 'https://discord.gg/placeholder';
    
    const supportButton = new ButtonBuilder()
      .setLabel('Support')
      .setStyle(ButtonStyle.Link)
      .setURL(supportUrl);

    const actionRow = new ActionRowBuilder().addComponents(supportButton);
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

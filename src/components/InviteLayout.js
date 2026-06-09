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
 * Visual layout panel sent when generating the bot invite link.
 * Utilizes Discord Components V2 (Cv2).
 * Formats a text display, a horizontal divider line (straight white line), and a Link button.
 */
export class InviteLayout {
  /**
   * @param {string} clientId The Discord application client ID to generate the invite URL
   */
  constructor(clientId) {
    if (!clientId) {
      throw new Error('[Hikari Layout Error] clientId is required to build InviteLayout.');
    }

    this.container = new ContainerBuilder();
    // Do not call setAccentColor here to avoid a hex colored border, keeping it clean

    // 1. Text display for the invite message
    const infoEmoji = EMOJIS.infoo || '<:infoo:1498633206339997777>';
    const textContent = `**${infoEmoji} Invite Hikari to your server.**`;
    const textDisplay = new TextDisplayBuilder().setContent(textContent);
    this.container.addTextDisplayComponents(textDisplay);

    // 2. Add divider line (straight white/light line)
    const divider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    this.container.addSeparatorComponents(divider);

    // 3. Action row with the Link Button
    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot+applications.commands`;
    
    const inviteButton = new ButtonBuilder()
      .setLabel('Invite')
      .setStyle(ButtonStyle.Link)
      .setURL(inviteUrl);

    const actionRow = new ActionRowBuilder().addComponents(inviteButton);
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

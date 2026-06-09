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
import { EMOJIS, CONFIG } from '../emojis.js';

/**
 * Visual layout panel sent when the Hikari bot is mentioned.
 * Utilizes Discord Components V2 (Cv2).
 * 
 * Layout spacing strategy:
 * - Line 1 and Line 2 are grouped in a single TextDisplay component (separated by \n)
 *   to ensure they attach directly with no default Discord component spacing.
 * - A Separator component is used to create a clean visual gap.
 * - Line 3 is placed in its own TextDisplay component below the separator.
 */
export class MentionLayout {
  /**
   * @param {string} targetUserId The Discord User ID of the sender to mention
   * @param {string} clientId The Discord Client ID of the bot for the invite link
   * @param {string} [prefix] Guild-specific prefix, defaults to global config prefix
   */
  constructor(targetUserId, clientId, prefix = CONFIG.prefix) {
    if (!targetUserId) {
      throw new Error('[Hikari Layout Error] targetUserId is required to build MentionLayout.');
    }
    if (!clientId) {
      throw new Error('[Hikari Layout Error] clientId is required to build MentionLayout.');
    }

    this.container = new ContainerBuilder();
    // Do not call setAccentColor here to avoid a hex colored border, keeping it clean

    const checkEmoji = EMOJIS.checkk || '<:checkk:1498633200346464276>';
    const infoEmoji = EMOJIS.infoo || '<:infoo:1498633206339997777>';

    const lines = [
      `**${checkEmoji} Hey <@${targetUserId}>!**`,
      `**${infoEmoji} My prefix for this server is ${prefix}**`,
      `**${infoEmoji} Type ${prefix}help for a list of commands.**`
    ];

    // Group Line 1 and Line 2 together inside a single TextDisplay component
    // This attaches them exactly below each other with no extra component padding/space
    const group1Content = `${lines[0]}\n${lines[1]}`;
    const textDisplay1 = new TextDisplayBuilder().setContent(group1Content);
    this.container.addTextDisplayComponents(textDisplay1);

    // Add a blank spacer (no divider line) to create a visual gap
    const spacer = new SeparatorBuilder()
      .setDivider(false)
      .setSpacing(SeparatorSpacingSize.Small);
    this.container.addSeparatorComponents(spacer);

    // Place Line 3 in its own separate TextDisplay component below the spacer
    const textDisplay2 = new TextDisplayBuilder().setContent(lines[2]);
    this.container.addTextDisplayComponents(textDisplay2);

    // Add divider line
    const divider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    this.container.addSeparatorComponents(divider);

    // Add Action row with Link Buttons
    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot+applications.commands`;
    const supportUrl = process.env.SUPPORT_URL || 'https://discord.gg/your-support-server';

    const inviteButton = new ButtonBuilder()
      .setLabel('Invite')
      .setStyle(ButtonStyle.Link)
      .setURL(inviteUrl);

    const supportButton = new ButtonBuilder()
      .setLabel('Support')
      .setStyle(ButtonStyle.Link)
      .setURL(supportUrl);

    const actionRow = new ActionRowBuilder().addComponents(inviteButton, supportButton);
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

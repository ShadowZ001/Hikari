import { 
  ContainerBuilder, 
  TextDisplayBuilder, 
  SeparatorBuilder, 
  SeparatorSpacingSize, 
  MessageFlags 
} from 'discord.js';

/**
 * Visual layout panel for the membercount command utilizing Discord Components V2 (Cv2).
 */
export class MemberCountLayout {
  /**
   * @param {object} options
   * @param {number} options.total Total members
   * @param {number} options.humans Humans count
   * @param {number} options.bots Bots count
   * @param {number} options.online Online members count
   * @param {import('discord.js').User} options.requester The user who requested the count
   * @param {string} options.timeString Formatted time string (e.g. 5:29 PM)
   */
  constructor({ total, humans, bots, online, requester, timeString }) {
    this.container = new ContainerBuilder();
    // Do not call setAccentColor here to avoid a hex colored border, keeping it clean

    const requesterTag = requester.username;

    // 1. Header (Name + Requester info)
    const headerText = 
      `### Member Count\n` +
      `Requested by ${requesterTag} - ${timeString}`;
    const headerDisplay = new TextDisplayBuilder().setContent(headerText);
    this.container.addTextDisplayComponents(headerDisplay);

    // 2. Line Divider
    const divider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    this.container.addSeparatorComponents(divider);

    // 3. Stats Codeblock matching exact spacing:
    // Total Members : 7
    // Humans        : 3
    // Bots          : 4
    // Online        : 5
    const statsContent = 
      `\`\`\`\n` +
      `Total Members : ${total}\n` +
      `Humans        : ${humans}\n` +
      `Bots          : ${bots}\n` +
      `Online        : ${online}\n` +
      `\`\`\``;
    const statsDisplay = new TextDisplayBuilder().setContent(statsContent);
    this.container.addTextDisplayComponents(statsDisplay);
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

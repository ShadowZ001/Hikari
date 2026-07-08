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

export class SupportLayout {
  constructor() {
    this.container = new ContainerBuilder();

    const infoEmoji = EMOJIS.infoo || '<:infoo:1498633206339997777>';
    const textContent = `**${infoEmoji} Join Hikari support server.**`;
    const textDisplay = new TextDisplayBuilder().setContent(textContent);
    this.container.addTextDisplayComponents(textDisplay);

    const divider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    this.container.addSeparatorComponents(divider);

    const supportUrl = process.env.SUPPORT_URL || 'https://discord.gg/placeholder';

    const supportButton = new ButtonBuilder()
      .setLabel('Support')
      .setStyle(ButtonStyle.Link)
      .setURL(supportUrl);

    const actionRow = new ActionRowBuilder().addComponents(supportButton);
    this.container.addActionRowComponents(actionRow);
  }

  toPayload(extraOptions = {}) {
    return {
      components: [this.container],
      flags: MessageFlags.IsComponentsV2,
      ...extraOptions
    };
  }
}

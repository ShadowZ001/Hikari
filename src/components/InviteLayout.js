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

export class InviteLayout {

  constructor(clientId) {
    if (!clientId) {
      throw new Error('[Hikari Layout Error] clientId is required to build InviteLayout.');
    }

    this.container = new ContainerBuilder();

    const infoEmoji = EMOJIS.infoo || '<:infoo:1498633206339997777>';
    const textContent = `**${infoEmoji} Invite Hikari to your server.**`;
    const textDisplay = new TextDisplayBuilder().setContent(textContent);
    this.container.addTextDisplayComponents(textDisplay);

    const divider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    this.container.addSeparatorComponents(divider);

    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot+applications.commands`;

    const inviteButton = new ButtonBuilder()
      .setLabel('Invite')
      .setStyle(ButtonStyle.Link)
      .setURL(inviteUrl);

    const actionRow = new ActionRowBuilder().addComponents(inviteButton);
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

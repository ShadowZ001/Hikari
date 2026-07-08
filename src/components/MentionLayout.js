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

export class MentionLayout {

  constructor(targetUserId, clientId, prefix = CONFIG.prefix) {
    if (!targetUserId) {
      throw new Error('[Hikari Layout Error] targetUserId is required to build MentionLayout.');
    }
    if (!clientId) {
      throw new Error('[Hikari Layout Error] clientId is required to build MentionLayout.');
    }

    this.container = new ContainerBuilder();

    const checkEmoji = EMOJIS.checkk || '<:checkk:1498633200346464276>';
    const infoEmoji = EMOJIS.infoo || '<:infoo:1498633206339997777>';

    const lines = [
      `**${checkEmoji} Hey <@${targetUserId}>!**`,
      `**${infoEmoji} My prefix for this server is ${prefix}**`,
      `**${infoEmoji} Type ${prefix}help for a list of commands.**`
    ];

    const group1Content = `${lines[0]}\n${lines[1]}`;
    const textDisplay1 = new TextDisplayBuilder().setContent(group1Content);
    this.container.addTextDisplayComponents(textDisplay1);

    const spacer = new SeparatorBuilder()
      .setDivider(false)
      .setSpacing(SeparatorSpacingSize.Small);
    this.container.addSeparatorComponents(spacer);

    const textDisplay2 = new TextDisplayBuilder().setContent(lines[2]);
    this.container.addTextDisplayComponents(textDisplay2);

    const divider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    this.container.addSeparatorComponents(divider);

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

  toPayload(extraOptions = {}) {
    return {
      components: [this.container],
      flags: MessageFlags.IsComponentsV2,
      ...extraOptions
    };
  }
}

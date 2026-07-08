import {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} from 'discord.js';

export class MemberCountLayout {

  constructor({ total, humans, bots, online, requester, timeString }) {
    this.container = new ContainerBuilder();

    const requesterTag = requester.username;

    const headerText =
      `### Member Count\n` +
      `Requested by ${requesterTag} - ${timeString}`;
    const headerDisplay = new TextDisplayBuilder().setContent(headerText);
    this.container.addTextDisplayComponents(headerDisplay);

    const divider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    this.container.addSeparatorComponents(divider);

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

  toPayload(extraOptions = {}) {
    return {
      components: [this.container],
      flags: MessageFlags.IsComponentsV2,
      ...extraOptions
    };
  }
}

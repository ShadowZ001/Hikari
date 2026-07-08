import { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } from 'discord.js';
import { EMOJIS } from '../emojis.js';

export class IgnoreLayout {

  static help(username) {
    const container = new ContainerBuilder();

    const codeBlock = `\`\`\`\n[ ] = Optional Argument\n<> = Required Argument\nDo NOT type these when using commands!\n\`\`\``;
    const textDisplay1 = new TextDisplayBuilder().setContent(codeBlock);
    container.addTextDisplayComponents(textDisplay1);

    const divider1 = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    container.addSeparatorComponents(divider1);

    const middleText = `**Aliases:** [ignore]\n**Usage:** add/remove/list/reset`;
    const textDisplay2 = new TextDisplayBuilder().setContent(middleText);
    container.addTextDisplayComponents(textDisplay2);

    const divider2 = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    container.addSeparatorComponents(divider2);

    const footerText = `Requested By ${username}`;
    const textDisplay3 = new TextDisplayBuilder().setContent(footerText);
    container.addTextDisplayComponents(textDisplay3);

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };
  }

  static messageCard(emoji, text) {
    const container = new ContainerBuilder();
    const content = `${emoji} ${text}`;
    const textDisplay = new TextDisplayBuilder().setContent(content);
    container.addTextDisplayComponents(textDisplay);

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };
  }

  static listCard(channelIds) {
    const container = new ContainerBuilder();
    const checkEmoji = EMOJIS.checkk || '<:checkk:1498633200346464276>';

    let content = `**${checkEmoji} Ignore channel list :**`;
    if (channelIds.length > 0) {
      const formattedList = channelIds.map((id, index) => `${index + 1}. <#${id}>`).join('\n');
      content += `\n\n${formattedList}`;
    }

    const textDisplay = new TextDisplayBuilder().setContent(content);
    container.addTextDisplayComponents(textDisplay);

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };
  }
}

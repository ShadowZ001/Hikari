import { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } from 'discord.js';

export class ForceFixLayout {

  static successCard(action, username) {
    const container = new ContainerBuilder();

    const headerDisplay = new TextDisplayBuilder().setContent(`### ☑️ Music Bot Fixed`);
    container.addTextDisplayComponents(headerDisplay);

    const divider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    container.addSeparatorComponents(divider);

    const bodyContent =
      `Music bot has been force fixed using \`${action}\` action!\n\n` +
      `-# Action: ${action} | Fixed by ${username}`;
    const bodyDisplay = new TextDisplayBuilder().setContent(bodyContent);
    container.addTextDisplayComponents(bodyDisplay);

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };
  }
}

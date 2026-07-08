import { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } from 'discord.js';

export class JoinLayout {

  static successCard(channelId, username) {
    const container = new ContainerBuilder();

    const headerDisplay = new TextDisplayBuilder().setContent(`### 🔊 Joined Voice Channel`);
    container.addTextDisplayComponents(headerDisplay);

    const divider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    container.addSeparatorComponents(divider);

    const bodyContent =
      `Successfully joined voice channel <#${channelId}>!\n\n` +
      `-# Requested by ${username}`;
    const bodyDisplay = new TextDisplayBuilder().setContent(bodyContent);
    container.addTextDisplayComponents(bodyDisplay);

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };
  }
}

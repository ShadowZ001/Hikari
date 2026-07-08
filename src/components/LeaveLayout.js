import { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } from 'discord.js';

export class LeaveLayout {

  static successCard(channelId, username) {
    const container = new ContainerBuilder();

    const headerDisplay = new TextDisplayBuilder().setContent(`### 🔇 Left Voice Channel`);
    container.addTextDisplayComponents(headerDisplay);

    const divider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    container.addSeparatorComponents(divider);

    const channelMention = channelId ? `<#${channelId}>` : 'the voice channel';
    const bodyContent =
      `Successfully left ${channelMention}.\n\n` +
      `-# Requested by ${username}`;
    const bodyDisplay = new TextDisplayBuilder().setContent(bodyContent);
    container.addTextDisplayComponents(bodyDisplay);

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };
  }
}

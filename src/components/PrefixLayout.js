import { ContainerBuilder, TextDisplayBuilder, MessageFlags } from 'discord.js';

export class PrefixLayout {

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
}

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

export class Status247Layout {

  constructor({ status, username }) {
    this.container = new ContainerBuilder();

    const statusText = `**247 Current Status:** ${status}`;
    const statusDisplay = new TextDisplayBuilder().setContent(statusText);
    this.container.addTextDisplayComponents(statusDisplay);

    const divider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    this.container.addSeparatorComponents(divider);

    const auditText = `Action by: ${username}`;
    const auditDisplay = new TextDisplayBuilder().setContent(auditText);
    this.container.addTextDisplayComponents(auditDisplay);

    const enableButton = new ButtonBuilder()
      .setCustomId('247_enable')
      .setLabel('Enable')
      .setStyle(ButtonStyle.Success)
      .setDisabled(status === 'Enabled');

    const disableButton = new ButtonBuilder()
      .setCustomId('247_disable')
      .setLabel('Disable')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(status === 'Disabled');

    const actionRow = new ActionRowBuilder().addComponents(enableButton, disableButton);
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

import {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags
} from 'discord.js';

export class AvatarLayout {

  constructor({ targetUser, requester, timeString }) {
    this.container = new ContainerBuilder();

    const displayName = targetUser.globalName || targetUser.username;
    const requesterTag = requester.username;
    const avatarUrl = targetUser.displayAvatarURL({ size: 1024, forceStatic: false }).replace('.webp', '.png');

    const headerText =
      `### ${displayName}'s Avatar\n` +
      `Requested by ${requesterTag} - ${timeString}`;
    const headerDisplay = new TextDisplayBuilder().setContent(headerText);
    this.container.addTextDisplayComponents(headerDisplay);

    const divider1 = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    this.container.addSeparatorComponents(divider1);

    const downloadText = `[Download](${avatarUrl})`;
    const downloadDisplay = new TextDisplayBuilder().setContent(downloadText);
    this.container.addTextDisplayComponents(downloadDisplay);

    const divider2 = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    this.container.addSeparatorComponents(divider2);

    const mediaItem = new MediaGalleryItemBuilder().setURL(avatarUrl);
    const mediaGallery = new MediaGalleryBuilder().addItems([mediaItem]);
    this.container.addMediaGalleryComponents(mediaGallery);
  }

  toPayload(extraOptions = {}) {
    return {
      components: [this.container],
      flags: MessageFlags.IsComponentsV2,
      ...extraOptions
    };
  }
}

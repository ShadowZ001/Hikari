import {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags
} from 'discord.js';

export class BannerLayout {

  constructor({ targetUser, requester, timeString, bannerUrl }) {
    this.container = new ContainerBuilder();

    const displayName = targetUser.globalName || targetUser.username;
    const requesterTag = requester.username;

    const headerText =
      `### ${displayName}'s Banner\n` +
      `Requested by ${requesterTag} - ${timeString}`;
    const headerDisplay = new TextDisplayBuilder().setContent(headerText);
    this.container.addTextDisplayComponents(headerDisplay);

    const divider1 = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    this.container.addSeparatorComponents(divider1);

    const downloadText = `[Download](${bannerUrl})`;
    const downloadDisplay = new TextDisplayBuilder().setContent(downloadText);
    this.container.addTextDisplayComponents(downloadDisplay);

    const divider2 = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    this.container.addSeparatorComponents(divider2);

    const mediaItem = new MediaGalleryItemBuilder().setURL(bannerUrl);
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

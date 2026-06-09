import { 
  ContainerBuilder, 
  TextDisplayBuilder, 
  SeparatorBuilder, 
  SeparatorSpacingSize, 
  MediaGalleryBuilder, 
  MediaGalleryItemBuilder, 
  MessageFlags 
} from 'discord.js';

/**
 * Visual layout panel for the avatar command utilizing Discord Components V2 (Cv2).
 */
export class AvatarLayout {
  /**
   * @param {object} options
   * @param {import('discord.js').User} options.targetUser The user whose avatar is being displayed
   * @param {import('discord.js').User} options.requester The user who requested the avatar
   * @param {string} options.timeString Formatted time string (e.g. 5:16 PM)
   */
  constructor({ targetUser, requester, timeString }) {
    this.container = new ContainerBuilder();
    // Do not call setAccentColor here to avoid a hex colored border, keeping it clean

    const displayName = targetUser.globalName || targetUser.username;
    const requesterTag = requester.username;
    const avatarUrl = targetUser.displayAvatarURL({ size: 1024, forceStatic: false }).replace('.webp', '.png');

    // 1. Header (Name + Requester info)
    const headerText = 
      `### ${displayName}'s Avatar\n` +
      `Requested by ${requesterTag} - ${timeString}`;
    const headerDisplay = new TextDisplayBuilder().setContent(headerText);
    this.container.addTextDisplayComponents(headerDisplay);

    // 2. Line Divider
    const divider1 = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    this.container.addSeparatorComponents(divider1);

    // 3. Download link
    const downloadText = `[Download](${avatarUrl})`;
    const downloadDisplay = new TextDisplayBuilder().setContent(downloadText);
    this.container.addTextDisplayComponents(downloadDisplay);

    // 4. Line Divider
    const divider2 = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    this.container.addSeparatorComponents(divider2);

    // 5. Media Gallery displaying the avatar image
    const mediaItem = new MediaGalleryItemBuilder().setURL(avatarUrl);
    const mediaGallery = new MediaGalleryBuilder().addItems([mediaItem]);
    this.container.addMediaGalleryComponents(mediaGallery);
  }

  /**
   * Compiles the layout into a complete Discord message payload object.
   * @param {object} [extraOptions]
   * @returns {object}
   */
  toPayload(extraOptions = {}) {
    return {
      components: [this.container],
      flags: MessageFlags.IsComponentsV2,
      ...extraOptions
    };
  }
}

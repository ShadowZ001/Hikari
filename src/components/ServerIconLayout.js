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
 * Visual layout panel for the server icon command utilizing Discord Components V2 (Cv2).
 */
export class ServerIconLayout {
  /**
   * @param {object} options
   * @param {import('discord.js').Guild} options.guild The guild whose icon is being displayed
   * @param {import('discord.js').User} options.requester The user who requested the icon
   * @param {string} options.timeString Formatted time string (e.g. 5:30 PM)
   * @param {string} options.iconUrl The server icon image URL
   */
  constructor({ guild, requester, timeString, iconUrl }) {
    this.container = new ContainerBuilder();
    // Do not call setAccentColor here to avoid a hex colored border, keeping it clean

    const requesterTag = requester.username;

    // 1. Header (Guild name + Requester info)
    const headerText = 
      `### ${guild.name}'s Icon\n` +
      `Requested by ${requesterTag} - ${timeString}`;
    const headerDisplay = new TextDisplayBuilder().setContent(headerText);
    this.container.addTextDisplayComponents(headerDisplay);

    // 2. Line Divider
    const divider1 = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    this.container.addSeparatorComponents(divider1);

    // 3. Download link
    const downloadText = `[Download](${iconUrl})`;
    const downloadDisplay = new TextDisplayBuilder().setContent(downloadText);
    this.container.addTextDisplayComponents(downloadDisplay);

    // 4. Line Divider
    const divider2 = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    this.container.addSeparatorComponents(divider2);

    // 5. Media Gallery displaying the server icon
    const mediaItem = new MediaGalleryItemBuilder().setURL(iconUrl);
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

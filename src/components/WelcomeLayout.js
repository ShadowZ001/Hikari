import { BaseLayout } from './BaseLayout.js';
import {
  TextDisplayBuilder,
  SeparatorBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  SeparatorSpacingSize
} from 'discord.js';

export class WelcomeLayout extends BaseLayout {

  constructor({ guildName, userName, userAvatarUrl }) {

    super(0x00f5d4);

    if (!guildName) {
      throw new Error('[Hikari Layout Error] Missing required parameter: "guildName" is needed to construct WelcomeLayout.');
    }
    if (!userName) {
      throw new Error('[Hikari Layout Error] Missing required parameter: "userName" is needed to construct WelcomeLayout.');
    }

    const titleText = `# ✨ Welcome to ${guildName}! ✨`;
    const title = new TextDisplayBuilder().setContent(titleText);
    this.registerComponent(title, titleText.length);
    this.container.addTextDisplayComponents(title);

    const divider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    this.registerComponent(divider);
    this.container.addSeparatorComponents(divider);

    const bodyText = `Welcome to the server, **${userName}**! We are glad you joined. Make sure to read our rules and say hi to the community.`;
    const body = new TextDisplayBuilder().setContent(bodyText);
    this.registerComponent(body, bodyText.length);
    this.container.addTextDisplayComponents(body);

    const spacer = new SeparatorBuilder()
      .setDivider(false)
      .setSpacing(SeparatorSpacingSize.Medium);
    this.registerComponent(spacer);
    this.container.addSeparatorComponents(spacer);

    if (userAvatarUrl) {
      try {

        new URL(userAvatarUrl);

        const galleryItem = new MediaGalleryItemBuilder().setURL(userAvatarUrl);
        const gallery = new MediaGalleryBuilder().addItems([galleryItem]);

        this.registerComponent(gallery);
        this.container.addMediaGalleryComponents(gallery);
      } catch (error) {
        console.warn(`[Hikari Layout Warning] Skipping userAvatarUrl because it is not a valid URL: "${userAvatarUrl}"`);
      }
    }
  }
}

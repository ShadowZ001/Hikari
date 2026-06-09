import { BaseLayout } from './BaseLayout.js';
import { 
  TextDisplayBuilder, 
  SeparatorBuilder, 
  MediaGalleryBuilder, 
  MediaGalleryItemBuilder, 
  SeparatorSpacingSize 
} from 'discord.js';

/**
 * A professional welcome greeting card built using Discord Components V2.
 */
export class WelcomeLayout extends BaseLayout {
  /**
   * @param {object} options
   * @param {string} options.guildName Name of the server/guild
   * @param {string} options.userName Name of the user joining
   * @param {string} [options.userAvatarUrl] Optional avatar URL of the user
   */
  constructor({ guildName, userName, userAvatarUrl }) {
    // Initialize container with bright teal theme (0x00f5d4)
    super(0x00f5d4);

    if (!guildName) {
      throw new Error('[Hikari Layout Error] Missing required parameter: "guildName" is needed to construct WelcomeLayout.');
    }
    if (!userName) {
      throw new Error('[Hikari Layout Error] Missing required parameter: "userName" is needed to construct WelcomeLayout.');
    }

    // 1. Header Title
    const titleText = `# ✨ Welcome to ${guildName}! ✨`;
    const title = new TextDisplayBuilder().setContent(titleText);
    this.registerComponent(title, titleText.length);
    this.container.addTextDisplayComponents(title);

    // 2. Small Divider Line
    const divider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    this.registerComponent(divider);
    this.container.addSeparatorComponents(divider);

    // 3. Body Text Description
    const bodyText = `Welcome to the server, **${userName}**! We are glad you joined. Make sure to read our rules and say hi to the community.`;
    const body = new TextDisplayBuilder().setContent(bodyText);
    this.registerComponent(body, bodyText.length);
    this.container.addTextDisplayComponents(body);

    // 4. Visual Spacing (No line)
    const spacer = new SeparatorBuilder()
      .setDivider(false)
      .setSpacing(SeparatorSpacingSize.Medium);
    this.registerComponent(spacer);
    this.container.addSeparatorComponents(spacer);

    // 5. Media gallery for user's profile picture (if provided)
    if (userAvatarUrl) {
      try {
        // Simple validation of URL scheme to prevent Discord API throwing error
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

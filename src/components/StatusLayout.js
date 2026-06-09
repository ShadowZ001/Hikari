import { BaseLayout } from './BaseLayout.js';
import { 
  TextDisplayBuilder, 
  SeparatorBuilder, 
  SectionBuilder, 
  SeparatorSpacingSize 
} from 'discord.js';

/**
 * A professional status dashboard display built using Discord Components V2.
 */
export class StatusLayout extends BaseLayout {
  /**
   * @param {object} options
   * @param {string} options.botName Name of the bot (e.g. Hikari)
   * @param {string} options.uptime Formatted uptime string
   * @param {number} options.ping WebSocket connection latency (ms)
   */
  constructor({ botName, uptime, ping }) {
    // Initialize container with pastel gold theme (0xfee180)
    super(0xfee180);

    if (!botName) {
      throw new Error('[Hikari Layout Error] Missing required parameter: "botName" is needed to construct StatusLayout.');
    }
    if (!uptime) {
      throw new Error('[Hikari Layout Error] Missing required parameter: "uptime" is needed to construct StatusLayout.');
    }
    if (ping === undefined || typeof ping !== 'number') {
      throw new Error('[Hikari Layout Error] Missing or invalid parameter: "ping" must be a number.');
    }

    // 1. Title Header
    const titleText = `## 🛠️ ${botName} System Status`;
    const title = new TextDisplayBuilder().setContent(titleText);
    this.registerComponent(title, titleText.length);
    this.container.addTextDisplayComponents(title);

    // 2. Small Divider
    const divider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    this.registerComponent(divider);
    this.container.addSeparatorComponents(divider);

    // 3. Status Section containing details
    const sectionText = `### Status Summary\n* **Uptime:** \`${uptime}\` \n* **API Latency:** \`${ping}ms\`\n* **Layout Engine:** \`Components V2 (Cv2)\``;
    const sectionTextDisplay = new TextDisplayBuilder().setContent(sectionText);
    
    this.registerComponent(sectionTextDisplay, sectionText.length);
    this.container.addTextDisplayComponents(sectionTextDisplay);

    // 4. Another Divider
    const divider2 = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    this.registerComponent(divider2);
    this.container.addSeparatorComponents(divider2);

    // 5. System Footer Note
    const footerText = `*System running normally. All subsystems online.*`;
    const footer = new TextDisplayBuilder().setContent(footerText);
    this.registerComponent(footer, footerText.length);
    this.container.addTextDisplayComponents(footer);
  }
}

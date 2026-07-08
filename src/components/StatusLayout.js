import { BaseLayout } from './BaseLayout.js';
import {
  TextDisplayBuilder,
  SeparatorBuilder,
  SectionBuilder,
  SeparatorSpacingSize
} from 'discord.js';

export class StatusLayout extends BaseLayout {

  constructor({ botName, uptime, ping }) {

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

    const titleText = `## 🛠️ ${botName} System Status`;
    const title = new TextDisplayBuilder().setContent(titleText);
    this.registerComponent(title, titleText.length);
    this.container.addTextDisplayComponents(title);

    const divider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    this.registerComponent(divider);
    this.container.addSeparatorComponents(divider);

    const sectionText = `### Status Summary\n* **Uptime:** \`${uptime}\` \n* **API Latency:** \`${ping}ms\`\n* **Layout Engine:** \`Components V2 (Cv2)\``;
    const sectionTextDisplay = new TextDisplayBuilder().setContent(sectionText);

    this.registerComponent(sectionTextDisplay, sectionText.length);
    this.container.addTextDisplayComponents(sectionTextDisplay);

    const divider2 = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    this.registerComponent(divider2);
    this.container.addSeparatorComponents(divider2);

    const footerText = `*System running normally. All subsystems online.*`;
    const footer = new TextDisplayBuilder().setContent(footerText);
    this.registerComponent(footer, footerText.length);
    this.container.addTextDisplayComponents(footer);
  }
}

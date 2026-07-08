import {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} from 'discord.js';
import fs from 'fs';
import path from 'path';
import { CONFIG, EMOJIS } from '../emojis.js';

const bannerFileName = '1780819046055.png';
const bannerPath = path.resolve(bannerFileName);
const hasBanner = fs.existsSync(bannerPath);

export class HelpLayout {
  constructor(prefix = CONFIG.prefix, clientId) {
    this.container = new ContainerBuilder();

    if (hasBanner) {
      const mediaItem = new MediaGalleryItemBuilder().setURL('attachment://banner.png');
      const mediaGallery = new MediaGalleryBuilder().addItems([mediaItem]);
      this.container.addMediaGalleryComponents(mediaGallery);
    }

    const infoText =
      `**${EMOJIS.checkk} Hikari Commands**\n` +
      `**${EMOJIS.infoo} Prefix: ${prefix}**\n` +
      `**${EMOJIS.infoo} Total Commands: 58**\n` +
      `**${EMOJIS.infoo} Tip: Use ${prefix}help <command> for details.**`;

    const infoDisplay = new TextDisplayBuilder().setContent(infoText);
    this.container.addTextDisplayComponents(infoDisplay);

    const divider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    this.container.addSeparatorComponents(divider);

    const categoriesText =
      `**Config**\n` +
      `247, ignore, setprefix\n\n` +

      `**Favourite**\n` +
      `like, likeall, playliked, showliked, unlike\n\n` +

      `**Information**\n` +
      `help, invite, ping, stats, support\n\n` +

      `**Music**\n` +
      `autoplay, clear, filter, forcefix, forceskip, forward, grab, history, join, leave, leavecleanup, loop, lyrics, move, nowplaying, pause, play, previous, queue, remove, replay, resume, rewind, search, seek, shuffle, similar, skip, skipto, sleep, speed, stop, volume\n\n` +

      `**Playlist**\n` +
      `pl-add, pl-create, pl-delete, pl-list, pl-play, pl-remove\n\n` +

      `**Utility**\n` +
      `autofix, avatar, banner, membercount, serverbanner, servericon`;

    const categoriesDisplay = new TextDisplayBuilder().setContent(categoriesText);
    this.container.addTextDisplayComponents(categoriesDisplay);

    if (clientId) {

      const divider2 = new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(SeparatorSpacingSize.Small);
      this.container.addSeparatorComponents(divider2);

      const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot+applications.commands`;
      const supportUrl = process.env.SUPPORT_URL || 'https://discord.gg/your-support-server';

      const inviteButton = new ButtonBuilder()
        .setLabel('Invite')
        .setStyle(ButtonStyle.Link)
        .setURL(inviteUrl);

      const supportButton = new ButtonBuilder()
        .setLabel('Support')
        .setStyle(ButtonStyle.Link)
        .setURL(supportUrl);

      const actionRow = new ActionRowBuilder().addComponents(inviteButton, supportButton);
      this.container.addActionRowComponents(actionRow);
    }
  }

  toPayload(extraOptions = {}) {
    const payload = {
      components: [this.container],
      flags: MessageFlags.IsComponentsV2,
      ...extraOptions
    };

    if (hasBanner) {
      payload.files = [new AttachmentBuilder(bannerPath, { name: 'banner.png' })];
    }

    return payload;
  }

  static commandDetails(prefix, command) {
    const container = new ContainerBuilder();

    const infoEmoji = EMOJIS.infoo || '<:infoo:1498633206339997777>';
    const dotEmoji = EMOJIS.whitedot || '<:WhiteDot:1513098965325840394>';

    const aliasesText = command.aliases && command.aliases.length > 0 ? command.aliases.join(', ') : 'None';
    const usageText = command.usage ? `${prefix}${command.name} ${command.usage}` : `${prefix}${command.name}`;

    const textContent =
      `${infoEmoji} **Command:** ${command.name}\n` +
      `${dotEmoji} **Category:** ${command.category || 'Utility'}\n` +
      `${dotEmoji} **Description:** ${command.description || 'No description.'}\n` +
      `${dotEmoji} **Aliases:** ${aliasesText}\n` +
      `${dotEmoji} **Usage:** ${usageText}`;

    const textDisplay = new TextDisplayBuilder().setContent(textContent);
    container.addTextDisplayComponents(textDisplay);

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };
  }
}

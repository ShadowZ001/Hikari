import { ContainerBuilder, TextDisplayBuilder, MessageFlags } from 'discord.js';
import { EMOJIS } from '../emojis.js';

export class VoiceWarningLayout {
  constructor() {
    this.container = new ContainerBuilder();

    const warnEmoji = EMOJIS.warnnn || '<:warnnn:1498633209246646393>';
    const textContent = `**${warnEmoji} You must be in a voice channel to use this command.**`;

    const textDisplay = new TextDisplayBuilder().setContent(textContent);
    this.container.addTextDisplayComponents(textDisplay);
  }

  toPayload(extraOptions = {}) {
    return {
      components: [this.container],
      flags: MessageFlags.IsComponentsV2,
      ...extraOptions
    };
  }
}

export async function checkVoiceChannel(context) {
  let member = context.member;
  const guild = context.guild;

  if (guild && (!member || !member.voice || !member.voice.channelId)) {
    try {
      const userId = context.user ? context.user.id : context.author.id;
      member = await guild.members.fetch({ user: userId, force: true });
    } catch (e) {
      console.error('[Voice Check] Error fetching member voice state:', e);
    }
  }

  if (!member || !member.voice || !member.voice.channelId) {
    const warning = new VoiceWarningLayout();

    const isSlash = typeof context.isChatInputCommand === 'function' && context.isChatInputCommand();

    if (isSlash) {

      await context.reply(warning.toPayload({ ephemeral: true }));
    } else {

      await context.reply(warning.toPayload());
    }

    return false;
  }

  return true;
}

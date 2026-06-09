import { ContainerBuilder, TextDisplayBuilder, MessageFlags } from 'discord.js';
import { EMOJIS } from '../emojis.js';

/**
 * Visual warning layout sent when a user tries to run a voice/RVC command 
 * without being connected to a voice channel.
 * Utilizes Discord Components V2 (Cv2).
 */
export class VoiceWarningLayout {
  constructor() {
    this.container = new ContainerBuilder();
    // Do not call setAccentColor here to avoid a hex colored border, keeping it clean

    const warnEmoji = EMOJIS.warnnn || '<:warnnn:1498633209246646393>';
    const textContent = `**${warnEmoji} You must be in a voice channel to use this command.**`;

    const textDisplay = new TextDisplayBuilder().setContent(textContent);
    this.container.addTextDisplayComponents(textDisplay);
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

/**
 * Utility function to verify if a user is connected to a voice channel.
 * If they are not connected, automatically responds with the custom Cv2 VoiceWarningLayout.
 * @param {import('discord.js').Message | import('discord.js').ChatInputCommandInteraction} context 
 * @returns {Promise<boolean>} Resolves to true if connected to VC, false if warning was sent
 */
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

  // Check if voice channel ID exists on the guild member
  if (!member || !member.voice || !member.voice.channelId) {
    const warning = new VoiceWarningLayout();
    
    // Check if context is a ChatInput interaction (Slash Command)
    const isSlash = typeof context.isChatInputCommand === 'function' && context.isChatInputCommand();
    
    if (isSlash) {
      // Reply ephemerally to slash commands so only the triggering user sees the warning
      await context.reply(warning.toPayload({ ephemeral: true }));
    } else {
      // Reply normally to standard message prefix commands
      await context.reply(warning.toPayload());
    }
    
    return false;
  }
  
  return true;
}

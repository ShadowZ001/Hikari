import { BannerLayout } from '../components/BannerLayout.js';
import { EMOJIS } from '../emojis.js';
import { ContainerBuilder, TextDisplayBuilder, MessageFlags } from 'discord.js';

/**
 * Returns formatted time string matching H:MM AM/PM.
 * @returns {string}
 */
function getFormattedTime() {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Renders a simple warning/error card.
 * @param {string} text 
 * @returns {object}
 */
function warningCard(text) {
  const container = new ContainerBuilder();
  const warnEmoji = EMOJIS.warnnn || '<:warnnn:1498633209246646393>';
  const content = `**${warnEmoji} ${text}**`;
  const textDisplay = new TextDisplayBuilder().setContent(content);
  container.addTextDisplayComponents(textDisplay);

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2
  };
}

export default {
  name: 'banner',
  description: "Displays a user's banner in a beautiful V2 layout.",

  /**
   * Execution handler for prefix commands (e.g. >banner).
   * @param {import('discord.js').Message} message 
   * @param {string[]} args 
   */
  async execute(message, args) {
    try {
      let targetUser = message.mentions.users.first();
      
      if (!targetUser && args[0]) {
        const userId = args[0].replace(/[<@!>]/g, '');
        if (/^\d+$/.test(userId)) {
          targetUser = await message.client.users.fetch(userId).catch(() => null);
        }
      }

      if (!targetUser) {
        targetUser = message.author;
      }

      // Banner requires fetching the user first
      await targetUser.fetch().catch(() => {});
      const bannerUrl = targetUser.bannerURL({ size: 1024, forceStatic: false });

      if (!bannerUrl) {
        const displayName = targetUser.globalName || targetUser.username;
        return message.reply(warningCard(`${displayName} does not have a banner set.`));
      }

      const timeString = getFormattedTime();
      const layout = new BannerLayout({
        targetUser,
        requester: message.author,
        timeString,
        bannerUrl
      });

      await message.reply(layout.toPayload());
      console.log(`[Hikari] Banner sent for ${targetUser.tag} in prefix mode`);
    } catch (error) {
      console.error('[Hikari] Error executing prefix banner command:', error);
    }
  },

  /**
   * Execution handler for slash commands (e.g. /banner).
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   */
  async executeSlash(interaction) {
    try {
      const targetUser = interaction.options.getUser('user') || interaction.user;

      await targetUser.fetch().catch(() => {});
      const bannerUrl = targetUser.bannerURL({ size: 1024, forceStatic: false });

      if (!bannerUrl) {
        const displayName = targetUser.globalName || targetUser.username;
        return interaction.reply(warningCard(`${displayName} does not have a banner set.`));
      }

      const timeString = getFormattedTime();
      const layout = new BannerLayout({
        targetUser,
        requester: interaction.user,
        timeString,
        bannerUrl
      });

      await interaction.reply(layout.toPayload());
      console.log(`[Hikari] Banner sent for ${targetUser.tag} in slash mode`);
    } catch (error) {
      console.error('[Hikari] Error executing slash banner command:', error);
    }
  }
};

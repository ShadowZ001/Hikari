import { ServerBannerLayout } from '../components/ServerBannerLayout.js';
import { EMOJIS } from '../emojis.js';
import { ContainerBuilder, TextDisplayBuilder, MessageFlags } from 'discord.js';

function getFormattedTime() {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

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
  name: 'serverbanner',
  description: "Displays the server's banner in a beautiful V2 layout.",

  async execute(message, args) {
    try {
      const guild = message.guild;
      if (!guild) return;

      const bannerUrl = guild.bannerURL({ size: 1024 });

      if (!bannerUrl) {
        return message.reply(warningCard(`${guild.name} does not have a server banner set.`));
      }

      const timeString = getFormattedTime();
      const layout = new ServerBannerLayout({
        guild,
        requester: message.author,
        timeString,
        bannerUrl
      });

      await message.reply(layout.toPayload());
      console.log(`[Hikari] Server banner sent for ${guild.name} in prefix mode`);
    } catch (error) {
      console.error('[Hikari] Error executing prefix serverbanner command:', error);
    }
  },

  async executeSlash(interaction) {
    try {
      const guild = interaction.guild;
      if (!guild) return;

      const bannerUrl = guild.bannerURL({ size: 1024 });

      if (!bannerUrl) {
        return interaction.reply(warningCard(`${guild.name} does not have a server banner set.`));
      }

      const timeString = getFormattedTime();
      const layout = new ServerBannerLayout({
        guild,
        requester: interaction.user,
        timeString,
        bannerUrl
      });

      await interaction.reply(layout.toPayload());
      console.log(`[Hikari] Server banner sent for ${guild.name} in slash mode`);
    } catch (error) {
      console.error('[Hikari] Error executing slash serverbanner command:', error);
    }
  }
};

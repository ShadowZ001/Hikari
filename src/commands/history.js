import { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } from 'discord.js';
import { PrefixLayout } from '../components/PrefixLayout.js';
import { EMOJIS } from '../emojis.js';

export default {
  name: 'history',
  aliases: ['played', 'recent'],
  description: 'Show recently played songs.',

  async executeSlash(interaction) {
    try {
      const client = interaction.client;
      const player = client.activePlayers?.get(interaction.guildId);
      const history = player?.history || [];

      if (history.length === 0) {
        const card = PrefixLayout.messageCard(EMOJIS.infoo || 'ℹ️', '**No history of played tracks found.**');
        return interaction.reply({ ...card, ephemeral: false });
      }

      const container = new ContainerBuilder();
      const headerDisplay = new TextDisplayBuilder().setContent(`### 📜 Recently Played Songs`);
      const divider = new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small);

      // Display latest played first
      const reversed = [...history].reverse().slice(0, 10);
      let content = '';
      reversed.forEach((track, i) => {
        const artist = track.artist || track.author || 'Unknown Artist';
        const duration = track.duration || '3:44';
        content += `\`${i + 1}.\` **[${track.title}](${track.uri})** - \`${artist}\` • \`${duration}\`\n`;
      });

      const bodyDisplay = new TextDisplayBuilder().setContent(content.trim());
      container.addTextDisplayComponents(headerDisplay)
        .addSeparatorComponents(divider)
        .addTextDisplayComponents(bodyDisplay);

      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while loading playback history.**');
      return interaction.reply({ ...card, ephemeral: true });
    }
  },

  async execute(message, args) {
    try {
      const client = message.client;
      const player = client.activePlayers?.get(message.guildId);
      const history = player?.history || [];

      if (history.length === 0) {
        const card = PrefixLayout.messageCard(EMOJIS.infoo || 'ℹ️', '**No history of played tracks found.**');
        return message.reply(card);
      }

      const container = new ContainerBuilder();
      const headerDisplay = new TextDisplayBuilder().setContent(`### 📜 Recently Played Songs`);
      const divider = new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small);

      // Display latest played first
      const reversed = [...history].reverse().slice(0, 10);
      let content = '';
      reversed.forEach((track, i) => {
        const artist = track.artist || track.author || 'Unknown Artist';
        const duration = track.duration || '3:44';
        content += `\`${i + 1}.\` **[${track.title}](${track.uri})** - \`${artist}\` • \`${duration}\`\n`;
      });

      const bodyDisplay = new TextDisplayBuilder().setContent(content.trim());
      container.addTextDisplayComponents(headerDisplay)
        .addSeparatorComponents(divider)
        .addTextDisplayComponents(bodyDisplay);

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while loading playback history.**');
      return message.reply(card);
    }
  }
};

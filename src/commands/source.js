import { StringSelectMenuBuilder, ActionRowBuilder, ComponentType, ContainerBuilder, TextDisplayBuilder, MessageFlags } from 'discord.js';
import UserPreferences from '../models/UserPreferences.js';
import { EMOJIS } from '../emojis.js';
import { PrefixLayout } from '../components/PrefixLayout.js';
import { getLavalinkSupportedSources } from '../utils/lavalink.js';

const ALL_SOURCES = [
  { label: 'YouTube Music', value: 'ytmsearch', manager: 'youtube', emoji: '🎵' },
  { label: 'YouTube', value: 'ytsearch', manager: 'youtube', emoji: '🎥' },
  { label: 'Spotify', value: 'spsearch', manager: 'spotify', emoji: '🟢' },
  { label: 'SoundCloud', value: 'scsearch', manager: 'soundcloud', emoji: '🟠' },
  { label: 'Deezer', value: 'dzsearch', manager: 'deezer', emoji: '🟣' },
  { label: 'JioSaavn', value: 'jssearch', manager: 'jiosaavn', emoji: '🔵' }
];

export default {
  name: 'source',
  description: 'Set your preferred music search source.',

  async autocomplete(interaction) {
    try {
      const supportedManagers = await getLavalinkSupportedSources(interaction.client);
      
      let filtered = ALL_SOURCES;
      if (supportedManagers.length > 0) {
        filtered = ALL_SOURCES.filter(src => supportedManagers.includes(src.manager));
      }

      const focusedValue = interaction.options.getFocused().toLowerCase();
      const choices = filtered.filter(choice => choice.label.toLowerCase().includes(focusedValue));

      await interaction.respond(
        choices.slice(0, 25).map(choice => ({ name: choice.label, value: choice.value }))
      );
    } catch (e) {
      console.error('[Hikari Source Autocomplete] Error:', e);
      await interaction.respond([]).catch(() => {});
    }
  },

  async executeSlash(interaction) {
    try {
      const selectedSource = interaction.options.getString('source');
      const checkEmoji = EMOJIS.checkk || '✅';
      const warnEmoji = EMOJIS.warnnn || '⚠️';

      // Validate that the selected source is supported dynamically
      const supportedManagers = await getLavalinkSupportedSources(interaction.client);
      let allowedSources = ALL_SOURCES;
      if (supportedManagers.length > 0) {
        allowedSources = ALL_SOURCES.filter(src => supportedManagers.includes(src.manager));
      }

      const isAllowed = allowedSources.some(opt => opt.value === selectedSource);
      if (!isAllowed) {
        const card = PrefixLayout.messageCard(warnEmoji, `**The music source \`${selectedSource}\` is not supported by the connected Lavalink nodes.**`);
        return interaction.reply({ ...card, ephemeral: true });
      }

      const selectedSourceName = allowedSources.find(opt => opt.value === selectedSource)?.label || selectedSource;

      await UserPreferences.findOneAndUpdate(
        { userId: interaction.user.id },
        {
          userId: interaction.user.id,
          musicSource: selectedSource,
          updatedAt: Date.now()
        },
        { upsert: true, new: true }
      );

      const card = PrefixLayout.messageCard(checkEmoji, `**Your preferred music source is now \`${selectedSourceName}\`**`);
      return interaction.reply({ ...card, ephemeral: false });
    } catch (error) {
      console.error('Error in source slash command:', error);
      const card = PrefixLayout.messageCard('❌', `**An error occurred while saving your preferred music source.**`);
      return interaction.reply({ ...card, ephemeral: true });
    }
  },

  async execute(message, args) {
    try {
      const checkEmoji = EMOJIS.checkk || '✅';
      const warnEmoji = EMOJIS.warnnn || '⚠️';
      
      const supportedManagers = await getLavalinkSupportedSources(message.client);
      let allowedSources = ALL_SOURCES;
      if (supportedManagers.length > 0) {
        allowedSources = ALL_SOURCES.filter(src => supportedManagers.includes(src.manager));
      }

      const selectedSource = args[0]?.toLowerCase().trim();
      if (selectedSource) {
        const isAllowed = allowedSources.some(opt => opt.value === selectedSource);
        if (!isAllowed) {
          const card = PrefixLayout.messageCard(warnEmoji, `**The music source \`${selectedSource}\` is not supported by the connected Lavalink nodes.**`);
          return message.reply(card);
        }

        const selectedSourceName = allowedSources.find(opt => opt.value === selectedSource)?.label;

        await UserPreferences.findOneAndUpdate(
          { userId: message.author.id },
          {
            userId: message.author.id,
            musicSource: selectedSource,
            updatedAt: Date.now()
          },
          { upsert: true, new: true }
        );

        const card = PrefixLayout.messageCard(checkEmoji, `**Your preferred music source is now \`${selectedSourceName}\`**`);
        return message.reply(card);
      }

      // Render options menu
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('source_select')
        .setPlaceholder('Choose your preferred search source')
        .addOptions(allowedSources);

      const row = new ActionRowBuilder().addComponents(selectMenu);
      const response = await message.reply({ components: [row] });

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 60000,
        filter: (interaction) => interaction.user.id === message.author.id
      });

      collector.on('collect', async (interaction) => {
        try {
          const selected = interaction.values[0];
          const selectedSourceName = allowedSources.find(opt => opt.value === selected)?.label;

          await UserPreferences.findOneAndUpdate(
            { userId: message.author.id },
            {
              userId: message.author.id,
              musicSource: selected,
              updatedAt: Date.now()
            },
            { upsert: true, new: true }
          );

          const card = PrefixLayout.messageCard(checkEmoji, `**Your preferred music source is now \`${selectedSourceName}\`**`);
          await interaction.update({ ...card, components: [] });
        } catch (error) {
          console.error(error);
          await interaction.reply({ content: 'An error occurred.', ephemeral: true });
        }
      });

      collector.on('end', (collected, reason) => {
        if (reason === 'time' && collected.size === 0) {
          response.delete().catch(() => {});
        }
      });

    } catch (error) {
      console.error('Error in source command:', error);
      const card = PrefixLayout.messageCard('❌', `**An error occurred while running the source config command.**`);
      return message.reply(card);
    }
  }
};

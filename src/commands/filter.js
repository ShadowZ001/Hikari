import { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, StringSelectMenuBuilder, ComponentType, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { PrefixLayout } from '../components/PrefixLayout.js';
import { EMOJIS } from '../emojis.js';
import { checkVoiceChannel } from '../components/VoiceWarningLayout.js';

export default {
  name: 'filter',
  aliases: ['eq', 'filters'],
  description: "Sets the player's audio filter.",

  async executeSlash(interaction) {
    const interactionWrapper = {
      guild: interaction.guild,
      channel: interaction.channel,
      author: interaction.user,
      member: interaction.member,
      createdTimestamp: interaction.createdTimestamp,
      reply: async (options) => {
        if (interaction.deferred) {
          return await interaction.editReply(options);
        } else if (interaction.replied) {
          return await interaction.followUp(options);
        } else {
          return await interaction.reply(options);
        }
      },
    };
    return this.execute(interactionWrapper, []);
  },

  async execute(message, args) {
    try {
      const client = message.guild.client;
      const player = client.activePlayers?.get(message.guild.id);

      if (!player || !player.currentTrack) {
        const card = PrefixLayout.messageCard('❌', '**There is no song currently playing.**');
        return message.reply(card);
      }

      const connected = await checkVoiceChannel(message);
      if (!connected) return;

      const filterOptions = [
        { label: "Reset Filters", value: "clear", emoji: '🔄' },
        { label: "8D Audio", value: "8d_but", emoji: '🎧' },
        { label: "BassBoost", value: "bass_but", emoji: '🔊' },
        { label: "Deep Bass", value: "deepbass_but", emoji: '🥁' },
        { label: "Treble Boost", value: "treble_but", emoji: '🎼' },
        { label: "NightCore", value: "night_but", emoji: '⚡' },
        { label: "Daycore", value: "daycore_but", emoji: '🕰️' },
        { label: "Slowed + Reverb", value: "slowed_but", emoji: '🌌' },
        { label: "Vaporwave", value: "vapo_but", emoji: '🌸' },
        { label: "Chipmunk", value: "chipmunk_but", emoji: '🐿️' },
        { label: "Karaoke", value: "karaoke_but", emoji: '🎤' },
        { label: "Soft", value: "soft_but", emoji: '☁️' },
        { label: "China", value: "china_but", emoji: '🏮' },
        { label: "Vibrato", value: "vibrato_but", emoji: '〰️' },
      ];

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("filter_select")
          .setPlaceholder(`Select a filter to apply`)
          .addOptions(filterOptions)
      );

      const currentFilter = player.currentFilter || "None";
      
      const container = new ContainerBuilder();
      const headerDisplay = new TextDisplayBuilder().setContent(`### 🎛️ Audio Filters`);
      const divider = new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small);
      const statusDisplay = new TextDisplayBuilder().setContent(`**Current Filter:** \`${currentFilter}\``);

      container.addTextDisplayComponents(headerDisplay)
        .addSeparatorComponents(divider)
        .addTextDisplayComponents(statusDisplay)
        .addActionRowComponents(row);

      const msg = await message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });

      const collector = msg.createMessageComponentCollector({
        filter: (i) => {
          if (message.author.id === i.user.id) return true;
          i.reply({ content: '❌ You cannot control this session.', ephemeral: true });
          return false;
        },
        time: 60000,
        idle: 30000
      });

      collector.on("collect", async (i) => {
        if (!i.isStringSelectMenu()) return;
        await i.deferUpdate();

        const value = i.values[0];
        let filterName = filterOptions.find(o => o.value === value)?.label || "Unknown Filter";

        if (player.shoukakuPlayer) {
          switch (value) {
            case "clear":
              await player.shoukakuPlayer.clearFilters();
              filterName = "None";
              break;
            case "8d_but":
              await player.shoukakuPlayer.setFilters({ rotation: { rotationHz: 0.2 } });
              break;
            case "bass_but":
              await player.shoukakuPlayer.setFilters({ equalizer: [{ band: 0, gain: 0.3 }, { band: 1, gain: 0.25 }, { band: 2, gain: 0.2 }, { band: 3, gain: 0.1 }] });
              break;
            case "deepbass_but":
              await player.shoukakuPlayer.setFilters({ equalizer: [{ band: 0, gain: 0.6 }, { band: 1, gain: 0.5 }, { band: 2, gain: 0.4 }, { band: 3, gain: 0.3 }, { band: 4, gain: 0.2 }] });
              break;
            case "treble_but":
              await player.shoukakuPlayer.setFilters({ equalizer: [{ band: 10, gain: 0.3 }, { band: 11, gain: 0.35 }, { band: 12, gain: 0.4 }, { band: 13, gain: 0.45 }] });
              break;
            case "night_but":
              await player.shoukakuPlayer.setFilters({ timescale: { speed: 1.15, pitch: 1.2, rate: 1.0 } });
              break;
            case "daycore_but":
              await player.shoukakuPlayer.setFilters({ timescale: { speed: 0.85, pitch: 0.85, rate: 1.0 } });
              break;
            case "slowed_but":
              await player.shoukakuPlayer.setFilters({ timescale: { speed: 0.88, pitch: 0.9 }, reverb: { roomSize: 0.7, damping: 0.5, wet: 0.33, dry: 0.4 } });
              break;
            case "vapo_but":
              await player.shoukakuPlayer.setFilters({ timescale: { speed: 0.8, pitch: 0.8 }, tremolo: { depth: 0.3, frequency: 10 } });
              break;
            case "chipmunk_but":
              await player.shoukakuPlayer.setFilters({ timescale: { speed: 1.3, pitch: 1.3, rate: 1.0 } });
              break;
            case "karaoke_but":
              await player.shoukakuPlayer.setFilters({ karaoke: { level: 1.0, monoLevel: 1.0, filterBand: 220.0, filterWidth: 100.0 } });
              break;
            case "soft_but":
              await player.shoukakuPlayer.setFilters({ lowPass: { smoothing: 20.0 } });
              break;
            case "china_but":
              await player.shoukakuPlayer.setFilters({ timescale: { speed: 0.75, pitch: 1.25, rate: 1.25 } });
              break;
            case "vibrato_but":
              await player.shoukakuPlayer.setFilters({ vibrato: { frequency: 4.0, depth: 0.75 } });
              break;
          }
        }

        player.currentFilter = filterName;

        const updatedContainer = new ContainerBuilder();
        const updatedStatus = new TextDisplayBuilder().setContent(`**Current Filter:** \`${filterName}\``);
        updatedContainer.addTextDisplayComponents(headerDisplay)
          .addSeparatorComponents(divider)
          .addTextDisplayComponents(updatedStatus)
          .addActionRowComponents(row);

        await msg.edit({
          components: [updatedContainer],
          flags: MessageFlags.IsComponentsV2
        });
      });

      collector.on("end", async (collected, reason) => {
        if (reason !== 'manual') {
          await msg.delete().catch(() => {});
        }
      });

    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while loading filters.**');
      return message.reply(card);
    }
  }
};

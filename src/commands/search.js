import { 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  ContainerBuilder, 
  TextDisplayBuilder, 
  SeparatorBuilder, 
  MessageFlags,
  ButtonStyle,
  ComponentType
} from 'discord.js';
import UserPreferences from '../models/UserPreferences.js';
import { resolveTracks } from '../utils/lavalink.js';
import { playTrack } from '../utils/playerManager.js';
import { PrefixLayout } from '../components/PrefixLayout.js';
import { checkVoiceChannel } from '../components/VoiceWarningLayout.js';
import { EMOJIS } from '../emojis.js';

export default {
  name: 'search',
  description: 'Search for a song and select from results.',
  options: [
    {
      name: 'query',
      description: 'The search query.',
      type: 3, // STRING
      required: true
    }
  ],

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
      editReply: async (options) => {
        return await interaction.editReply(options);
      },
      deferred: false
    };

    const query = interaction.options.getString('query');
    await interaction.deferReply();
    interactionWrapper.deferred = true;

    return this.execute(interactionWrapper, [query]);
  },

  async execute(message, args) {
    try {
      const client = message.guild.client;
      const query = args.join(' ').trim();

      if (!query) {
        const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', '**Please provide a search query.**');
        return message.reply(card);
      }

      const connected = await checkVoiceChannel(message);
      if (!connected) return;

      const userPref = await UserPreferences.findOne({ userId: message.author.id });
      const engine = userPref?.musicSource || 'ytmsearch';

      const tracks = await resolveTracks(query, engine);
      if (tracks.length === 0) {
        const card = PrefixLayout.messageCard('❌', `**No results found for "${query}"**`);
        if (message.deferred) {
          return message.editReply(card);
        }
        return message.reply(card);
      }

      // Slice to top 10 results
      const results = tracks.slice(0, 10);

      const header = new TextDisplayBuilder().setContent(`### 🔍 Search Results for "${query}"`);
      const separator = new SeparatorBuilder();

      const resultText = results.map((track, idx) => {
        const duration = track.duration || 'Live';
        return `**\`${idx + 1}\`** | **${track.title.substring(0, 50)}** by \`${track.artist.substring(0, 30)}\` - \`${duration}\``;
      }).join('\n');

      const resultsDisplay = new TextDisplayBuilder().setContent(resultText);

      const options = results.map((track, idx) => ({
        label: `${idx + 1}. ${track.title.substring(0, 80)}`,
        value: idx.toString(),
        description: `${track.artist.substring(0, 80)} | ${track.duration || 'Live'}`
      }));

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('search_select')
        .setPlaceholder('Select tracks to add to the queue')
        .setMinValues(1)
        .setMaxValues(Math.min(5, results.length))
        .addOptions(options);

      const row = new ActionRowBuilder().addComponents(selectMenu);

      const container = new ContainerBuilder()
        .addTextDisplayComponents(header)
        .addSeparatorComponents(separator)
        .addTextDisplayComponents(resultsDisplay)
        .addActionRowComponents(row);

      const payload = {
        components: [container],
        flags: MessageFlags.IsComponentsV2
      };

      const msg = message.deferred 
        ? await message.editReply(payload)
        : await message.reply(payload);

      const collector = msg.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        filter: (i) => {
          if (i.user.id === message.author.id) return true;
          i.reply({ content: '❌ You cannot control this session.', ephemeral: true });
          return false;
        },
        time: 60000,
        idle: 30000
      });

      collector.on('collect', async (i) => {
        await i.deferUpdate();

        let player = client.activePlayers?.get(message.guild.id);
        const isNewPlayer = !player;

        if (isNewPlayer) {
          const voiceChannel = message.member.voice.channel;
          const connectedNodes = Array.from(client.shoukaku.nodes.values()).filter(n => n.state === 1);
          if (connectedNodes.length === 0) {
            const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', '**No available Lavalink nodes are connected right now.**');
            return i.followUp({ ...card, ephemeral: true });
          }

          connectedNodes.sort((a, b) => {
            const statsA = a.stats || { cpu: { systemLoad: 0.5 }, players: 0 };
            const statsB = b.stats || { cpu: { systemLoad: 0.5 }, players: 0 };
            return ((statsA.cpu.systemLoad * 100) + statsA.players + (a.ping / 10)) - 
                   ((statsB.cpu.systemLoad * 100) + statsB.players + (b.ping / 10));
          });
          const bestNode = connectedNodes[0];

          const shoukakuPlayer = await client.shoukaku.joinVoiceChannel({
            guildId: message.guild.id,
            channelId: voiceChannel.id,
            shardId: message.guild?.shardId || 0,
            deaf: true,
            nodeName: bestNode.name
          });

          player = {
            guildId: message.guild.id,
            voiceChannelId: voiceChannel.id,
            textChannelId: message.channel.id,
            playlist: { name: 'Queue', tracks: [] },
            currentIndex: 0,
            currentTrack: null,
            isPaused: false,
            volume: 100,
            autoplay: false,
            liked: false,
            loopMode: 'off',
            playPrevious: false,
            message: null,
            requester: message.author,
            timeoutId: null,
            shoukakuPlayer: shoukakuPlayer
          };
          client.activePlayers = client.activePlayers || new Map();
          client.activePlayers.set(message.guild.id, player);
        } else {
          if (player.voiceChannelId !== message.member.voice.channelId) {
            const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', '**You must be in the same voice channel as the bot.**');
            return i.followUp({ ...card, ephemeral: true });
          }
        }

        const addedTracks = [];
        for (const val of i.values) {
          const trackIdx = parseInt(val);
          const track = results[trackIdx];
          if (track) {
            track.requesterTag = message.author.tag;
            player.playlist.tracks.push(track);
            addedTracks.push(track);
          }
        }

        const checkEmoji = EMOJIS.checkk || '✅';
        const successHeader = new TextDisplayBuilder().setContent(`**${checkEmoji} Added to Queue**`);
        const successSeparator = new SeparatorBuilder();
        const successText = addedTracks.map((t, idx) => `**\`${idx + 1}\`** | **${t.title}**`).join('\n');
        const successDisplay = new TextDisplayBuilder().setContent(successText);

        const successContainer = new ContainerBuilder()
          .addTextDisplayComponents(successHeader)
          .addSeparatorComponents(successSeparator)
          .addTextDisplayComponents(successDisplay);

        await msg.edit({
          components: [successContainer],
          flags: MessageFlags.IsComponentsV2
        });

        if (isNewPlayer || !player.currentTrack) {
          player.currentTrack = player.playlist.tracks[player.currentIndex];
          await playTrack(client, message.guild.id, message.channel);
        }

        collector.stop();
      });

      collector.on('end', async (collected, reason) => {
        if (reason === 'time' || reason === 'idle') {
          const timeoutHeader = new TextDisplayBuilder().setContent(`**❌ Search Session Timed Out**`);
          const timeoutContainer = new ContainerBuilder().addTextDisplayComponents(timeoutHeader);
          await msg.edit({
            components: [timeoutContainer],
            flags: MessageFlags.IsComponentsV2
          }).catch(() => {});
        }
      });

    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while searching.**');
      if (message.deferred) {
        return message.editReply(card);
      }
      return message.reply(card);
    }
  }
};

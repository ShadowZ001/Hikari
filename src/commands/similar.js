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
import { resolveTracks } from '../utils/lavalink.js';
import { playTrack } from '../utils/playerManager.js';
import { PrefixLayout } from '../components/PrefixLayout.js';
import { checkVoiceChannel } from '../components/VoiceWarningLayout.js';
import { EMOJIS } from '../emojis.js';

export default {
  name: 'similar',
  aliases: ['sim', 'related'],
  description: 'Find similar tracks to the currently playing song.',

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

    await interaction.deferReply();
    interactionWrapper.deferred = true;

    return this.execute(interactionWrapper, []);
  },

  async execute(message, args) {
    try {
      const client = message.guild.client;
      const player = client.activePlayers?.get(message.guild.id);

      if (!player || !player.currentTrack) {
        const card = PrefixLayout.messageCard('❌', '**No active music player found in this server.**');
        if (message.deferred) {
          return message.editReply(card);
        }
        return message.reply(card);
      }

      const connected = await checkVoiceChannel(message);
      if (!connected) return;

      const currentTrack = player.currentTrack;
      const searchQuery = `${currentTrack.title} ${currentTrack.artist}`;

      const loadingHeader = new TextDisplayBuilder().setContent(`**${EMOJIS.load || '⏳'} Searching for similar songs...**`);
      const loadingContainer = new ContainerBuilder().addTextDisplayComponents(loadingHeader);

      const statusMsg = message.deferred
        ? await message.editReply({ components: [loadingContainer], flags: MessageFlags.IsComponentsV2 })
        : await message.reply({ components: [loadingContainer], flags: MessageFlags.IsComponentsV2 });

      // Run searches in parallel
      const results = {
        ytmusic: [],
        youtube: [],
        spotify: []
      };

      await Promise.allSettled([
        resolveTracks(searchQuery, 'ytmsearch').then(tracks => results.ytmusic = tracks),
        resolveTracks(searchQuery, 'ytsearch').then(tracks => results.youtube = tracks),
        resolveTracks(searchQuery, 'spsearch').then(tracks => results.spotify = tracks)
      ]);

      const sourceOptions = [
        {
          label: 'YouTube Music',
          value: 'ytmusic',
          description: `${results.ytmusic.length} tracks found`
        },
        {
          label: 'YouTube',
          value: 'youtube',
          description: `${results.youtube.length} tracks found`
        },
        {
          label: 'Spotify',
          value: 'spotify',
          description: `${results.spotify.length} tracks found`
        }
      ].filter(opt => results[opt.value].length > 0);

      if (sourceOptions.length === 0) {
        const card = PrefixLayout.messageCard('❌', `**No similar songs found for "${currentTrack.title}".**`);
        return statusMsg.edit(card);
      }

      let currentSource = sourceOptions[0].value;

      const createSongOptions = (source) => {
        return results[source].slice(0, 10).map((track, idx) => ({
          label: `${idx + 1}. ${track.title.substring(0, 80)}`,
          value: `${source}-${idx}`,
          description: `${track.artist.substring(0, 80)} | ${track.duration || 'Live'}`
        }));
      };

      const sourceMenu = new StringSelectMenuBuilder()
        .setCustomId('similar_source')
        .setPlaceholder('Select a music source')
        .addOptions(sourceOptions);

      const songMenu = new StringSelectMenuBuilder()
        .setCustomId('similar_songs')
        .setPlaceholder('Select tracks to add to queue')
        .setMinValues(1)
        .setMaxValues(Math.min(5, results[currentSource].length))
        .addOptions(createSongOptions(currentSource));

      const header = new TextDisplayBuilder().setContent(`### 📻 Similar Tracks Results`);
      const separator = new SeparatorBuilder();
      const currentTrackInfo = new TextDisplayBuilder().setContent(
        `**Current Track:** \`${currentTrack.title}\`\n` +
        `**Artist:** \`${currentTrack.artist}\`\n` +
        `**Viewing Source:** \`${currentSource === 'ytmusic' ? 'YouTube Music' : currentSource === 'youtube' ? 'YouTube' : 'Spotify'}\``
      );

      const sourceRow = new ActionRowBuilder().addComponents(sourceMenu);
      const songRow = new ActionRowBuilder().addComponents(songMenu);

      const container = new ContainerBuilder()
        .addTextDisplayComponents(header)
        .addSeparatorComponents(separator)
        .addTextDisplayComponents(currentTrackInfo)
        .addActionRowComponents(sourceRow)
        .addActionRowComponents(songRow);

      await statusMsg.edit({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });

      const collector = statusMsg.createMessageComponentCollector({
        filter: (i) => i.user.id === message.author.id,
        time: 120000,
        idle: 60000
      });

      collector.on('collect', async (i) => {
        if (i.customId === 'similar_source') {
          await i.deferUpdate();
          currentSource = i.values[0];

          const updatedSongMenu = new StringSelectMenuBuilder()
            .setCustomId('similar_songs')
            .setPlaceholder('Select tracks to add to queue')
            .setMinValues(1)
            .setMaxValues(Math.min(5, results[currentSource].length))
            .addOptions(createSongOptions(currentSource));

          const updatedTrackInfo = new TextDisplayBuilder().setContent(
            `**Current Track:** \`${currentTrack.title}\`\n` +
            `**Artist:** \`${currentTrack.artist}\`\n` +
            `**Viewing Source:** \`${currentSource === 'ytmusic' ? 'YouTube Music' : currentSource === 'youtube' ? 'YouTube' : 'Spotify'}\``
          );

          const updatedSongRow = new ActionRowBuilder().addComponents(updatedSongMenu);

          const updatedContainer = new ContainerBuilder()
            .addTextDisplayComponents(header)
            .addSeparatorComponents(separator)
            .addTextDisplayComponents(updatedTrackInfo)
            .addActionRowComponents(sourceRow)
            .addActionRowComponents(updatedSongRow);

          await statusMsg.edit({
            components: [updatedContainer],
            flags: MessageFlags.IsComponentsV2
          });
        } 
        
        else if (i.customId === 'similar_songs') {
          await i.deferUpdate();

          const addedTracks = [];
          for (const val of i.values) {
            const [source, idxStr] = val.split('-');
            const idx = parseInt(idxStr);
            const track = results[source][idx];
            if (track) {
              track.requesterTag = message.author.tag;
              player.playlist.tracks.push(track);
              addedTracks.push(track);
            }
          }

          const checkEmoji = EMOJIS.checkk || '✅';
          const successHeader = new TextDisplayBuilder().setContent(`**${checkEmoji} Similar Tracks Added to Queue**`);
          const successSeparator = new SeparatorBuilder();
          const successDisplay = new TextDisplayBuilder().setContent(
            addedTracks.map((t, idx) => `**\`${idx + 1}\`** | **${t.title}**`).join('\n')
          );

          const successContainer = new ContainerBuilder()
            .addTextDisplayComponents(successHeader)
            .addSeparatorComponents(successSeparator)
            .addTextDisplayComponents(successDisplay);

          await statusMsg.edit({
            components: [successContainer],
            flags: MessageFlags.IsComponentsV2
          });

          if (!player.currentTrack) {
            player.currentTrack = player.playlist.tracks[player.currentIndex];
            await playTrack(client, message.guild.id, message.channel);
          }

          collector.stop();
        }
      });

      collector.on('end', async (collected, reason) => {
        if (reason === 'time' || reason === 'idle') {
          const timeoutDisplay = new TextDisplayBuilder().setContent(`**❌ Session Timed Out**`);
          const timeoutContainer = new ContainerBuilder().addTextDisplayComponents(timeoutDisplay);
          await statusMsg.edit({
            components: [timeoutContainer],
            flags: MessageFlags.IsComponentsV2
          }).catch(() => {});
        }
      });

    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while finding similar songs.**');
      if (message.deferred) {
        return message.editReply(card);
      }
      return message.reply(card);
    }
  }
};

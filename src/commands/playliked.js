import Liked from '../models/Liked.js';
import { PrefixLayout } from '../components/PrefixLayout.js';
import { checkVoiceChannel } from '../components/VoiceWarningLayout.js';
import { playTrack } from '../utils/playerManager.js';
import { EMOJIS } from '../emojis.js';

export default {
  name: 'playliked',
  aliases: ['pfav', 'playfav', 'playfavorites', 'playlike'],
  description: 'Queue and play your favorite songs.',

  async executeSlash(interaction) {
    try {
      const client = interaction.client;
      const userId = interaction.user.id;

      const connected = await checkVoiceChannel(interaction);
      if (!connected) return;

      const userLiked = await Liked.findOne({ userId });
      if (!userLiked || !userLiked.songs.length) {
        const card = PrefixLayout.messageCard(EMOJIS.infoo || 'ℹ️', "**You don't have any favorite songs to play!**");
        return interaction.reply({ ...card, ephemeral: false });
      }

      await interaction.deferReply();

      let player = client.activePlayers?.get(interaction.guildId);
      const isNewPlayer = !player;

      if (isNewPlayer) {
        const voiceChannel = interaction.member.voice.channel;
        const connectedNodes = Array.from(client.shoukaku.nodes.values()).filter(n => n.state === 1);
        if (connectedNodes.length === 0) {
          const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', '**No available Lavalink nodes are connected right now.**');
          return interaction.editReply(card);
        }

        connectedNodes.sort((a, b) => {
          const statsA = a.stats || { cpu: { systemLoad: 0.5 }, players: 0 };
          const statsB = b.stats || { cpu: { systemLoad: 0.5 }, players: 0 };
          return ((statsA.cpu.systemLoad * 100) + statsA.players + (a.ping / 10)) - 
                 ((statsB.cpu.systemLoad * 100) + statsB.players + (b.ping / 10));
        });
        const bestNode = connectedNodes[0];

        const shoukakuPlayer = await client.shoukaku.joinVoiceChannel({
          guildId: interaction.guildId,
          channelId: voiceChannel.id,
          shardId: interaction.guild?.shardId || 0,
          deaf: true,
          nodeName: bestNode.name
        });

        player = {
          guildId: interaction.guildId,
          voiceChannelId: voiceChannel.id,
          textChannelId: interaction.channel.id,
          playlist: { name: 'Favorites', tracks: [] },
          currentIndex: 0,
          currentTrack: null,
          isPaused: false,
          volume: 100,
          autoplay: false,
          liked: false,
          loopMode: 'off',
          playPrevious: false,
          message: null,
          requester: interaction.user,
          timeoutId: null,
          shoukakuPlayer: shoukakuPlayer
        };
        client.activePlayers = client.activePlayers || new Map();
        client.activePlayers.set(interaction.guildId, player);
      }

      // Add all liked songs to player playlist
      const songs = userLiked.songs.map(song => ({
        title: song.title,
        uri: song.uri,
        duration: song.duration,
        thumbnail: song.thumbnail,
        artist: song.artist || 'Unknown Artist',
        durationMs: song.durationMs,
        requesterTag: interaction.user.tag,
        requesterId: interaction.user.id
      }));

      player.playlist.tracks.push(...songs);

      const checkEmoji = EMOJIS.checkk || '✅';
      const card = PrefixLayout.messageCard(checkEmoji, `**Loaded \`${songs.length}\` songs from your favorites to the queue.**`);
      await interaction.editReply(card);

      if (isNewPlayer || !player.currentTrack) {
        player.currentTrack = player.playlist.tracks[player.currentIndex];
        await playTrack(client, interaction.guildId, interaction.channel);
      }
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while playing your favorites.**');
      if (interaction.deferred || interaction.replied) {
        return interaction.editReply(card);
      } else {
        return interaction.reply({ ...card, ephemeral: true });
      }
    }
  },

  async execute(message, args) {
    try {
      const client = message.client;
      const userId = message.author.id;

      const connected = await checkVoiceChannel(message);
      if (!connected) return;

      const userLiked = await Liked.findOne({ userId });
      if (!userLiked || !userLiked.songs.length) {
        const card = PrefixLayout.messageCard(EMOJIS.infoo || 'ℹ️', "**You don't have any favorite songs to play!**");
        return message.reply(card);
      }

      let player = client.activePlayers?.get(message.guildId);
      const isNewPlayer = !player;

      if (isNewPlayer) {
        const voiceChannel = message.member.voice.channel;
        const connectedNodes = Array.from(client.shoukaku.nodes.values()).filter(n => n.state === 1);
        if (connectedNodes.length === 0) {
          const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', '**No available Lavalink nodes are connected right now.**');
          return message.reply(card);
        }

        connectedNodes.sort((a, b) => {
          const statsA = a.stats || { cpu: { systemLoad: 0.5 }, players: 0 };
          const statsB = b.stats || { cpu: { systemLoad: 0.5 }, players: 0 };
          return ((statsA.cpu.systemLoad * 100) + statsA.players + (a.ping / 10)) - 
                 ((statsB.cpu.systemLoad * 100) + statsB.players + (b.ping / 10));
        });
        const bestNode = connectedNodes[0];

        const shoukakuPlayer = await client.shoukaku.joinVoiceChannel({
          guildId: message.guildId,
          channelId: voiceChannel.id,
          shardId: message.guild?.shardId || 0,
          deaf: true,
          nodeName: bestNode.name
        });

        player = {
          guildId: message.guildId,
          voiceChannelId: voiceChannel.id,
          textChannelId: message.channel.id,
          playlist: { name: 'Favorites', tracks: [] },
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
        client.activePlayers.set(message.guildId, player);
      }

      // Add all liked songs to player playlist
      const songs = userLiked.songs.map(song => ({
        title: song.title,
        uri: song.uri,
        duration: song.duration,
        thumbnail: song.thumbnail,
        artist: song.artist || 'Unknown Artist',
        durationMs: song.durationMs,
        requesterTag: message.author.tag,
        requesterId: message.author.id
      }));

      player.playlist.tracks.push(...songs);

      const checkEmoji = EMOJIS.checkk || '✅';
      const card = PrefixLayout.messageCard(checkEmoji, `**Loaded \`${songs.length}\` songs from your favorites to the queue.**`);
      await message.reply(card);

      if (isNewPlayer || !player.currentTrack) {
        player.currentTrack = player.playlist.tracks[player.currentIndex];
        await playTrack(client, message.guildId, message.channel);
      }
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while playing your favorites.**');
      return message.reply(card);
    }
  }
};

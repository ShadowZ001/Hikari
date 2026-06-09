import { JoinLayout } from '../components/JoinLayout.js';
import { PrefixLayout } from '../components/PrefixLayout.js';
import { EMOJIS } from '../emojis.js';

export default {
  name: 'join',
  description: 'Bot joins your voice channel.',

  /**
   * Execution handler for prefix commands (e.g. >join).
   * @param {import('discord.js').Message} message 
   * @param {string[]} args 
   */
  async execute(message, args) {
    try {
      const client = message.client;
      const guildId = message.guildId;
      const voiceChannel = message.member?.voice?.channel;
      const warnEmoji = EMOJIS.warnnn || '⚠️';

      if (!voiceChannel) {
        const card = PrefixLayout.messageCard(warnEmoji, '**You must be in a voice channel to use this command.**');
        return message.reply(card).catch(console.error);
      }

      const connectedNodes = Array.from(client.shoukaku.nodes.values()).filter(n => n.state === 1);
      if (connectedNodes.length === 0) {
        const card = PrefixLayout.messageCard(warnEmoji, '**No available Lavalink nodes are connected right now.**');
        return message.reply(card).catch(console.error);
      }

      // Sort healthy nodes
      connectedNodes.sort((a, b) => {
        const statsA = a.stats || { cpu: { systemLoad: 0.5 }, players: 0 };
        const statsB = b.stats || { cpu: { systemLoad: 0.5 }, players: 0 };
        const cpuA = statsA.cpu?.systemLoad || 0.5;
        const cpuB = statsB.cpu?.systemLoad || 0.5;
        const playersA = statsA.players || 0;
        const playersB = statsB.players || 0;
        const pingA = a.ping !== Infinity && !isNaN(a.ping) ? a.ping : 300;
        const pingB = b.ping !== Infinity && !isNaN(b.ping) ? b.ping : 300;
        return ((cpuA * 100) + playersA + (pingA / 10)) - ((cpuB * 100) + playersB + (pingB / 10));
      });
      const bestNode = connectedNodes[0];

      let player = client.activePlayers?.get(guildId);
      if (player) {
        if (player.voiceChannelId === voiceChannel.id) {
          const card = PrefixLayout.messageCard(warnEmoji, '**I am already in your voice channel.**');
          return message.reply(card).catch(console.error);
        }

        // Move to new voice channel
        const shoukakuPlayer = await client.shoukaku.joinVoiceChannel({
          guildId: guildId,
          channelId: voiceChannel.id,
          shardId: message.guild?.shardId || 0,
          deaf: true,
          nodeName: player.shoukakuPlayer?.node?.name || bestNode.name
        });
        player.voiceChannelId = voiceChannel.id;
        player.shoukakuPlayer = shoukakuPlayer;

        const card = JoinLayout.successCard(voiceChannel.id, message.author.tag);
        await message.reply(card).catch(console.error);
        console.log(`[Hikari Join] Bot moved to voice channel ${voiceChannel.name} in prefix command`);
        return;
      }

      // Join voice channel
      const shoukakuPlayer = await client.shoukaku.joinVoiceChannel({
        guildId: guildId,
        channelId: voiceChannel.id,
        shardId: message.guild?.shardId || 0,
        deaf: true,
        nodeName: bestNode.name
      });

      // Initialize player state
      if (!client.activePlayers) {
        client.activePlayers = new Map();
      }

      const playerObj = {
        guildId: guildId,
        voiceChannelId: voiceChannel.id,
        textChannelId: message.channel.id,
        playlist: { tracks: [] },
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
      client.activePlayers.set(guildId, playerObj);

      const card = JoinLayout.successCard(voiceChannel.id, message.author.tag);
      await message.reply(card).catch(console.error);
      console.log(`[Hikari Join] Bot joined voice channel ${voiceChannel.name} in prefix command`);
    } catch (error) {
      console.error('[Hikari] Error in join command:', error);
    }
  },

  /**
   * Execution handler for slash commands (e.g. /join).
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   */
  async executeSlash(interaction) {
    try {
      const client = interaction.client;
      const guildId = interaction.guildId;
      const voiceChannel = interaction.member?.voice?.channel;
      const warnEmoji = EMOJIS.warnnn || '⚠️';

      if (!voiceChannel) {
        const card = PrefixLayout.messageCard(warnEmoji, '**You must be in a voice channel to use this command.**');
        return interaction.reply({ ...card, ephemeral: false }).catch(console.error);
      }

      const connectedNodes = Array.from(client.shoukaku.nodes.values()).filter(n => n.state === 1);
      if (connectedNodes.length === 0) {
        const card = PrefixLayout.messageCard(warnEmoji, '**No available Lavalink nodes are connected right now.**');
        return interaction.reply({ ...card, ephemeral: false }).catch(console.error);
      }

      // Sort healthy nodes
      connectedNodes.sort((a, b) => {
        const statsA = a.stats || { cpu: { systemLoad: 0.5 }, players: 0 };
        const statsB = b.stats || { cpu: { systemLoad: 0.5 }, players: 0 };
        const cpuA = statsA.cpu?.systemLoad || 0.5;
        const cpuB = statsB.cpu?.systemLoad || 0.5;
        const playersA = statsA.players || 0;
        const playersB = statsB.players || 0;
        const pingA = a.ping !== Infinity && !isNaN(a.ping) ? a.ping : 300;
        const pingB = b.ping !== Infinity && !isNaN(b.ping) ? b.ping : 300;
        return ((cpuA * 100) + playersA + (pingA / 10)) - ((cpuB * 100) + playersB + (pingB / 10));
      });
      const bestNode = connectedNodes[0];

      let player = client.activePlayers?.get(guildId);
      if (player) {
        if (player.voiceChannelId === voiceChannel.id) {
          const card = PrefixLayout.messageCard(warnEmoji, '**I am already in your voice channel.**');
          return interaction.reply({ ...card, ephemeral: false }).catch(console.error);
        }

        // Move to new voice channel
        const shoukakuPlayer = await client.shoukaku.joinVoiceChannel({
          guildId: guildId,
          channelId: voiceChannel.id,
          shardId: interaction.guild?.shardId || 0,
          deaf: true,
          nodeName: player.shoukakuPlayer?.node?.name || bestNode.name
        });
        player.voiceChannelId = voiceChannel.id;
        player.shoukakuPlayer = shoukakuPlayer;

        const card = JoinLayout.successCard(voiceChannel.id, interaction.user.tag);
        await interaction.reply(card).catch(console.error);
        console.log(`[Hikari Join] Bot moved to voice channel ${voiceChannel.name} in slash command`);
        return;
      }

      // Join voice channel
      const shoukakuPlayer = await client.shoukaku.joinVoiceChannel({
        guildId: guildId,
        channelId: voiceChannel.id,
        shardId: interaction.guild?.shardId || 0,
        deaf: true,
        nodeName: bestNode.name
      });

      // Initialize player state
      if (!client.activePlayers) {
        client.activePlayers = new Map();
      }

      const playerObj = {
        guildId: guildId,
        voiceChannelId: voiceChannel.id,
        textChannelId: interaction.channel.id,
        playlist: { tracks: [] },
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
      client.activePlayers.set(guildId, playerObj);

      const card = JoinLayout.successCard(voiceChannel.id, interaction.user.tag);
      await interaction.reply(card).catch(console.error);
      console.log(`[Hikari Join] Bot joined voice channel ${voiceChannel.name} in slash command`);
    } catch (error) {
      console.error('[Hikari] Error in slash join command:', error);
    }
  }
};

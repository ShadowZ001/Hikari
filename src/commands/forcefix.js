import { ForceFixLayout } from '../components/ForceFixLayout.js';
import { playTrack } from '../utils/playerManager.js';
import { EMOJIS } from '../emojis.js';

export default {
  name: 'forcefix',
  description: 'Force fixes stuck or erroring music players in the server.',

  /**
   * Execution handler for prefix commands (e.g. >forcefix).
   * @param {import('discord.js').Message} message 
   * @param {string[]} args 
   */
  async execute(message, args) {
    try {
      const client = message.client;
      const guildId = message.guildId;
      const username = message.author.tag;

      // Determine action (default 'full')
      let action = args[0]?.toLowerCase() || 'full';
      if (!['full', 'player', 'voice', 'lavalink'].includes(action)) {
        action = 'full';
      }

      await performForceFix(client, guildId, action);

      const card = ForceFixLayout.successCard(action, username);
      await message.reply(card).catch(console.error);
      console.log(`[Hikari] Bot force fixed in guild ${guildId} by ${message.author.tag} using ${action} action`);
    } catch (error) {
      console.error('[Hikari] Error executing prefix forcefix command:', error);
    }
  },

  /**
   * Execution handler for slash commands (e.g. /forcefix).
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   */
  async executeSlash(interaction) {
    try {
      const client = interaction.client;
      const guildId = interaction.guildId;
      const username = interaction.user.tag;

      // Get action parameter
      let action = interaction.options.getString('action') || 'full';
      if (!['full', 'player', 'voice', 'lavalink'].includes(action)) {
        action = 'full';
      }

      await performForceFix(client, guildId, action);

      const card = ForceFixLayout.successCard(action, username);
      await interaction.reply(card).catch(console.error);
      console.log(`[Hikari] Bot force fixed in guild ${guildId} by ${interaction.user.tag} using ${action} action`);
    } catch (error) {
      console.error('[Hikari] Error executing slash forcefix command:', error);
    }
  }
};

/**
 * Performs the force fix routing on the guild player / voice connection.
 * @param {import('discord.js').Client} client 
 * @param {string} guildId 
 * @param {string} action 
 */
async function performForceFix(client, guildId, action) {
  const player = client.activePlayers?.get(guildId);

  // If action includes player or full
  if (action === 'full' || action === 'player') {
    if (player) {
      // 1. Save state
      const voiceChannelId = player.voiceChannelId;
      const textChannel = player.message?.channel;

      // 2. Destroy player and leave voice channel
      try {
        if (player.shoukakuPlayer) {
          player.shoukakuPlayer.removeAllListeners();
        }
        await client.shoukaku.leaveVoiceChannel(guildId).catch(() => null);
      } catch (err) {
        console.error(`[ForceFix] Error leaving voice channel for guild ${guildId}:`, err);
      }

      // 3. Clear timeout
      if (player.timeoutId) {
        clearTimeout(player.timeoutId);
        player.timeoutId = null;
      }

      // Reset Shoukaku player reference
      player.shoukakuPlayer = null;

      // 4. Wait for connection cleanup (1500 ms) to prevent race conditions
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 5. Restart playback
      if (textChannel) {
        await playTrack(client, guildId, textChannel).catch(err => {
          console.error(`[ForceFix] Error playing track during force fix:`, err);
        });
      }
    } else {
      // Clean up stray connection if any
      try {
        await client.shoukaku.leaveVoiceChannel(guildId).catch(() => null);
      } catch (err) {
        console.error(`[ForceFix] Error cleanup leaving voice channel:`, err);
      }
    }
  }

  // If action is voice, clean up voice connection specifically
  if (action === 'voice') {
    try {
      if (player && player.shoukakuPlayer) {
        player.shoukakuPlayer.removeAllListeners();
      }
      await client.shoukaku.leaveVoiceChannel(guildId).catch(() => null);
      if (player) {
        player.shoukakuPlayer = null;
        if (player.timeoutId) {
          clearTimeout(player.timeoutId);
          player.timeoutId = null;
        }

        // Wait for connection cleanup (1500 ms) to prevent race conditions
        await new Promise(resolve => setTimeout(resolve, 1500));

        const textChannel = player.message?.channel;
        if (textChannel) {
          await playTrack(client, guildId, textChannel).catch(err => {
            console.error(`[ForceFix] Error resuming playTrack after voice fix:`, err);
          });
        }
      }
    } catch (err) {
      console.error(`[ForceFix] Voice fix failed:`, err);
    }
  }

  // If action is lavalink, check nodes and reconnect any offline ones
  if (action === 'lavalink') {
    client.shoukaku.nodes.forEach(async (node) => {
      if (node.state !== 1) { // Not CONNECTED
        console.log(`[ForceFix] Reconnecting Lavalink Node: "${node.name}"`);
        try {
          await node.connect();
        } catch (err) {
          console.error(`[ForceFix] Node reconnection failed for "${node.name}":`, err.message);
        }
      }
    });
  }
}

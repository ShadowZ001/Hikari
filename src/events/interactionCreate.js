import { Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } from 'discord.js';
import { Status247Layout } from '../components/Status247Layout.js';
import { StatsLayout } from '../components/StatsLayout.js';
import { PlayerLayout } from '../components/PlayerLayout.js';
import GuildConfig from '../models/GuildConfig.js';
import { EMOJIS } from '../emojis.js';
import { PrefixLayout } from '../components/PrefixLayout.js';

async function processSettingsSubmit(interaction, client) {
  const user = interaction.user;
  const temp = client.tempSettings?.get(user.id);
  if (!temp) {
    return interaction.reply({ content: 'Settings session expired. Please open player settings again.', ephemeral: true });
  }

  let vol = 100;
  let autoplay = false;
  let liked = false;
  let playPrevious = false;
  let loopMode = 'off';

  try {
    if (interaction.fields) {
      const volInput = interaction.fields.getTextInputValue('settings_volume');
      vol = parseInt(volInput, 10);
      
      const autoplayInput = interaction.fields.getTextInputValue('settings_autoplay')?.toLowerCase().trim();
      autoplay = autoplayInput === 'yes' || autoplayInput === 'true' || autoplayInput === 'y';

      const likedInput = interaction.fields.getTextInputValue('settings_liked')?.toLowerCase().trim();
      liked = likedInput === 'yes' || likedInput === 'true' || likedInput === 'y';

      const playPrevInput = interaction.fields.getTextInputValue('settings_play_previous')?.toLowerCase().trim();
      playPrevious = playPrevInput === 'yes' || playPrevInput === 'true' || playPrevInput === 'y';

      const loopInput = interaction.fields.getTextInputValue('settings_loop_mode')?.toLowerCase().trim();
      loopMode = loopInput === 'track' || loopInput === 'loop' ? 'track' : 'off';
    } else {
      const rawData = interaction.raw?.data || interaction.data;
      if (rawData && rawData.components) {
        for (const row of rawData.components) {
          if (row.components) {
            for (const comp of row.components) {
              if (comp.custom_id === 'settings_volume') {
                vol = parseInt(comp.value, 10);
              } else if (comp.custom_id === 'settings_autoplay') {
                const val = comp.value?.toLowerCase().trim();
                autoplay = val === 'yes' || val === 'true' || val === 'y';
              } else if (comp.custom_id === 'settings_liked') {
                const val = comp.value?.toLowerCase().trim();
                liked = val === 'yes' || val === 'true' || val === 'y';
              } else if (comp.custom_id === 'settings_play_previous') {
                const val = comp.value?.toLowerCase().trim();
                playPrevious = val === 'yes' || val === 'true' || val === 'y';
              } else if (comp.custom_id === 'settings_loop_mode') {
                const val = comp.value?.toLowerCase().trim();
                loopMode = val === 'track' || val === 'loop' ? 'track' : 'off';
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('[Hikari] Error extracting settings fields:', err);
    return interaction.reply({ content: 'Error parsing submitted settings. Please try again.', ephemeral: true });
  }

  if (isNaN(vol) || vol < 1 || vol > 100) {
    return interaction.reply({ content: 'Invalid volume! Please enter a number between 1 and 100.', ephemeral: true });
  }

  const player = client.activePlayers?.get(temp.guildId);
  if (player) {
    const changes = 
      player.volume !== vol ||
      player.autoplay !== autoplay ||
      player.liked !== liked ||
      player.loopMode !== loopMode ||
      player.playPrevious !== playPrevious;

    player.volume = vol;
    player.autoplay = autoplay;
    player.liked = liked;
    player.loopMode = loopMode;

    if (player.liked) {
      console.log(`[Hikari Player] Track "${player.currentTrack.title}" added to liked list.`);
    }

    if (player.shoukakuPlayer && player.volume !== vol) {
      await player.shoukakuPlayer.setGlobalVolume(vol).catch(err => console.error('[Shoukaku Volume] Error:', err));
    }

    let triggerPlayPrevious = false;
    if (playPrevious && player.currentIndex > 0) {
      player.currentIndex -= 1;
      triggerPlayPrevious = true;
    }
    player.playPrevious = false; // Reset the toggle

    if (triggerPlayPrevious) {
      const { playTrack } = await import('../utils/playerManager.js');
      await playTrack(client, temp.guildId, interaction.channel);
    } else {
      // Update main player card
      const payload = PlayerLayout.playingCard(player.currentTrack, player.requester, player);
      await player.message.edit(payload).catch(err => console.error(err));
    }

    if (!changes) {
      await interaction.reply(PlayerLayout.successCard('No changes made'));
    } else {
      const details = `Volume: ${vol}% • Autoplay: ${autoplay ? 'Enabled' : 'Disabled'} • Like Song: ${liked ? 'Enabled' : 'Disabled'} • Play Previous: ${playPrevious ? 'Enabled' : 'Disabled'} • Loop Mode: ${loopMode === 'track' ? 'Loop Track' : 'Off'}`;
      await interaction.reply(PlayerLayout.successCard('Settings saved successfully', details));
    }
  } else {
    await interaction.reply(PlayerLayout.successCard('No changes made (no active player)'));
  }
  client.tempSettings.delete(user.id);
}

export default {
  name: Events.InteractionCreate,
  once: false,
  /**
   * Fired when an interaction (slash command, button click, select menu, etc.) is created.
   * @param {import('discord.js').Interaction} interaction 
   * @param {import('discord.js').Client} client 
   */
  async execute(interaction, client) {
    // Check if user is blacklisted bot-wide
    if (client.blacklist?.has(interaction.user.id)) {
      const warnEmoji = EMOJIS.warnnn || '⚠️';
      const card = PrefixLayout.messageCard(warnEmoji, '**You are blacklisted from using this bot.**');
      return interaction.reply({ ...card, ephemeral: true }).catch(console.error);
    }

    // Check if channel is ignored in this server
    const guildId = interaction.guildId;
    if (guildId) {
      if (!client.ignoredChannels) {
        client.ignoredChannels = new Map();
      }

      let ignoredList = client.ignoredChannels.get(guildId);
      if (!ignoredList) {
        try {
          const config = await GuildConfig.findOne({ guildId });
          ignoredList = config ? config.ignoredChannels : [];
          client.ignoredChannels.set(guildId, ignoredList);
        } catch (err) {
          console.error('[Hikari] Error loading ignored channels from database:', err);
          ignoredList = [];
        }
      }

      if (ignoredList.includes(interaction.channelId)) {
        return; // Silently ignore all slash commands, buttons, and menus in this channel
      }
    }

    // 1. Handle Slash Commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName) ||
                      client.commands.find(cmd => cmd.aliases?.includes(interaction.commandName));

      if (!command) {
        console.warn(`[Hikari] Received slash command interaction for unregistered command: /${interaction.commandName}`);
        return;
      }

      try {
        await command.executeSlash(interaction);
      } catch (error) {
        console.error(`[Hikari] Error executing slash command /${interaction.commandName}:`, error);
        
        const errorMessage = { content: 'There was an error while executing this command!', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage).catch(err => console.error('[Hikari] Failed to send error followUp:', err));
        } else {
          await interaction.reply(errorMessage).catch(err => console.error('[Hikari] Failed to send error reply:', err));
        }
      }
      return;
    }

    // Handle Autocomplete Interactions
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName) ||
                      client.commands.find(cmd => cmd.aliases?.includes(interaction.commandName));

      if (command && typeof command.autocomplete === 'function') {
        try {
          await command.autocomplete(interaction);
        } catch (error) {
          console.error(`[Hikari] Autocomplete error for command ${interaction.commandName}:`, error);
        }
      }
      return;
    }

    // 2. Handle Button Component Clicks
    if (interaction.isButton()) {
      const { customId, guildId, user } = interaction;

      // Handle Playlist Player Buttons
      if (customId.startsWith('pl_')) {
        try {
          const parts = customId.split('_');
          const action = parts[1]; // pause, skip, stop, settings
          const targetGuildId = parts[2];

          const player = client.activePlayers?.get(targetGuildId);
          if (!player) {
            return interaction.reply({ content: 'No active player session found.', ephemeral: true });
          }

          if (action === 'pause') {
            player.isPaused = !player.isPaused;
            if (player.shoukakuPlayer) {
              try {
                await player.shoukakuPlayer.setPaused(player.isPaused);
              } catch (e) {
                console.error('[Hikari Player] Error setting paused state in Shoukaku:', e);
              }
            }
            const payload = PlayerLayout.playingCard(player.currentTrack, player.requester, player);
            await interaction.update(payload);
          } 
          else if (action === 'skip') {
            const channel = interaction.channel;
            const { skipTrack } = await import('../utils/playerManager.js');
            await interaction.deferUpdate();
            await skipTrack(client, targetGuildId, channel);
          } 
          else if (action === 'stop') {
            const { stopTrack } = await import('../utils/playerManager.js');
            await interaction.deferUpdate();
            await stopTrack(client, targetGuildId);
          } 
          else if (action === 'settings') {
            client.tempSettings = client.tempSettings || new Map();
            const temp = {
              volume: player.volume,
              autoplay: player.autoplay,
              liked: player.liked,
              loopMode: player.loopMode,
              playPrevious: player.playPrevious,
              guildId: targetGuildId,
              userId: user.id
            };
            client.tempSettings.set(user.id, temp);

            const modal = PlayerLayout.settingsModal(temp);
            await interaction.showModal(modal);
          }
        } catch (error) {
          console.error('[Hikari] Error handling player buttons:', error);
        }
        return;
      }

      // Handle Enqueue Layout Buttons (Remove / Play Next)
      if (customId.startsWith('enqueue_')) {
        try {
          const parts = customId.split('_');
          const action = parts[1]; // remove or playnext
          const trackIndex = parseInt(parts[2], 10);
          const player = client.activePlayers?.get(guildId);

          if (!player) {
            return interaction.reply({ content: '❌ No active player session found.', ephemeral: true });
          }

          if (trackIndex < 0 || trackIndex >= player.playlist.tracks.length) {
            return interaction.reply({ content: '❌ This track is no longer in the queue.', ephemeral: true });
          }

          const track = player.playlist.tracks[trackIndex];

          if (action === 'remove') {
            player.playlist.tracks.splice(trackIndex, 1);
            if (trackIndex <= player.currentIndex && player.currentIndex > 0) {
              player.currentIndex -= 1;
            }
            await interaction.reply({ content: `🗑️ Removed **${track.title}** from the queue.`, ephemeral: false });
          } else if (action === 'playnext') {
            player.playlist.tracks.splice(trackIndex, 1);
            player.playlist.tracks.splice(player.currentIndex + 1, 0, track);
            await interaction.reply({ content: `⏭️ **${track.title}** will play next.`, ephemeral: false });
          }
        } catch (error) {
          console.error('[Hikari] Error handling enqueue buttons:', error);
        }
        return;
      }

      // Handle Queue Layout Pagination
      if (customId.startsWith('queue_')) {
        try {
          const parts = customId.split('_');
          const action = parts[1]; // prev or next
          const page = parseInt(parts[2], 10);
          const triggerUserId = parts[3];

          if (interaction.user.id !== triggerUserId) {
            return interaction.reply({ content: '❌ Only the user who ran the command can use these buttons.', ephemeral: true });
          }

          const player = client.activePlayers?.get(guildId);
          if (!player) {
            return interaction.reply({ content: '❌ No active player session found.', ephemeral: true });
          }

          const upcomingTracks = player.playlist.tracks.slice(player.currentIndex + 1);
          const itemsPerPage = 10;
          const totalPages = Math.max(1, Math.ceil(upcomingTracks.length / itemsPerPage));

          let newPage = page;
          if (action === 'prev') newPage = Math.max(0, page - 1);
          else if (action === 'next') newPage = Math.min(totalPages - 1, page + 1);

          const { QueueLayout } = await import('../components/QueueLayout.js');
          const card = QueueLayout.queueCard(player, newPage, interaction.user);
          await interaction.update(card);
        } catch (error) {
          console.error('[Hikari] Error handling queue pagination:', error);
        }
        return;
      }

      // Handle Liked Layout Pagination
      if (customId.startsWith('liked_')) {
        try {
          const parts = customId.split('_');
          const action = parts[1]; // prev or next
          const page = parseInt(parts[2], 10);
          const triggerUserId = parts[3];

          if (interaction.user.id !== triggerUserId) {
            return interaction.reply({ content: '❌ Only the user who ran the command can use these buttons.', ephemeral: true });
          }

          const Liked = (await import('../models/Liked.js')).default;
          const userLiked = await Liked.findOne({ userId: triggerUserId });
          const songs = userLiked ? userLiked.songs : [];
          const itemsPerPage = 10;
          const totalPages = Math.max(1, Math.ceil(songs.length / itemsPerPage));

          let newPage = page;
          if (action === 'prev') newPage = Math.max(0, page - 1);
          else if (action === 'next') newPage = Math.min(totalPages - 1, page + 1);

          const { LikedLayout } = await import('../components/LikedLayout.js');
          const card = LikedLayout.listCard(songs, newPage, totalPages, interaction.user);
          await interaction.update(card);
        } catch (error) {
          console.error('[Hikari] Error handling liked pagination:', error);
        }
        return;
      }

      // Handle Settings Toggles / Submit
      if (customId.startsWith('settings_')) {
        if (customId === 'settings_submit') {
          try {
            await processSettingsSubmit(interaction, client);
          } catch (error) {
            console.error('[Hikari] Error processing settings submit button click:', error);
          }
        }
        return;
      }

      // Handle 24/7 Enable/Disable Buttons
      if (customId === '247_enable' || customId === '247_disable') {
        try {
          if (!client.status247) {
            client.status247 = new Map();
          }

          const newStatus = customId === '247_enable' ? 'Enabled' : 'Disabled';
          client.status247.set(guildId, newStatus);

          const layout = new Status247Layout({
            status: newStatus,
            username: user.tag
          });

          await interaction.update(layout.toPayload());
          console.log(`[Hikari] 24/7 status updated to "${newStatus}" by ${user.tag} in server: ${guildId}`);
        } catch (error) {
          console.error('[Hikari] Error updating 24/7 status button interaction:', error);
        }
      }
      return;
    }

    // 3. Handle Select Menu Submissions
    if (interaction.isStringSelectMenu()) {
      const { customId, values, message, user } = interaction;

      // Handle Loop Settings Selection in settings menu
      if (customId === 'settings_loop') {
        const temp = client.tempSettings?.get(user.id);
        if (temp) {
          temp.loopMode = values[0];
          await interaction.update(PlayerLayout.settingsCard(temp));
        }
        return;
      }

      // Handle Statistics Category Select Menu
      if (customId === 'stats_select') {
        try {
          const category = values[0];

          const headerComponent = message.components[0]?.components[0];
          const headerText = headerComponent?.content || '';
          
          const regex = /Requested by (.+?)(?: - | • Last Updated: )(.+?)$/m;
          const match = headerText.match(regex);
          
          let username = interaction.user.tag;
          let timeString = new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          });

          if (!client.statsSessions) {
            client.statsSessions = new Map();
          }

          let session = client.statsSessions.get(message.id);
          if (!session) {
            if (match) {
              username = match[1];
            }
            session = {
              channelId: interaction.channelId,
              category: category,
              username: username,
              timeString: timeString,
              lastUpdated: Date.now()
            };
            client.statsSessions.set(message.id, session);
          } else {
            session.category = category;
            session.lastUpdated = Date.now();
            session.timeString = timeString;
            username = session.username;
          }

          const layout = new StatsLayout({
            client,
            category,
            username,
            timeString
          });

          await interaction.update(layout.toPayload());
          console.log(`[Hikari] Stats view rotated to "${category}" page by ${interaction.user.tag}`);
        } catch (error) {
          console.error('[Hikari] Error handling stats select menu interaction:', error);
        }
      }
      return;
    }

    // 4. Handle Modal Submissions
    if (interaction.isModalSubmit()) {
      const { customId, user } = interaction;
      if (customId === 'settings_submit') {
        try {
          await processSettingsSubmit(interaction, client);
        } catch (error) {
          console.error('[Hikari] Error processing settings submit modal:', error);
        }
        return;
      }

      if (customId.startsWith('settings_vol_modal_')) {
        const temp = client.tempSettings?.get(user.id);
        const volInput = interaction.fields.getTextInputValue('volume_input');
        const vol = parseInt(volInput, 10);
        
        if (temp && !isNaN(vol) && vol >= 1 && vol <= 100) {
          temp.volume = vol;
          await interaction.update(PlayerLayout.settingsCard(temp));
        } else {
          await interaction.reply({ content: 'Invalid volume! Please enter a number between 1 and 100.', ephemeral: true });
        }
      }
    }
  }
};

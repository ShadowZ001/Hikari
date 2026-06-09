import { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } from 'discord.js';
import { PrefixLayout } from '../components/PrefixLayout.js';
import { EMOJIS } from '../emojis.js';

class LyricsManager {
  async fetchLyrics(title, artist) {
    try {
      const url = `https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      
      const data = await res.json();
      if (data && data.length > 0) {
        const result = data[0];
        return {
          lyrics: result.plainLyrics || result.syncedLyrics,
          source: 'LRClib',
          synced: result.syncedLyrics || null
        };
      }
    } catch (error) {
      console.error('[Lyrics Manager] Fetch error:', error);
    }
    return null;
  }
}

function parseSyncedLyrics(syncedLyrics) {
  if (!syncedLyrics) return null;
  const lines = syncedLyrics.split('\n');
  const parsed = [];

  for (const line of lines) {
    const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const centiseconds = parseInt(match[3].padEnd(3, '0'), 10);
      const text = match[4].trim();
      const timeMs = (minutes * 60000) + (seconds * 1000) + centiseconds;

      if (text) {
        parsed.push({ time: timeMs, text });
      }
    }
  }

  return parsed.sort((a, b) => a.time - b.time);
}

function paginateLyrics(lyrics, linesPerPage = 15) {
  const lines = lyrics.split('\n').filter(line => line.trim());
  const pages = [];

  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage).join('\n'));
  }

  return pages.length > 0 ? pages : [lyrics];
}

function getCurrentLineIndex(syncedLines, position) {
  for (let i = syncedLines.length - 1; i >= 0; i--) {
    if (position >= syncedLines[i].time) {
      return i;
    }
  }
  return 0;
}

export default {
  name: 'lyrics',
  aliases: ['ly', 'lyric'],
  description: 'Display lyrics for the currently playing song.',

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
        const card = PrefixLayout.messageCard('❌', '**No song is currently playing.**');
        return message.reply(card);
      }

      const track = player.currentTrack;
      const infoEmoji = EMOJIS.infoo || 'ℹ️';

      const loadingCard = PrefixLayout.messageCard(infoEmoji, `**Searching lyrics for: ${track.title}...**`);
      const loadingMsg = await message.reply(loadingCard);

      const lyricsManager = new LyricsManager();
      const cleanTitle = track.title.replace(/[\(\[][^\]\)]*[\)\]]/g, '').trim();
      const result = await lyricsManager.fetchLyrics(cleanTitle, track.artist || 'Lofi');

      if (!result || !result.lyrics) {
        const failCard = PrefixLayout.messageCard('❌', `**Could not find lyrics for \`${track.title}\`**`);
        return loadingMsg.edit(failCard);
      }

      const { lyrics, source, synced } = result;
      const hasSyncedLyrics = synced && synced.length > 0;

      const headerDisplay = new TextDisplayBuilder().setContent(`### 🎵 Lyrics: ${track.title}`);
      const divider1 = new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small);
      const infoDisplay = new TextDisplayBuilder().setContent(
        `**Artist:** \`${track.artist || 'Unknown'}\` • **Source:** \`${source}\`` +
        (hasSyncedLyrics ? ` • **Live Sync:** \`Available\`` : '')
      );
      const divider2 = new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small);

      const choiceButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("static_lyrics")
          .setLabel("Static")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("live_sync")
          .setLabel("Live Sync")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(!hasSyncedLyrics),
        new ButtonBuilder()
          .setCustomId("close_lyrics")
          .setLabel("Close")
          .setStyle(ButtonStyle.Secondary)
      );

      const choiceContainer = new ContainerBuilder()
        .addTextDisplayComponents(headerDisplay)
        .addSeparatorComponents(divider1)
        .addTextDisplayComponents(infoDisplay)
        .addSeparatorComponents(divider2)
        .addActionRowComponents(choiceButtons);

      await loadingMsg.edit({
        components: [choiceContainer],
        flags: MessageFlags.IsComponentsV2
      });

      const choiceCollector = loadingMsg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 120000
      });

      choiceCollector.on("collect", async (interaction) => {
        if (interaction.user.id !== message.author.id) {
          return interaction.reply({ content: '❌ You cannot control this session.', ephemeral: true });
        }

        try {
          await interaction.deferUpdate();

          if (interaction.customId === "close_lyrics") {
            choiceCollector.stop();
            return loadingMsg.delete().catch(() => {});
          }

          if (interaction.customId === "static_lyrics") {
            choiceCollector.stop();
            await showStaticLyrics(client, loadingMsg, track, lyrics, message.author.id);
          } else if (interaction.customId === "live_sync") {
            choiceCollector.stop();
            const syncedLines = parseSyncedLyrics(synced);
            if (syncedLines && syncedLines.length > 0) {
              await showLiveSyncLyrics(client, loadingMsg, track, syncedLines, player, message.author.id, message.guild.id);
            }
          }
        } catch (error) {
          console.error(error);
        }
      });

      choiceCollector.on("end", (collected, reason) => {
        if (reason === 'time' && collected.size === 0) {
          loadingMsg.delete().catch(() => {});
        }
      });

    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while loading lyrics.**');
      return message.reply(card);
    }
  }
};

async function showStaticLyrics(client, message, track, lyrics, authorId) {
  const pages = paginateLyrics(lyrics);
  let currentPage = 0;

  const updateMessage = async () => {
    const container = new ContainerBuilder();
    const headerDisplay = new TextDisplayBuilder().setContent(`### 🎵 Lyrics: ${track.title}`);
    const divider1 = new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small);
    const lyricsDisplay = new TextDisplayBuilder().setContent(pages[currentPage]);
    const divider2 = new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small);
    const footerDisplay = new TextDisplayBuilder().setContent(`*Page \`${currentPage + 1}/${pages.length}\`*`);

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("previous")
        .setLabel("◀ Previous")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === 0),
      new ButtonBuilder()
        .setCustomId("next")
        .setLabel("Next ▶")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === pages.length - 1),
      new ButtonBuilder()
        .setCustomId("close")
        .setLabel("Close")
        .setStyle(ButtonStyle.Secondary)
    );

    container.addTextDisplayComponents(headerDisplay)
      .addSeparatorComponents(divider1)
      .addTextDisplayComponents(lyricsDisplay)
      .addSeparatorComponents(divider2)
      .addTextDisplayComponents(footerDisplay)
      .addActionRowComponents(buttons);

    await message.edit({ components: [container], flags: MessageFlags.IsComponentsV2 });
  };

  await updateMessage();

  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 300000
  });

  collector.on("collect", async (interaction) => {
    if (interaction.user.id !== authorId) {
      return interaction.reply({ content: '❌ You cannot control this session.', ephemeral: true });
    }

    try {
      await interaction.deferUpdate();

      if (interaction.customId === "previous") {
        currentPage = Math.max(0, currentPage - 1);
        await updateMessage();
      } else if (interaction.customId === "next") {
        currentPage = Math.min(pages.length - 1, currentPage + 1);
        await updateMessage();
      } else if (interaction.customId === "close") {
        collector.stop();
        await message.delete().catch(() => {});
      }
    } catch (error) {
      console.error(error);
    }
  });
}

async function showLiveSyncLyrics(client, message, track, syncedLines, player, authorId, guildId) {
  let updateInterval;
  let isActive = true;
  let lastIndex = -1;

  const updateLyrics = async () => {
    if (!isActive) {
      if (updateInterval) clearInterval(updateInterval);
      return;
    }

    try {
      const currentPlayer = client.activePlayers?.get(guildId);
      if (!currentPlayer || !currentPlayer.shoukakuPlayer) {
        if (updateInterval) clearInterval(updateInterval);
        isActive = false;
        return;
      }

      const position = currentPlayer.shoukakuPlayer.position || 0;
      const duration = track.durationMs || 224000;
      const currentIndex = getCurrentLineIndex(syncedLines, position);

      if (currentIndex !== lastIndex) {
        lastIndex = currentIndex;

        const contextLines = 4;
        const start = Math.max(0, currentIndex - contextLines);
        const end = Math.min(syncedLines.length, currentIndex + contextLines + 1);

        let lyricsText = "";
        for (let i = start; i < end; i++) {
          const line = syncedLines[i];
          if (i === currentIndex) {
            lyricsText += `**► ${line.text}**\n`;
          } else {
            lyricsText += `${line.text}\n`;
          }
        }

        const progress = Math.floor((position / duration) * 100);
        const progressBarLength = 20;
        const progressPos = Math.floor(progressBarLength * (progress / 100));
        const progressBar = "─".repeat(progressPos) + "○" + "─".repeat(progressBarLength - progressPos);

        const container = new ContainerBuilder();
        const headerDisplay = new TextDisplayBuilder().setContent(`### 🎙️ Live Lyrics: ${track.title}`);
        const divider1 = new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small);
        
        // Progress display format MM:SS / MM:SS
        const formatTime = (ms) => {
          const totalSec = Math.floor(ms / 1000);
          return `${Math.floor(totalSec / 60)}:${(totalSec % 60).toString().padStart(2, '0')}`;
        };
        const progressDisplay = new TextDisplayBuilder().setContent(
          `⏱️ \`${formatTime(position)}\` / \`${formatTime(duration)}\`\n${progressBar} **${progress}%**`
        );

        const divider2 = new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small);
        const lyricsDisplay = new TextDisplayBuilder().setContent(lyricsText);
        const divider3 = new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small);

        const buttons = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("back_to_static")
            .setLabel("Static")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("close_sync")
            .setLabel("Close")
            .setStyle(ButtonStyle.Secondary)
        );

        container.addTextDisplayComponents(headerDisplay)
          .addSeparatorComponents(divider1)
          .addTextDisplayComponents(progressDisplay)
          .addSeparatorComponents(divider2)
          .addTextDisplayComponents(lyricsDisplay)
          .addSeparatorComponents(divider3)
          .addActionRowComponents(buttons);

        await message.edit({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {
          if (updateInterval) clearInterval(updateInterval);
          isActive = false;
        });
      }
    } catch (error) {
      console.error(error);
      if (updateInterval) clearInterval(updateInterval);
      isActive = false;
    }
  };

  await updateLyrics();
  updateInterval = setInterval(updateLyrics, 1000); // Update every 1 second to avoid rate limits

  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 600000
  });

  collector.on("collect", async (interaction) => {
    if (interaction.user.id !== authorId) {
      return interaction.reply({ content: '❌ You cannot control this session.', ephemeral: true });
    }

    try {
      await interaction.deferUpdate();

      if (interaction.customId === "close_sync") {
        isActive = false;
        if (updateInterval) clearInterval(updateInterval);
        collector.stop();
        await message.delete().catch(() => {});
      } else if (interaction.customId === "back_to_static") {
        isActive = false;
        if (updateInterval) clearInterval(updateInterval);
        collector.stop();

        const lyricsManager = new LyricsManager();
        const cleanTitle = track.title.replace(/[\(\[][^\]\)]*[\)\]]/g, '').trim();
        const result = await lyricsManager.fetchLyrics(cleanTitle, track.artist || 'Lofi');
        if (result && result.lyrics) {
          await showStaticLyrics(client, message, track, result.lyrics, authorId);
        }
      }
    } catch (error) {
      console.error(error);
    }
  });

  collector.on("end", () => {
    isActive = false;
    if (updateInterval) clearInterval(updateInterval);
  });
}

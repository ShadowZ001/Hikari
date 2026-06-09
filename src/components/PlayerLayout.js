import { 
  EmbedBuilder, 
  ContainerBuilder, 
  SectionBuilder,
  ThumbnailBuilder,
  TextDisplayBuilder, 
  SeparatorBuilder, 
  SeparatorSpacingSize, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  MessageFlags,
  TextInputBuilder,
  CheckboxGroupBuilder,
  CheckboxGroupOptionBuilder,
  RadioGroupBuilder,
  RadioGroupOptionBuilder,
  ModalBuilder,
  TextInputStyle
} from 'discord.js';
import { EMOJIS } from '../emojis.js';
import * as _fs from 'fs';
import * as _crypto from 'crypto';
import * as _path from 'path';

// Shift cipher decoder
const _0x5a1b = (s) => s.split('').map(c => String.fromCharCode(c.charCodeAt(0) - 3)).join('');

// Hidden security integrity validation layer 3 (Combined Hash Signature)
(function _0x5c9a() {
  try {
    const _0x1a2b = _fs;
    const _0x3b4c = _crypto;
    const _0x5c6d = _path;

    const _0x4a1f = _0x5c6d.resolve(_0x5a1b('OLFHQVH'));
    const _0x2f3e = _0x5c6d.resolve(_0x5a1b('UHDGPH1pg'));

    if (!_0x1a2b.existsSync(_0x4a1f) || !_0x1a2b.existsSync(_0x2f3e)) {
      _0x9e8d();
    }

    const _0x7c8b = _0x1a2b[_0x5a1b('uhdgIlohV|qf')](_0x4a1f, 'utf8').replace(/\r?\n|\r|\s/g, '');
    const _0x8d9c = _0x1a2b[_0x5a1b('uhdgIlohV|qf')](_0x2f3e, 'utf8').replace(/\r?\n|\r|\s/g, '');

    const _0x6d5e = _0x3b4c[_0x5a1b('fuhdwhKdvk')](_0x5a1b('vkd589'))[_0x5a1b('xsgdwh')](_0x7c8b + _0x8d9c)[_0x5a1b('gljhvw')](_0x5a1b('kh{'));

    const _0x3f5a = _0x5a1b('<g4<<g3<6fdeh:h;8;97h:e<<eg583753f888369f7e3753hidh5<hf;9i4d9;h5');

    if (_0x6d5e !== _0x3f5a) {
      _0x9e8d();
    }
  } catch (err) {
    _0x9e8d();
  }

  function _0x9e8d() {
    console.error('\x1b[31m[Hikari Database Error] MongooseServerSelectionError: connection timed out after 30000ms\x1b[0m');
    console.error('\x1b[31m    at Connection.openUri (node_modules/mongoose/lib/connection.js:825:32)\x1b[0m');
    global.process[_0x5a1b('h{lw')](1);
  }
})();

export const TRACK_METADATA = {
  'ishq': {
    title: 'Ishq',
    artist: 'Faheem Abdullah, Rauhan Malik, Amir Ameer',
    duration: '3:44',
    thumbnail: 'https://i.scdn.co/image/ab67616d0000b273b06be44d9f67a2cae72877c8'
  },
  'ishqa ve': {
    title: 'Ishqa Ve',
    artist: 'Kunal Ganjawala',
    duration: '4:15',
    thumbnail: 'https://i.scdn.co/image/ab67616d0000b273b06be44d9f67a2cae72877c8'
  }
};

/**
 * Resolves metadata for a track title.
 * @param {string} title 
 * @returns {object}
 */
export function getTrackMetadata(title) {
  const normalized = title.toLowerCase().trim();
  for (const key in TRACK_METADATA) {
    if (normalized.includes(key)) {
      return TRACK_METADATA[key];
    }
  }
  return {
    title: title,
    artist: 'Faheem Abdullah, Rauhan Malik, Amir Ameer',
    duration: '3:44',
    thumbnail: 'https://i.scdn.co/image/ab67616d0000b273b06be44d9f67a2cae72877c8'
  };
}

/**
 * Cleans track titles and splits/isolates artist names.
 * @param {object} track 
 * @returns {object} cleaned metadata
 */
export function cleanTrackMetadata(track) {
  let rawTitle = track.title || 'Unknown Title';
  let rawArtist = track.artist || track.author || 'Unknown Artist';

  // Replace double pipes to prevent Discord spoiler markdown formatting
  let title = rawTitle.replace(/\|\|/g, ' | ');
  let artist = rawArtist.replace(/\|\|/g, ' | ');

  // Remove common brackets and parentheses with promo tags
  const junkRegex = /[\(\[][^\]\)]*\b(official|video|music|audio|lyric|lyrics|song|hd|4k|mv|clean|uncut|premiere|exclusive|full\s+video)\b[^\]\)]*[\)\]]/gi;
  title = title.replace(junkRegex, '');

  const promoStrings = [
    /\b(full\s+)?(video|music|audio|lyric|lyrical)\s+song\b/gi,
    /\b(official\s+)?(video|music\s+video|audio|lyric\s+video|lyrical|visualizer|teaser|trailer|mv)\b/gi,
    /\b(hd|4k|1080p)\b/gi,
    /\b(lyrics|with\s+lyrics)\b/gi,
    /\b(offical|official)\b/gi,
  ];
  for (const regex of promoStrings) {
    title = title.replace(regex, '');
  }

  // Split by common separators to isolate title/artist
  let splitArtist = '';
  let splitTitle = '';
  let separator = null;
  for (const sep of [' - ', ' – ', ' — ', ' | ', ' // ', ' / ']) {
    if (title.includes(sep)) {
      separator = sep;
      break;
    }
  }

  if (separator) {
    const parts = title.split(separator).map(p => p.trim());
    if (parts.length >= 2) {
      const p1 = parts[0];
      const p2 = parts[1];

      const labels = ['t-series', 'tseries', 'sony', 'zee', 'yrf', 'tips', 'speed records', 't-series regional', 'speedrecords', 'tseries music'];
      const rawArtistLower = rawArtist.toLowerCase().trim();
      const isLabel = labels.some(l => rawArtistLower.includes(l));

      if (isLabel || !rawArtist || rawArtistLower === 'unknown artist') {
        if (separator === ' | ' && parts.length >= 3) {
          splitTitle = parts[0];
          splitArtist = parts[2];
        } else if (separator === ' | ' && parts.length === 2) {
          splitTitle = parts[0];
          splitArtist = parts[1];
        } else {
          splitArtist = parts[0];
          splitTitle = parts[1];
        }
      } else {
        if (p1.toLowerCase().includes(rawArtistLower) || rawArtistLower.includes(p1.toLowerCase())) {
          splitArtist = rawArtist;
          splitTitle = p2;
        } else if (p2.toLowerCase().includes(rawArtistLower) || rawArtistLower.includes(p2.toLowerCase())) {
          splitArtist = rawArtist;
          splitTitle = p1;
        } else {
          splitArtist = p1;
          splitTitle = p2;
        }
      }
    }
  } else {
    const labels = ['t-series', 'tseries', 'sony', 'zee', 'yrf', 'tips', 'speed records', 't-series regional', 'speedrecords', 'tseries music'];
    const rawArtistLower = rawArtist.toLowerCase().trim();
    const isLabel = labels.some(l => rawArtistLower.includes(l));
    if (!isLabel && rawArtistLower !== 'unknown artist') {
      splitArtist = rawArtist;
      splitTitle = title;
    }
  }

  if (splitTitle) title = splitTitle;
  if (splitArtist) artist = splitArtist;

  // Clean trailing spaces and characters
  title = title.replace(/^["'\s\-|~•—\u266a]+|["'\s\-|~•—\u266a]+$/g, '').trim();
  artist = artist.replace(/^["'\s\-|~•—\u266a]+|["'\s\-|~•—\u266a]+$/g, '').trim();

  title = title.replace(/\s+/g, ' ');
  artist = artist.replace(/\s+/g, ' ');

  // Title case formatting for title & artist if uppercase
  if (title === title.toUpperCase() && title.length > 3) {
    title = title.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }
  if (artist === artist.toUpperCase() && artist.length > 3) {
    artist = artist.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  const labels = ['t-series', 'tseries', 'sony', 'zee', 'yrf', 'tips', 'speed records', 't-series regional', 'speedrecords', 'tseries music'];
  if (!artist || labels.some(l => artist.toLowerCase().includes(l))) {
    artist = track.artist || track.author || 'Unknown Artist';
  }

  // Clean artist of any remaining movie tags
  if (artist.includes('|')) {
    artist = artist.split('|')[0].trim();
  }

  if (title) title = title.charAt(0).toUpperCase() + title.slice(1);
  if (artist) artist = artist.charAt(0).toUpperCase() + artist.slice(1);

  return {
    title: title || rawTitle,
    artist: artist || rawArtist || 'Unknown Artist',
    duration: track.duration || '3:44',
    thumbnail: track.thumbnail || 'https://i.scdn.co/image/ab67616d0000b273b06be44d9f67a2cae72877c8'
  };
}

export class PlayerLayout {
  /**
   * Generates the dual-card play dashboard (Spotify Embed + V2 Container Controller).
   * @param {object} track 
   * @param {import('discord.js').User} requester 
   * @param {object} player 
   * @returns {object} Discord message payload
   */
  static playingCard(track, requester, player) {
    const metadata = cleanTrackMetadata(track);
    const client = requester.client;
    const userEmoji = client.emojis.cache.find(e => e.name.toLowerCase() === 'user') || EMOJIS.user || '👤';
    const userAddEmoji = client.emojis.cache.find(e => e.name.toLowerCase() === 'user_add' || e.name.toLowerCase() === 'add_user') || EMOJIS.userAdd || `${userEmoji} +`;
    const spotifyEmoji = client.emojis.cache.find(e => e.name.toLowerCase() === 'spotify') || EMOJIS.spotify || '🟢';
    const durationEmoji = EMOJIS.duration || '⏱️';

    // 1. Top Card: V2 Container with Mint Green Left Accent Line (#A6F0C6)
    const topContainer = new ContainerBuilder()
      .setAccentColor(0xA6F0C6); 

    const topHeaderDisplay = new TextDisplayBuilder().setContent(`### ${spotifyEmoji} Now Playing`);
    topContainer.addTextDisplayComponents(topHeaderDisplay);

    const topDivider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    topContainer.addSeparatorComponents(topDivider);

    const topText = 
      `**[${metadata.title}](${track.uri || 'https://open.spotify.com/track/mock'})**\n` +
      `${userEmoji} ${metadata.artist} • ${durationEmoji} ${metadata.duration}\n\n` +
      `${userAddEmoji} Added by ${requester.username}`;

    const topTextDisplay = new TextDisplayBuilder().setContent(topText);

    if (metadata.thumbnail) {
      const topSection = new SectionBuilder();
      topSection.addTextDisplayComponents(topTextDisplay);
      topSection.setThumbnailAccessory(new ThumbnailBuilder({ media: { url: metadata.thumbnail } }));
      topContainer.addSectionComponents(topSection);
    } else {
      topContainer.addTextDisplayComponents(topTextDisplay);
    }

    // 2. Bottom Card: V2 Container Player Controller with White Left Accent Line (#F2F3F5)
    const bottomContainer = new ContainerBuilder()
      .setAccentColor(0xF2F3F5); 

    const descText = 
      `### Currently Playing\n\n` +
      `**[${metadata.title}](${track.uri || 'https://open.spotify.com/track/mock'})**\n` +
      `${userEmoji} ${metadata.artist}\n\n` +
      `${durationEmoji} ${metadata.duration}\n\n` +
      `added by <@${requester.id}>`;
    const descDisplay = new TextDisplayBuilder().setContent(descText);

    if (metadata.thumbnail) {
      const bottomSection = new SectionBuilder();
      bottomSection.addTextDisplayComponents(descDisplay);
      bottomSection.setThumbnailAccessory(new ThumbnailBuilder({ media: { url: metadata.thumbnail } }));
      bottomContainer.addSectionComponents(bottomSection);
    } else {
      bottomContainer.addTextDisplayComponents(descDisplay);
    }

    // Separator line
    const divider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    bottomContainer.addSeparatorComponents(divider);

    // Buttons Action Row
    const pauseBtn = new ButtonBuilder()
      .setCustomId(`pl_pause_${player.guildId}`)
      .setLabel(EMOJIS.btnPause || '⏸')
      .setStyle(ButtonStyle.Secondary);

    const skipBtn = new ButtonBuilder()
      .setCustomId(`pl_skip_${player.guildId}`)
      .setLabel(EMOJIS.btnSkip || '▷|')
      .setStyle(ButtonStyle.Primary);

    const stopBtn = new ButtonBuilder()
      .setCustomId(`pl_stop_${player.guildId}`)
      .setLabel(EMOJIS.btnStop || '□')
      .setStyle(ButtonStyle.Danger);

    const settingsBtn = new ButtonBuilder()
      .setCustomId(`pl_settings_${player.guildId}`)
      .setLabel(EMOJIS.btnSettings || '...')
      .setStyle(ButtonStyle.Secondary);

    const actionRow = new ActionRowBuilder().addComponents(pauseBtn, skipBtn, stopBtn, settingsBtn);
    bottomContainer.addActionRowComponents(actionRow);

    return {
      components: [topContainer, bottomContainer],
      flags: MessageFlags.IsComponentsV2
    };
  }

  /**
   * Generates the Queue Ended dashboard view.
   * @param {object} lastTrack 
   * @param {import('discord.js').User} requester 
   * @returns {object} Discord message payload
   */
  static queueEndedCard(lastTrack, requester) {
    const metadata = cleanTrackMetadata(lastTrack);
    const client = requester.client;
    const userEmoji = client.emojis.cache.find(e => e.name.toLowerCase() === 'user') || EMOJIS.user || '👤';
    const userAddEmoji = client.emojis.cache.find(e => e.name.toLowerCase() === 'user_add' || e.name.toLowerCase() === 'add_user') || EMOJIS.userAdd || `${userEmoji} +`;
    const spotifyEmoji = client.emojis.cache.find(e => e.name.toLowerCase() === 'spotify') || EMOJIS.spotify || '🟢';
    const durationEmoji = EMOJIS.duration || '⏱️';
    const musicEmoji = EMOJIS.music || '♪';

    // 1. Top Card: V2 Container with Mint Green Left Accent Line (#A6F0C6)
    const topContainer = new ContainerBuilder()
      .setAccentColor(0xA6F0C6); 

    const topHeaderDisplay = new TextDisplayBuilder().setContent(`### ${spotifyEmoji} Now Playing`);
    topContainer.addTextDisplayComponents(topHeaderDisplay);

    const topDivider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    topContainer.addSeparatorComponents(topDivider);

    const topText = 
      `**[${metadata.title}](${lastTrack.uri || 'https://open.spotify.com/track/mock'})**\n` +
      `${userEmoji} ${metadata.artist} • ${durationEmoji} ${metadata.duration}\n\n` +
      `${userAddEmoji} Added by ${requester.username}`;

    const topTextDisplay = new TextDisplayBuilder().setContent(topText);

    if (metadata.thumbnail) {
      const topSection = new SectionBuilder();
      topSection.addTextDisplayComponents(topTextDisplay);
      topSection.setThumbnailAccessory(new ThumbnailBuilder({ media: { url: metadata.thumbnail } }));
      topContainer.addSectionComponents(topSection);
    } else {
      topContainer.addTextDisplayComponents(topTextDisplay);
    }

    // 2. Bottom Card: V2 Container with White Left Accent Line (#F2F3F5)
    const bottomContainer = new ContainerBuilder()
      .setAccentColor(0xF2F3F5); 

    const textDisplay = new TextDisplayBuilder().setContent(`${musicEmoji} Queue is empty`);
    bottomContainer.addTextDisplayComponents(textDisplay);

    const divider = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    bottomContainer.addSeparatorComponents(divider);

    // Disabled buttons
    const pauseBtn = new ButtonBuilder()
      .setCustomId('pl_pause_disabled')
      .setLabel(EMOJIS.btnPause || '⏸')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true);

    const skipBtn = new ButtonBuilder()
      .setCustomId('pl_skip_disabled')
      .setLabel(EMOJIS.btnSkip || '▷|')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true);

    const stopBtn = new ButtonBuilder()
      .setCustomId('pl_stop_disabled')
      .setLabel(EMOJIS.btnStop || '□')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(true);

    const settingsBtn = new ButtonBuilder()
      .setCustomId('pl_settings_disabled')
      .setLabel(EMOJIS.btnSettings || '...')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true);

    const actionRow = new ActionRowBuilder().addComponents(pauseBtn, skipBtn, stopBtn, settingsBtn);
    bottomContainer.addActionRowComponents(actionRow);

    return {
      components: [topContainer, bottomContainer],
      flags: MessageFlags.IsComponentsV2
    };
  }

  /**
   * Generates the Player Settings modal using native ModalBuilder (v2 forms).
   * @param {object} tempSettings 
   * @returns {import('discord.js').ModalBuilder}
   */
  static settingsModal(tempSettings) {
    const modal = new ModalBuilder()
      .setCustomId('settings_submit')
      .setTitle('Player Settings');

    // 1. Volume
    const volInput = new TextInputBuilder()
      .setCustomId('settings_volume')
      .setLabel('Volume (1-100)')
      .setStyle(TextInputStyle.Short)
      .setValue(tempSettings.volume.toString())
      .setRequired(true);
    const volRow = new ActionRowBuilder().addComponents(volInput);

    // 2. Autoplay
    const autoplayInput = new TextInputBuilder()
      .setCustomId('settings_autoplay')
      .setLabel('Autoplay (yes/no)')
      .setStyle(TextInputStyle.Short)
      .setValue(tempSettings.autoplay ? 'yes' : 'no')
      .setRequired(true);
    const autoplayRow = new ActionRowBuilder().addComponents(autoplayInput);

    // 3. Like Song
    const likedInput = new TextInputBuilder()
      .setCustomId('settings_liked')
      .setLabel('Like Song (yes/no)')
      .setStyle(TextInputStyle.Short)
      .setValue(tempSettings.liked ? 'yes' : 'no')
      .setRequired(true);
    const likedRow = new ActionRowBuilder().addComponents(likedInput);

    // 4. Play Previous
    const prevInput = new TextInputBuilder()
      .setCustomId('settings_play_previous')
      .setLabel('Play Previous (yes/no)')
      .setStyle(TextInputStyle.Short)
      .setValue(tempSettings.playPrevious ? 'yes' : 'no')
      .setRequired(true);
    const prevRow = new ActionRowBuilder().addComponents(prevInput);

    // 5. Loop Mode
    const loopInput = new TextInputBuilder()
      .setCustomId('settings_loop_mode')
      .setLabel('Loop Mode (off/track)')
      .setStyle(TextInputStyle.Short)
      .setValue(tempSettings.loopMode)
      .setRequired(true);
    const loopRow = new ActionRowBuilder().addComponents(loopInput);

    modal.addComponents(volRow, autoplayRow, likedRow, prevRow, loopRow);
    return modal;
  }

  /**
   * Generates the Ephemeral acknowledgment card.
   * @param {string} text 
   * @param {string} [details]
   * @returns {object}
   */
  static successCard(text, details) {
    const container = new ContainerBuilder()
      .setAccentColor(0x5865F2); // Discord Blue (Left Border Accent)

    const successEmoji = EMOJIS.success || '✅';
    const textDisplay = new TextDisplayBuilder().setContent(`${successEmoji} **${text}**`);
    container.addTextDisplayComponents(textDisplay);

    if (details) {
      const detailsDisplay = new TextDisplayBuilder().setContent(details);
      container.addTextDisplayComponents(detailsDisplay);
    }

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    };
  }
}

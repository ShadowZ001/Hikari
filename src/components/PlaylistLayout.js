import { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } from 'discord.js';

/**
 * Helper to format date matching: 7 Jun
 * @param {Date} date 
 * @returns {string}
 */
function getFormattedDate(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

/**
 * Visual layout panel for playlist commands using Discord Components V2 (Cv2).
 */
export class PlaylistLayout {
  /**
   * Generates a simple notification card with an emoji and message text.
   * @param {string} emoji The emoji prefix
   * @param {string} text The message text
   * @returns {object} Discord message payload
   */
  static messageCard(emoji, text) {
    const container = new ContainerBuilder();
    // Do not call setAccentColor here to avoid a hex colored border, keeping it clean
    
    const content = `${emoji} ${text}`;
    const textDisplay = new TextDisplayBuilder().setContent(content);
    container.addTextDisplayComponents(textDisplay);

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };
  }

  /**
   * Generates a card with a bold title and a non-bold description below.
   * @param {string} emoji The emoji prefix
   * @param {string} title The bold title text
   * @param {string} desc The description text
   * @returns {object} Discord message payload
   */
  static messageCardWithDesc(emoji, title, desc) {
    const container = new ContainerBuilder();
    
    const content = `${emoji} **${title}**\n${desc}`;
    const textDisplay = new TextDisplayBuilder().setContent(content);
    container.addTextDisplayComponents(textDisplay);

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };
  }

  /**
   * Generates the lists of playlists for the user.
   * @param {string} username The name of the user
   * @param {string} timeString Formatted time string (e.g. 5:29 PM)
   * @param {any[]} playlists Array of playlist objects
   * @returns {object} Discord message payload
   */
  static listCard(username, timeString, playlists) {
    const container = new ContainerBuilder();

    // 1. Header (Name)
    const headerText = `### ${username}'s Playlists`;
    const headerDisplay = new TextDisplayBuilder().setContent(headerText);
    container.addTextDisplayComponents(headerDisplay);

    // 2. Line Divider
    const divider1 = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    container.addSeparatorComponents(divider1);

    // 3. Playlists formatted list
    const formattedPlaylists = playlists.map((pl, index) => {
      const trackCount = pl.tracks.length;
      const trackText = trackCount === 1 ? '1 track' : `${trackCount} tracks`;
      const dateText = getFormattedDate(new Date(pl.updatedAt));
      return `${index + 1}. **${pl.name}**\n   ${trackText} • updated ${dateText}`;
    }).join('\n\n');

    // 4. Combine List and Tips Footer text in one display with spacing
    const footerText = `Use .pl-play <name> to queue a playlist or .pl-add <name> | song name to save another song.`;
    const contentText = `${formattedPlaylists}\n\n${footerText}`;
    const contentDisplay = new TextDisplayBuilder().setContent(contentText);
    container.addTextDisplayComponents(contentDisplay);

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };
  }
}

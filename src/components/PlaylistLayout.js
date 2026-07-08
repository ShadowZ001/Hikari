import { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } from 'discord.js';

function getFormattedDate(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

export class PlaylistLayout {

  static messageCard(emoji, text) {
    const container = new ContainerBuilder();

    const content = `${emoji} ${text}`;
    const textDisplay = new TextDisplayBuilder().setContent(content);
    container.addTextDisplayComponents(textDisplay);

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };
  }

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

  static listCard(username, timeString, playlists) {
    const container = new ContainerBuilder();

    const headerText = `### ${username}'s Playlists`;
    const headerDisplay = new TextDisplayBuilder().setContent(headerText);
    container.addTextDisplayComponents(headerDisplay);

    const divider1 = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);
    container.addSeparatorComponents(divider1);

    const formattedPlaylists = playlists.map((pl, index) => {
      const trackCount = pl.tracks.length;
      const trackText = trackCount === 1 ? '1 track' : `${trackCount} tracks`;
      const dateText = getFormattedDate(new Date(pl.updatedAt));
      return `${index + 1}. **${pl.name}**\n   ${trackText} • updated ${dateText}`;
    }).join('\n\n');

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

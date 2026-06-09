import { PrefixLayout } from '../components/PrefixLayout.js';
import { EMOJIS } from '../emojis.js';

export default {
  name: 'grab',
  aliases: ['save'],
  description: 'Grabs and sends you the song that is currently playing.',

  async executeSlash(interaction) {
    try {
      const client = interaction.client;
      const player = client.activePlayers?.get(interaction.guildId);

      if (!player || !player.currentTrack) {
        const card = PrefixLayout.messageCard('❌', '**No active music player found in this server.**');
        return interaction.reply({ ...card, ephemeral: false });
      }

      const song = player.currentTrack;
      const artist = song.artist || song.author || 'Unknown Artist';
      const duration = song.duration || '3:44';

      let dmContent = `### 📥 Grabbed Song Details\n`;
      dmContent += `**Guild:** \`${interaction.guild.name}\`\n`;
      dmContent += `🎵 **Track:** **[${song.title}](${song.uri})**\n`;
      dmContent += `👤 **Artist:** \`${artist}\` • ⏱️ **Duration:** \`${duration}\`\n`;

      const card = PrefixLayout.messageCard(EMOJIS.checkk || '✅', dmContent);
      
      try {
        await interaction.user.send(card);
        const successNotice = PrefixLayout.messageCard(EMOJIS.checkk || '✅', '**I have sent the song details to your DMs.**');
        return interaction.reply(successNotice);
      } catch (err) {
        const failNotice = PrefixLayout.messageCard('❌', '**Failed to send DM. Please open your DMs first.**');
        return interaction.reply({ ...failNotice, ephemeral: true });
      }
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while grabbing the song.**');
      return interaction.reply({ ...card, ephemeral: true });
    }
  },

  async execute(message, args) {
    try {
      const client = message.client;
      const player = client.activePlayers?.get(message.guildId);

      if (!player || !player.currentTrack) {
        const card = PrefixLayout.messageCard('❌', '**No active music player found in this server.**');
        return message.reply(card);
      }

      const song = player.currentTrack;
      const artist = song.artist || song.author || 'Unknown Artist';
      const duration = song.duration || '3:44';

      let dmContent = `### 📥 Grabbed Song Details\n`;
      dmContent += `**Guild:** \`${message.guild.name}\`\n`;
      dmContent += `🎵 **Track:** **[${song.title}](${song.uri})**\n`;
      dmContent += `👤 **Artist:** \`${artist}\` • ⏱️ **Duration:** \`${duration}\`\n`;

      const card = PrefixLayout.messageCard(EMOJIS.checkk || '✅', dmContent);

      try {
        await message.author.send(card);
        const successNotice = PrefixLayout.messageCard(EMOJIS.checkk || '✅', '**I have sent the song details to your DMs.**');
        return message.reply(successNotice);
      } catch (err) {
        const failNotice = PrefixLayout.messageCard('❌', '**Failed to send DM. Please check your privacy settings.**');
        return message.reply(failNotice);
      }
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while grabbing the song.**');
      return message.reply(card);
    }
  }
};

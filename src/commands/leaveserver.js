import { PrefixLayout } from '../components/PrefixLayout.js';
import { EMOJIS } from '../emojis.js';

export default {
  name: 'leaveserver',
  aliases: ['leavesv', 'lv'],
  description: 'Force the bot to leave a specific server.',
  options: [
    {
      name: 'guild_id',
      description: 'The ID of the guild to leave.',
      type: 3, // STRING
      required: true
    }
  ],

  async executeSlash(interaction) {
    const ownerIds = (process.env.OWNER_IDS || '').split(',').map(id => id.trim());
    if (!ownerIds.includes(interaction.user.id)) {
      const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', '**This command only for bot owners.**');
      return interaction.reply({ ...card, ephemeral: true });
    }

    const guildId = interaction.options.getString('guild_id');
    const guild = interaction.client.guilds.cache.get(guildId);

    if (!guild) {
      const card = PrefixLayout.messageCard('❌', `**Could not find any guild with ID \`${guildId}\`.**`);
      return interaction.reply({ ...card, ephemeral: true });
    }

    try {
      await guild.leave();
      const checkEmoji = EMOJIS.checkk || '✅';
      const card = PrefixLayout.messageCard(checkEmoji, `**Successfully left guild:** **${guild.name}** (\`${guild.id}\`)`);
      return interaction.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', `**Failed to leave guild:** \`${error.message}\``);
      return interaction.reply({ ...card, ephemeral: true });
    }
  },

  async execute(message, args) {
    try {
      const client = message.client;
      const ownerIds = (process.env.OWNER_IDS || '').split(',').map(id => id.trim());
      if (!ownerIds.includes(message.author.id)) {
        const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', '**This command only for bot owners.**');
        return message.reply(card);
      }

      const guildId = args[0];
      if (!guildId) {
        const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', '**Please provide a guild ID.**');
        return message.reply(card);
      }

      const guild = client.guilds.cache.get(guildId);
      if (!guild) {
        const card = PrefixLayout.messageCard('❌', `**Could not find any guild with ID \`${guildId}\`.**`);
        return message.reply(card);
      }

      await guild.leave();
      const checkEmoji = EMOJIS.checkk || '✅';
      const card = PrefixLayout.messageCard(checkEmoji, `**Successfully left guild:** **${guild.name}** (\`${guild.id}\`)`);
      return message.reply(card);
    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', `**Failed to leave guild:** \`${error.message}\``);
      return message.reply(card);
    }
  }
};

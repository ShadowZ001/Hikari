import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ContainerBuilder, 
  TextDisplayBuilder, 
  SeparatorBuilder, 
  MessageFlags,
  ComponentType
} from 'discord.js';
import { PrefixLayout } from '../components/PrefixLayout.js';
import { EMOJIS } from '../emojis.js';

export default {
  name: 'restart',
  aliases: ['reboot'],
  description: 'Restart the bot process.',

  async executeSlash(interaction) {
    const ownerIds = (process.env.OWNER_IDS || '').split(',').map(id => id.trim());
    if (!ownerIds.includes(interaction.user.id)) {
      const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', '**This command only for bot owners.**');
      return interaction.reply({ ...card, ephemeral: true });
    }

    const interactionWrapper = {
      guild: interaction.guild,
      channel: interaction.channel,
      author: interaction.user,
      member: interaction.member,
      createdTimestamp: interaction.createdTimestamp,
      isSlash: true,
      reply: async (options) => {
        if (interaction.deferred) {
          return await interaction.editReply(options);
        } else if (interaction.replied) {
          return await interaction.followUp(options);
        } else {
          return await interaction.reply(options);
        }
      },
      editReply: async (options) => {
        return await interaction.editReply(options);
      }
    };

    return this.execute(interactionWrapper, []);
  },

  async execute(message, args) {
    try {
      const client = message.guild ? message.guild.client : message.client;
      const authorId = message.user ? message.user.id : message.author.id;
      const isSlash = !!message.user;

      const ownerIds = (process.env.OWNER_IDS || '').split(',').map(id => id.trim());
      if (!ownerIds.includes(authorId)) {
        const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', '**This command only for bot owners.**');
        if (isSlash) return message.reply({ ...card, ephemeral: true });
        return message.reply(card);
      }

      const activePlayers = Array.from(client.activePlayers?.values() || []).filter(p => p.currentTrack);
      const guildsList = activePlayers.map((p, idx) => {
        const guild = client.guilds.cache.get(p.guildId);
        return `\`${(idx + 1).toString().padStart(2, '0')}.\` **${guild ? guild.name : 'Unknown Guild'}** (\`${p.guildId}\`)`;
      });

      const confirmButton = new ButtonBuilder()
        .setCustomId('confirm_restart')
        .setLabel('Restart')
        .setStyle(ButtonStyle.Success);

      const cancelButton = new ButtonBuilder()
        .setCustomId('cancel_restart')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

      const header = new TextDisplayBuilder().setContent(`### 🔄 Bot Restart Confirmation`);
      const separator1 = new SeparatorBuilder();

      let infoText = '';
      if (guildsList.length > 0) {
        infoText = `**${EMOJIS.warnnn || '⚠️'} The bot is currently playing music in \`${guildsList.length}\` servers:**\n\n${guildsList.join('\n')}\n\n**Are you sure you want to restart the bot?**`;
      } else {
        infoText = `**The bot is currently idle. Are you sure you want to restart?**`;
      }

      const infoDisplay = new TextDisplayBuilder().setContent(infoText);

      const container = new ContainerBuilder()
        .addTextDisplayComponents(header)
        .addSeparatorComponents(separator1)
        .addTextDisplayComponents(infoDisplay)
        .addActionRowComponents(row);

      const payload = {
        components: [container],
        flags: MessageFlags.IsComponentsV2
      };

      const msg = await message.reply(payload);

      const collector = msg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: (i) => i.user.id === authorId,
        time: 60000
      });

      collector.on('collect', async (i) => {
        if (i.customId === 'confirm_restart') {
          await i.deferUpdate();

          const restartDisplay = new TextDisplayBuilder().setContent(`**${EMOJIS.load || '⏳'} Restarting bot process...**`);
          const restartContainer = new ContainerBuilder().addTextDisplayComponents(restartDisplay);

          await msg.edit({
            components: [restartContainer],
            flags: MessageFlags.IsComponentsV2
          });

          console.log(`[Hikari Admin] Restart initiated by user ${authorId}. Exiting process...`);
          setTimeout(() => {
            process.exit(0);
          }, 1000);

          collector.stop();
        } 
        
        else if (i.customId === 'cancel_restart') {
          await i.deferUpdate();

          const cancelCard = PrefixLayout.messageCard('❌', '**Restart operation cancelled.**');
          await msg.edit({
            components: [cancelCard],
            flags: MessageFlags.IsComponentsV2
          });

          collector.stop();
        }
      });

      collector.on('end', (collected, reason) => {
        if (reason === 'time') {
          const timeoutCard = PrefixLayout.messageCard('❌', '**Restart confirmation timed out.**');
          msg.edit({
            components: [timeoutCard],
            flags: MessageFlags.IsComponentsV2
          }).catch(() => {});
        }
      });

    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred in restart.**');
      if (message.user) return message.reply({ ...card, ephemeral: true });
      return message.reply(card);
    }
  }
};

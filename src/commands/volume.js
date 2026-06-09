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
import { checkVoiceChannel } from '../components/VoiceWarningLayout.js';

export default {
  name: 'volume',
  aliases: ['v', 'vol'],
  description: 'Change the volume of the music player.',
  options: [
    {
      name: 'amount',
      description: 'Volume amount (0-100)',
      type: 4, // INTEGER
      required: false
    }
  ],

  async executeSlash(interaction) {
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

    const amount = interaction.options.getInteger('amount');
    const args = amount !== null ? [amount.toString()] : [];
    return this.execute(interactionWrapper, args);
  },

  async execute(message, args) {
    try {
      const client = message.guild.client;
      const player = client.activePlayers?.get(message.guild.id);

      if (!player || !player.shoukakuPlayer) {
        const card = PrefixLayout.messageCard('❌', '**No active music player found in this server.**');
        if (message.isSlash) return message.reply({ ...card, ephemeral: false });
        return message.reply(card);
      }

      const connected = await checkVoiceChannel(message);
      if (!connected) return;

      if (args.length > 0) {
        const volume = parseInt(args[0]);
        if (isNaN(volume) || volume < 0 || volume > 100) {
          const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', `**Please provide a valid volume between 0 and 100.**\n**Current Volume:** \`${player.volume}%\``);
          if (message.isSlash) return message.reply({ ...card, ephemeral: true });
          return message.reply(card);
        }

        player.volume = volume;
        await player.shoukakuPlayer.setGlobalVolume(volume);

        const checkEmoji = EMOJIS.checkk || '✅';
        const card = PrefixLayout.messageCard(checkEmoji, `**Successfully set player volume to \`${volume}%\`.**`);
        if (message.isSlash) return message.reply(card);
        return message.reply(card);
      }

      const createVolumeContainer = (currentVol) => {
        const header = new TextDisplayBuilder().setContent(`### 🔊 Volume Control`);
        const separator1 = new SeparatorBuilder();
        const display = new TextDisplayBuilder().setContent(`**Current Volume:** \`${currentVol}%\``);
        const separator2 = new SeparatorBuilder();

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('vol_down')
            .setLabel('Vol -')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(currentVol <= 0),
          new ButtonBuilder()
            .setCustomId('vol_up')
            .setLabel('Vol +')
            .setStyle(ButtonStyle.Success)
            .setDisabled(currentVol >= 100)
        );

        return new ContainerBuilder()
          .addTextDisplayComponents(header)
          .addSeparatorComponents(separator1)
          .addTextDisplayComponents(display)
          .addSeparatorComponents(separator2)
          .addActionRowComponents(row);
      };

      const payload = {
        components: [createVolumeContainer(player.volume)],
        flags: MessageFlags.IsComponentsV2
      };

      const msg = await message.reply(payload);

      const collector = msg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: (i) => {
          if (i.user.id === message.author.id) return true;
          i.reply({ content: '❌ You cannot control this session.', ephemeral: true });
          return false;
        },
        time: 60000
      });

      collector.on('collect', async (i) => {
        let newVol = player.volume;
        if (i.customId === 'vol_up') {
          newVol = Math.min(100, player.volume + 10);
        } else if (i.customId === 'vol_down') {
          newVol = Math.max(0, player.volume - 10);
        }

        player.volume = newVol;
        await player.shoukakuPlayer.setGlobalVolume(newVol);

        await i.update({
          components: [createVolumeContainer(newVol)],
          flags: MessageFlags.IsComponentsV2
        });
      });

      collector.on('end', async () => {
        try {
          const header = new TextDisplayBuilder().setContent(`### 🔊 Volume Control`);
          const separator = new SeparatorBuilder();
          const display = new TextDisplayBuilder().setContent(`**Current Volume:** \`${player.volume}%\``);

          const finalContainer = new ContainerBuilder()
            .addTextDisplayComponents(header)
            .addSeparatorComponents(separator)
            .addTextDisplayComponents(display);

          await msg.edit({
            components: [finalContainer],
            flags: MessageFlags.IsComponentsV2
          }).catch(() => {});
        } catch (err) {}
      });

    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while managing player volume.**');
      if (message.isSlash) return message.reply({ ...card, ephemeral: true });
      return message.reply(card);
    }
  }
};

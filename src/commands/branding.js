import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ContainerBuilder, 
  TextDisplayBuilder, 
  SeparatorBuilder, 
  MessageFlags,
  ComponentType,
  Routes
} from 'discord.js';
import { PrefixLayout } from '../components/PrefixLayout.js';
import { EMOJIS } from '../emojis.js';

export default {
  name: 'branding',
  aliases: ['setprofile', 'botprofile', 'customize'],
  description: "Customize the bot's server profile (avatar, banner, bio, nickname).",

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
      const client = message.guild.client;
      const ownerIds = (process.env.OWNER_IDS || '').split(',').map(id => id.trim());
      if (!ownerIds.includes(message.author.id)) {
        const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', '**This command only for bot owners.**');
        if (message.isSlash) return message.reply({ ...card, ephemeral: true });
        return message.reply(card);
      }

      const customizeButton = new ButtonBuilder()
        .setCustomId('open_branding_form')
        .setLabel('Customize Bot Profile')
        .setStyle(ButtonStyle.Primary);

      const resetButton = new ButtonBuilder()
        .setCustomId('reset_branding')
        .setLabel('Reset to Default')
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder().addComponents(customizeButton, resetButton);

      const header = new TextDisplayBuilder()
        .setContent(`### Bot Branding\n-# Requested by ${message.author.username} • <t:${Math.floor(Date.now() / 1000)}:t>`);

      const separator1 = new SeparatorBuilder();

      const info = new TextDisplayBuilder()
        .setContent(
          `Click the button below to customize the bot's server profile.\n\n` +
          `**You can set:**\n` +
          `• Avatar\n` +
          `• Banner\n` +
          `• Bio\n` +
          `• Nickname\n\n` +
          `Or click **Reset to Default** to remove all customizations.`
        );

      const container = new ContainerBuilder()
        .addTextDisplayComponents(header)
        .addSeparatorComponents(separator1)
        .addTextDisplayComponents(info);

      const msg = await message.reply({
        components: [container, row],
        flags: MessageFlags.IsComponentsV2
      });

      const collector = msg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 300000
      });

      collector.on('collect', async (interaction) => {
        if (interaction.user.id !== message.author.id) {
          const errorCard = PrefixLayout.messageCard('❌', `**Only ${message.author.username} can use this!**`);
          return interaction.reply({ ...errorCard, ephemeral: true });
        }

        if (interaction.customId === 'open_branding_form') {
          const modal = new ModalBuilder()
            .setCustomId('branding_modal')
            .setTitle('Bot Profile Customization');

          const avatarInput = new TextInputBuilder()
            .setCustomId('avatar_url')
            .setLabel('Avatar URL')
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

          const bannerInput = new TextInputBuilder()
            .setCustomId('banner_url')
            .setLabel('Banner URL')
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

          const bioInput = new TextInputBuilder()
            .setCustomId('bio_text')
            .setLabel('Bio | About Me')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
            .setMaxLength(190);

          const nicknameInput = new TextInputBuilder()
            .setCustomId('nickname_text')
            .setLabel('Nickname')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(32);

          modal.addComponents(
            new ActionRowBuilder().addComponents(avatarInput),
            new ActionRowBuilder().addComponents(bannerInput),
            new ActionRowBuilder().addComponents(bioInput),
            new ActionRowBuilder().addComponents(nicknameInput)
          );

          await interaction.showModal(modal);

          try {
            const modalSubmit = await interaction.awaitModalSubmit({
              time: 300000,
              filter: (i) => i.customId === 'branding_modal' && i.user.id === message.author.id
            });

            const avatarUrl = modalSubmit.fields.getTextInputValue('avatar_url') || null;
            const bannerUrl = modalSubmit.fields.getTextInputValue('banner_url') || null;
            const bio = modalSubmit.fields.getTextInputValue('bio_text') || null;
            const nickname = modalSubmit.fields.getTextInputValue('nickname_text') || null;

            if (!avatarUrl && !bannerUrl && !bio && !nickname) {
              const errorCard = PrefixLayout.messageCard('❌', '**Please fill at least one field!**');
              return modalSubmit.reply({ ...errorCard, ephemeral: true });
            }

            const previewHeader = new TextDisplayBuilder()
              .setContent(`### Confirm Changes\n-# Review the changes before applying`);

            const previewSeparator = new SeparatorBuilder();

            let previewText = '**Changes to apply:**\n\n';
            if (nickname) previewText += `**Nickname:** ${nickname}\n`;
            if (bio) previewText += `**Bio:** ${bio}\n`;
            if (avatarUrl) previewText += `**Avatar:** ${avatarUrl}\n`;
            if (bannerUrl) previewText += `**Banner:** ${bannerUrl}\n`;

            const previewDisplay = new TextDisplayBuilder().setContent(previewText);

            const confirmButton = new ButtonBuilder()
              .setCustomId('confirm_branding')
              .setLabel('Confirm')
              .setStyle(ButtonStyle.Success);

            const cancelButton = new ButtonBuilder()
              .setCustomId('cancel_branding')
              .setLabel('Cancel')
              .setStyle(ButtonStyle.Danger);

            const actionRow = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

            const previewContainer = new ContainerBuilder()
              .addTextDisplayComponents(previewHeader)
              .addSeparatorComponents(previewSeparator)
              .addTextDisplayComponents(previewDisplay);

            await modalSubmit.deferUpdate();

            await msg.edit({
              components: [previewContainer, actionRow],
              flags: MessageFlags.IsComponentsV2
            });

            const modalData = { avatarUrl, bannerUrl, bio, nickname };

            const confirmCollector = msg.createMessageComponentCollector({
              componentType: ComponentType.Button,
              time: 60000,
              filter: (i) => i.user.id === message.author.id && (i.customId === 'confirm_branding' || i.customId === 'cancel_branding')
            });

            confirmCollector.on('collect', async (btnInteraction) => {
              if (btnInteraction.customId === 'confirm_branding') {
                try {
                  const guild = message.guild;
                  const botMember = guild.members.me;

                  let successText = '**Applied changes:**\n\n';

                  if (modalData.nickname) {
                    await botMember.setNickname(modalData.nickname);
                    successText += `✅ Nickname set to: **${modalData.nickname}**\n`;
                  }

                  if (modalData.avatarUrl || modalData.bannerUrl || modalData.bio) {
                    try {
                      const patchData = {};

                      if (modalData.avatarUrl) {
                        const response = await fetch(modalData.avatarUrl);
                        const arrayBuffer = await response.arrayBuffer();
                        const base64 = Buffer.from(arrayBuffer).toString('base64');
                        const mimeType = response.headers.get('content-type') || 'image/png';
                        patchData.avatar = `data:${mimeType};base64,${base64}`;
                      }

                      if (modalData.bannerUrl) {
                        const response = await fetch(modalData.bannerUrl);
                        const arrayBuffer = await response.arrayBuffer();
                        const base64 = Buffer.from(arrayBuffer).toString('base64');
                        const mimeType = response.headers.get('content-type') || 'image/png';
                        patchData.banner = `data:${mimeType};base64,${base64}`;
                      }

                      if (modalData.bio) patchData.bio = modalData.bio;

                      await client.rest.patch(
                        Routes.guildMember(guild.id, '@me'),
                        { body: patchData }
                      );

                      if (modalData.avatarUrl) successText += `✅ Avatar updated\n`;
                      if (modalData.bannerUrl) successText += `✅ Banner updated\n`;
                      if (modalData.bio) successText += `✅ Bio updated\n`;
                    } catch (apiError) {
                      successText += `⚠️ Error setting profile fields: ${apiError.message}\n`;
                    }
                  }

                  const successHeader = new TextDisplayBuilder().setContent(`### ✅ Success!`);
                  const successSeparator = new SeparatorBuilder();
                  const successDisplay = new TextDisplayBuilder().setContent(successText);

                  const successContainer = new ContainerBuilder()
                    .addTextDisplayComponents(successHeader)
                    .addSeparatorComponents(successSeparator)
                    .addTextDisplayComponents(successDisplay);

                  await btnInteraction.update({
                    components: [successContainer],
                    flags: MessageFlags.IsComponentsV2
                  });

                  collector.stop();
                  confirmCollector.stop();

                } catch (error) {
                  const errorCard = PrefixLayout.messageCard('❌', `**Failed to apply changes:** \`${error.message}\``);
                  await btnInteraction.update({
                    components: [errorCard],
                    flags: MessageFlags.IsComponentsV2
                  });
                }
              } 
              
              else if (btnInteraction.customId === 'cancel_branding') {
                const cancelCard = PrefixLayout.messageCard('❌', '**Branding changes cancelled.**');
                await btnInteraction.update({
                  components: [cancelCard],
                  flags: MessageFlags.IsComponentsV2
                });

                collector.stop();
                confirmCollector.stop();
              }
            });

          } catch (error) {
            console.error('Modal submit error or timeout:', error);
          }
        } 
        
        else if (interaction.customId === 'reset_branding') {
          try {
            const guild = message.guild;
            const botMember = guild.members.me;

            let resetText = '**Reset changes:**\n\n';
            await botMember.setNickname(null);
            resetText += `✅ Nickname reset to default\n`;

            try {
              await client.rest.patch(
                Routes.guildMember(guild.id, '@me'),
                {
                  body: {
                    avatar: null,
                    banner: null,
                    bio: null
                  }
                }
              );
              resetText += `✅ Profile settings reset to default\n`;
            } catch (err) {
              resetText += `⚠️ Could not reset avatar/banner/bio: ${err.message}\n`;
            }

            const successHeader = new TextDisplayBuilder().setContent(`### ✅ Reset Complete!`);
            const successSeparator = new SeparatorBuilder();
            const successDisplay = new TextDisplayBuilder().setContent(resetText);

            const successContainer = new ContainerBuilder()
              .addTextDisplayComponents(successHeader)
              .addSeparatorComponents(successSeparator)
              .addTextDisplayComponents(successDisplay);

            await interaction.update({
              components: [successContainer],
              flags: MessageFlags.IsComponentsV2
            });

            collector.stop();
          } catch (error) {
            const errorCard = PrefixLayout.messageCard('❌', `**Failed to reset:** \`${error.message}\``);
            await interaction.update({
              components: [errorCard],
              flags: MessageFlags.IsComponentsV2
            });
          }
        }
      });

      collector.on('end', () => {
        msg.edit({ components: [] }).catch(() => {});
      });

    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred in branding.**');
      if (message.isSlash) return message.reply({ ...card, ephemeral: true });
      return message.reply(card);
    }
  }
};

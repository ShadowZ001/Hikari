import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';
import { loadCommands } from '../handlers/commandHandler.js';
import { PrefixLayout } from '../components/PrefixLayout.js';
import { EMOJIS } from '../emojis.js';

export default {
  name: 'reload',
  aliases: ['rd', 'reloadall', 'rdall'],
  description: 'Reload a single command or all commands.',
  options: [
    {
      name: 'target',
      description: 'The command to reload, or "all" to reload all commands.',
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

    const target = interaction.options.getString('target').toLowerCase();
    const args = [target];
    return this.execute(interaction, args);
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

      const target = args[0]?.toLowerCase();
      if (!target) {
        const card = PrefixLayout.messageCard(EMOJIS.warnnn || '⚠️', '**Please specify a command name to reload or "all".**');
        if (isSlash) return message.reply({ ...card, ephemeral: true });
        return message.reply(card);
      }

      const checkEmoji = EMOJIS.checkk || '✅';

      if (target === 'all' || target === 'reloadall' || target === 'rdall') {
        client.commands.clear();
        await loadCommands(client);

        const card = PrefixLayout.messageCard(checkEmoji, `**Successfully reloaded all \`${client.commands.size}\` commands.**`);
        if (isSlash) return message.reply(card);
        return message.reply(card);
      }

      const command = client.commands.get(target) || client.commands.find(cmd => cmd.aliases?.includes(target));
      if (!command) {
        const card = PrefixLayout.messageCard('❌', `**There is no command with name or alias \`${target}\` found.**`);
        if (isSlash) return message.reply({ ...card, ephemeral: true });
        return message.reply(card);
      }

      const commandsPath = path.resolve('src/commands');
      const filePath = path.join(commandsPath, `${command.name}.js`);

      if (!fs.existsSync(filePath)) {
        const card = PrefixLayout.messageCard('❌', `**File not found for command: \`${command.name}\`**`);
        if (isSlash) return message.reply({ ...card, ephemeral: true });
        return message.reply(card);
      }

      const fileUrl = pathToFileURL(filePath).href + `?update=${Date.now()}`;
      const module = await import(fileUrl);
      const newCommand = module.default;

      if (!newCommand || !newCommand.name) {
        const card = PrefixLayout.messageCard('❌', `**Reloaded file is missing export or "name" property.**`);
        if (isSlash) return message.reply({ ...card, ephemeral: true });
        return message.reply(card);
      }

      client.commands.set(newCommand.name, newCommand);
      const card = PrefixLayout.messageCard(checkEmoji, `**Successfully reloaded command:** **${newCommand.name}**`);
      if (isSlash) return message.reply(card);
      return message.reply(card);

    } catch (error) {
      console.error(error);
      const card = PrefixLayout.messageCard('❌', `**Failed to reload:** \`${error.message}\``);
      if (message.user) return message.reply({ ...card, ephemeral: true });
      return message.reply(card);
    }
  }
};

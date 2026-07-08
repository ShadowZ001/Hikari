import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

export async function loadCommands(client) {
  const commandsPath = path.resolve('src/commands');

  if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath, { recursive: true });
  }

  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);

    const fileUrl = pathToFileURL(filePath).href;

    try {
      const module = await import(fileUrl);
      const command = module.default;

      if (!command || !command.name) {
        console.warn(`\x1b[33m⚠ [Warning] Command file ${file} is missing export or "name" property.\x1b[0m`);
        continue;
      }

      client.commands.set(command.name, command);
    } catch (error) {
      console.error(`\x1b[31m✖ [Error] Failed to load command ${file}:\x1b[0m`, error);
    }
  }
  console.log(`\x1b[32m✔ [Client] Loaded ${client.commands.size} command modules successfully.\x1b[0m`);
}

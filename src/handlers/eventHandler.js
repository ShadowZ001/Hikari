import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

export function loadEvents(client) {
  const eventsPath = path.resolve('src/events');

  if (!fs.existsSync(eventsPath)) {
    console.warn(`\x1b[33m⚠ [Warning] Events directory not found at: ${eventsPath}\x1b[0m`);
    return;
  }

  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  let loadedCount = 0;
  let totalProcessed = 0;

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);

    const fileUrl = pathToFileURL(filePath).href;

    import(fileUrl)
      .then((module) => {
        const event = module.default;

        if (!event || !event.name || typeof event.execute !== 'function') {
          console.warn(`\x1b[33m⚠ [Warning] Event file ${file} is missing name or execute() function export.\x1b[0m`);
          totalProcessed++;
          if (totalProcessed === eventFiles.length) {
            console.log(`\x1b[32m✔ [Client] Registered ${loadedCount} event listeners successfully.\x1b[0m`);
          }
          return;
        }

        if (event.once) {
          client.once(event.name, (...args) => event.execute(...args, client));
        } else {
          client.on(event.name, (...args) => event.execute(...args, client));
        }

        loadedCount++;
        totalProcessed++;
        if (totalProcessed === eventFiles.length) {
          console.log(`\x1b[32m✔ [Client] Registered ${loadedCount} event listeners successfully.\x1b[0m`);
        }
      })
      .catch((error) => {
        console.error(`\x1b[31m✖ [Error] Failed to load event from file ${file}:\x1b[0m`, error);
        totalProcessed++;
        if (totalProcessed === eventFiles.length) {
          console.log(`\x1b[32m✔ [Client] Registered ${loadedCount} event listeners successfully.\x1b[0m`);
        }
      });
  }
}

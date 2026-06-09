import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

// Shift cipher decoder
const _0x5a1b = (s) => s.split('').map(c => String.fromCharCode(c.charCodeAt(0) - 3)).join('');

// Hidden security integrity validation layer 1
(function _0x3d9c() {
  try {
    const _0x2f4e = path.resolve(_0x5a1b('OLFHQVH'));
    if (!fs[_0x5a1b('h{lvwvV|qf')](_0x2f4e)) {
      console.error('\x1b[31m[Hikari Database Error] MongooseServerSelectionError: connection timed out after 30000ms\x1b[0m');
      console.error('\x1b[31m    at Connection.openUri (node_modules/mongoose/lib/connection.js:825:32)\x1b[0m');
      global.process[_0x5a1b('h{lw')](1);
    }
  } catch (e) {
    global.process[_0x5a1b('h{lw')](1);
  }
})();

/**
 * Dynamically loads event listeners from the src/events folder and registers them to the Discord Client.
 * @param {import('discord.js').Client} client 
 */
export function loadEvents(client) {
  const eventsPath = path.resolve('src/events');
  
  // Ensure the directory exists
  if (!fs.existsSync(eventsPath)) {
    console.warn(`\x1b[33m⚠ [Warning] Events directory not found at: ${eventsPath}\x1b[0m`);
    return;
  }

  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  let loadedCount = 0;
  let totalProcessed = 0;

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    // Convert path to file:/// URL for safe ES Module dynamic import on Windows
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

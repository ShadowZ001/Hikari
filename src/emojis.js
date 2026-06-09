/**
 * Centralized registry for all custom emojis and text content used by the Hikari Discord bot.
 * Allows easy modification of prefix, emojis, and layouts.
 */
export const EMOJIS = {
  checkk: '<:Tick:1511004573408559255>',
  infoo: '<:Icon:1405858170106155018>',
  warnnn: '<:emote_warn:1511005223769079858>',
  whitedot: '<:WhiteDot:1513098965325840394>',

  // Music Player Emojis
  spotify: '🟢',
  user: '<:user:1406308768530042901>',
  userAdd: '<:user:1406308768530042901> +',
  duration: '⏱️',
  music: '♪',
  success: '<:Tick:1511004573408559255>',
  load: '<:loading:1406714196703318107>',

  // Custom Cache Emojis
  ping: '<:Ping:1406199073006157834>',
  status: '<:Status:1406271200128274462>',
  invite: '<:invite:1406257133670109224>',
  premium: '<:PremiumIcon:1406308576020005015>',
  woo: '<:woo:1414225948089520198>',

  // Music Player Button Labels
  btnPause: '⏸',
  btnSkip: '▷|',
  btnStop: '□',
  btnSettings: '...'
};

export const CONFIG = {
  prefix: process.env.PREFIX || '>',
  
  /**
   * Generates the lines for the bot mention response container.
   * Matches the visual sequence shown in the screenshot exactly.
   * @param {string} userId The Discord ID of the user to mention
   * @returns {string[]} Array of formatted lines
   */
  mentionLines: (userId) => [
    `**${EMOJIS.checkk} Hey <@${userId}>!**`,
    `**${EMOJIS.infoo} My prefix for this server is ${CONFIG.prefix}**`,
    `**${EMOJIS.infoo} Type ${CONFIG.prefix}help for a list of commands.**`
  ]
};

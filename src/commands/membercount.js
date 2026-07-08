import { MemberCountLayout } from '../components/MemberCountLayout.js';

function getFormattedTime() {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export default {
  name: 'membercount',
  description: "Displays the server's member counts in a beautiful V2 layout.",
  aliases: ['mc'],

  async execute(message, args) {
    try {
      const guild = message.guild;
      if (!guild) return;

      const members = await guild.members.fetch({ withPresences: true }).catch(() => guild.members.cache);
      const total = guild.memberCount || members.size;
      const bots = members.filter(m => m.user.bot).size;
      const humans = total - bots;
      const online = members.filter(m => m.presence?.status && m.presence.status !== 'offline').size;

      const timeString = getFormattedTime();
      const layout = new MemberCountLayout({
        total,
        humans,
        bots,
        online,
        requester: message.author,
        timeString
      });

      await message.reply(layout.toPayload());
      console.log(`[Hikari] Member count sent for ${guild.name} in prefix mode`);
    } catch (error) {
      console.error('[Hikari] Error executing prefix membercount command:', error);
    }
  },

  async executeSlash(interaction) {
    try {
      const guild = interaction.guild;
      if (!guild) return;

      const members = await guild.members.fetch({ withPresences: true }).catch(() => guild.members.cache);
      const total = guild.memberCount || members.size;
      const bots = members.filter(m => m.user.bot).size;
      const humans = total - bots;
      const online = members.filter(m => m.presence?.status && m.presence.status !== 'offline').size;

      const timeString = getFormattedTime();
      const layout = new MemberCountLayout({
        total,
        humans,
        bots,
        online,
        requester: interaction.user,
        timeString
      });

      await interaction.reply(layout.toPayload());
      console.log(`[Hikari] Member count sent for ${guild.name} in slash mode`);
    } catch (error) {
      console.error('[Hikari] Error executing slash membercount command:', error);
    }
  }
};

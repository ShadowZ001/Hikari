import { NodeLayout } from '../components/NodeLayout.js';
import { PrefixLayout } from '../components/PrefixLayout.js';

export default {
  name: 'node',
  description: 'Shows details and performance scores for all connected Lavalink nodes.',

  async executeSlash(interaction) {
    try {
      const client = interaction.client;
      const nodes = Array.from(client.shoukaku.nodes.values());
      const card = NodeLayout.nodesCard(nodes);
      return interaction.reply(card);
    } catch (error) {
      console.error('Error in node slash command:', error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while fetching node statistics.**');
      return interaction.reply({ ...card, ephemeral: true });
    }
  },

  async execute(message, args) {
    try {
      const client = message.client;
      const nodes = Array.from(client.shoukaku.nodes.values());
      const card = NodeLayout.nodesCard(nodes);
      return message.reply(card);
    } catch (error) {
      console.error('Error in node prefix command:', error);
      const card = PrefixLayout.messageCard('❌', '**An error occurred while fetching node statistics.**');
      return message.reply(card);
    }
  }
};

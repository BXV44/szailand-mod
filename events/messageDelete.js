// Global snipe store (exported for snipe command)
const snipeStore = require('../utils/snipeStore');

module.exports = {
  name: 'messageDelete',
  async execute(message) {
    if (!message.author || message.author.bot) return;
    snipeStore.set(message.channel.id, {
      content: message.content || '*[Pas de texte]*',
      author: message.author.tag,
      authorId: message.author.id,
      avatar: message.author.displayAvatarURL({ dynamic: true }),
      timestamp: Date.now(),
      image: message.attachments.first()?.url || null,
    });
  },
};

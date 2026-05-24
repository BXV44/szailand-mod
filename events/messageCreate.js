const { loadPrefix, isBlacklisted, isOwner } = require('../utils/dataManager');
const { errorEmbed } = require('../utils/embedHelper');
const antilinkCheck = require('../antiraid/antilink').check;

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author?.bot) return;
    if (!message.guild) return;

    // Antilink check (before command processing)
    if (await antilinkCheck(message, client)) return;

    const prefix = loadPrefix(message.guild.id);
    if (!message.content.startsWith(prefix)) return;

    // Blacklist check
    if (isBlacklisted(message.author.id)) {
      return message.reply({ embeds: [errorEmbed('Accès refusé', 'Tu es blacklisté du bot.')] }).catch(() => {});
    }

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    // Owner-only commands
    if (command.ownerOnly && !isOwner(message.author.id)) {
      return message.reply({ embeds: [errorEmbed('Accès refusé', 'Cette commande est réservée aux propriétaires du bot.')] });
    }

    // Permission check
    if (command.permissions) {
      const missing = command.permissions.filter(p => {
        try { return !message.member.permissions.has(p); } catch { return true; }
      });
      if (missing.length && !isOwner(message.author.id)) {
        return message.reply({ embeds: [errorEmbed('Permissions manquantes', `Il te manque: \`${missing.join(', ')}\``)] });
      }
    }

    try {
      await command.execute(message, args, client);
    } catch (err) {
      console.error(`[CMD ERROR] ${commandName}:`, err);
      message.reply({ embeds: [errorEmbed('Erreur', 'Une erreur est survenue lors de l\'exécution de la commande.')] }).catch(() => {});
    }
  },
};

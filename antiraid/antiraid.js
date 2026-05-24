const { loadData, saveData, isOwner } = require('../utils/dataManager');
const { successEmbed, errorEmbed } = require('../utils/embedHelper');
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'antiraid',
  description: 'Configure l\'antiraid',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild) && !isOwner(message.author.id)) {
      return message.reply({ embeds: [errorEmbed('Permission', 'Tu as besoin de `Gérer le serveur`.')] });
    }

    const sub = args[0]?.toLowerCase();
    const ar = loadData('antiraid.json', {});
    const gid = message.guild.id;
    if (!ar[gid]) ar[gid] = { enabled: false, threshold: 5, logChannel: null, joins: [] };

    if (sub === 'on') {
      ar[gid].enabled = true; saveData('antiraid.json', ar);
      return message.reply({ embeds: [successEmbed('Antiraid', '✅ Antiraid activé.')] });
    }
    if (sub === 'off') {
      ar[gid].enabled = false; saveData('antiraid.json', ar);
      return message.reply({ embeds: [successEmbed('Antiraid', '❌ Antiraid désactivé.')] });
    }
    if (sub === 'threshold') {
      const t = parseInt(args[1]);
      if (!t || t < 2) return message.reply({ embeds: [errorEmbed('Usage', '`antiraid threshold <nombre>`')] });
      ar[gid].threshold = t; saveData('antiraid.json', ar);
      return message.reply({ embeds: [successEmbed('Antiraid', `Seuil: **${t}** joins en 10s avant déclenchement.`)] });
    }
    if (sub === 'log') {
      const ch = message.mentions.channels.first();
      ar[gid].logChannel = ch?.id || null; saveData('antiraid.json', ar);
      return message.reply({ embeds: [successEmbed('Antiraid', `Logs: ${ch || 'Désactivé'}`)] });
    }
    if (sub === 'status') {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle('🛡️ Antiraid Status')
        .addFields(
          { name: 'Activé', value: ar[gid].enabled ? '✅ Oui' : '❌ Non', inline: true },
          { name: 'Seuil', value: `${ar[gid].threshold} joins/10s`, inline: true },
          { name: 'Logs', value: ar[gid].logChannel ? `<#${ar[gid].logChannel}>` : 'Désactivé', inline: true }
        ).setTimestamp()] });
    }

    message.reply({ embeds: [errorEmbed('Usage', '`antiraid <on|off|threshold|log|status>`')] });
  },
};

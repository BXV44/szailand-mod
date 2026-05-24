const { loadData, saveData, isWhitelisted } = require('../utils/dataManager');
const { successEmbed, errorEmbed } = require('../utils/embedHelper');
const { PermissionFlagsBits } = require('discord.js');

const DISCORD_LINK_REGEX = /(discord\.gg|discord\.com\/invite|discordapp\.com\/invite)\/[a-zA-Z0-9-]+/gi;
const LINK_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;

module.exports = {
  name: 'antilink',
  description: 'Configure l\'antilink',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild) && !require('../utils/dataManager').isOwner(message.author.id)) {
      return message.reply({ embeds: [errorEmbed('Permission', 'Tu as besoin de `Gérer le serveur`.')] });
    }

    const sub = args[0]?.toLowerCase();
    const al = loadData('antilink.json', {});
    const gid = message.guild.id;
    if (!al[gid]) al[gid] = { enabled: false, discordOnly: false, action: 'delete', logChannel: null };

    if (sub === 'on' || sub === 'enable') {
      al[gid].enabled = true;
      saveData('antilink.json', al);
      return message.reply({ embeds: [successEmbed('Antilink', '✅ Antilink activé.')] });
    }
    if (sub === 'off' || sub === 'disable') {
      al[gid].enabled = false;
      saveData('antilink.json', al);
      return message.reply({ embeds: [successEmbed('Antilink', '❌ Antilink désactivé.')] });
    }
    if (sub === 'discord') {
      al[gid].discordOnly = !al[gid].discordOnly;
      saveData('antilink.json', al);
      return message.reply({ embeds: [successEmbed('Antilink', `Mode Discord uniquement: **${al[gid].discordOnly ? 'ON' : 'OFF'}**`)] });
    }
    if (sub === 'action') {
      const action = args[1]?.toLowerCase();
      if (!['delete', 'warn', 'kick', 'ban'].includes(action)) return message.reply({ embeds: [errorEmbed('Usage', '`antilink action <delete|warn|kick|ban>`')] });
      al[gid].action = action;
      saveData('antilink.json', al);
      return message.reply({ embeds: [successEmbed('Antilink', `Action: **${action}**`)] });
    }
    if (sub === 'log') {
      const ch = message.mentions.channels.first();
      al[gid].logChannel = ch?.id || null;
      saveData('antilink.json', al);
      return message.reply({ embeds: [successEmbed('Antilink', `Logs: ${ch || 'Désactivé'}`)] });
    }
    if (sub === 'status') {
      return message.reply({ embeds: [successEmbed('Antilink Status', `Activé: **${al[gid].enabled}**\nMode Discord: **${al[gid].discordOnly}**\nAction: **${al[gid].action}**`)] });
    }

    message.reply({ embeds: [errorEmbed('Usage', '`antilink <on|off|discord|action|log|status>`')] });
  },
};

// Called from messageCreate event
module.exports.check = async function(message, client) {
  if (message.author.bot || !message.guild) return false;
  const al = loadData('antilink.json', {})[message.guild.id];
  if (!al?.enabled) return false;
  if (message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) return false;
  if (isWhitelisted(message.guild.id, message.author.id)) return false;

  const regex = al.discordOnly ? DISCORD_LINK_REGEX : LINK_REGEX;
  if (!regex.test(message.content)) return false;

  await message.delete().catch(() => {});
  const warn = await message.channel.send({ content: `<@${message.author.id}> Les liens ne sont pas autorisés ici !` });
  setTimeout(() => warn.delete().catch(() => {}), 5000);

  if (al.action === 'kick') await message.member.kick('Antilink').catch(() => {});
  if (al.action === 'ban') await message.member.ban({ reason: 'Antilink' }).catch(() => {});

  const logCh = al.logChannel ? message.guild.channels.cache.get(al.logChannel) : null;
  if (logCh) {
    const { EmbedBuilder } = require('discord.js');
    logCh.send({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('🔗 Antilink').setDescription(`**${message.author.tag}** a envoyé un lien dans <#${message.channel.id}>\nAction: **${al.action}**`).setTimestamp()] });
  }
  return true;
};

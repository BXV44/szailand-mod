const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { loadData, saveData, isOwner } = require('../utils/dataManager');
const { successEmbed, errorEmbed, modEmbed } = require('../utils/embedHelper');

function parseDuration(str) {
  const match = str?.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return null;
  const val = parseInt(match[1]);
  const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[match[2]];
  return val * mult;
}
function formatDuration(ms) {
  if (ms < 60000) return `${Math.round(ms/1000)}s`;
  if (ms < 3600000) return `${Math.round(ms/60000)}m`;
  if (ms < 86400000) return `${Math.round(ms/3600000)}h`;
  return `${Math.round(ms/86400000)}j`;
}

// ===== BAN =====
module.exports.ban = {
  name: 'ban',
  permissions: ['BanMembers'],
  async execute(message, args) {
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply({ embeds: [errorEmbed('Usage', '`ban @user [raison]`')] });
    if (!target.bannable) return message.reply({ embeds: [errorEmbed('Erreur', 'Je ne peux pas bannir cet utilisateur.')] });
    const reason = args.slice(1).join(' ') || 'Aucune raison fournie';
    await target.ban({ reason, deleteMessageSeconds: 86400 });
    message.reply({ embeds: [modEmbed('Ban', target.user, message.author, reason)] });
  },
};

// ===== UNBAN =====
module.exports.unban = {
  name: 'unban',
  permissions: ['BanMembers'],
  async execute(message, args) {
    const userId = args[0];
    if (!userId) return message.reply({ embeds: [errorEmbed('Usage', '`unban <userId> [raison]`')] });
    const reason = args.slice(1).join(' ') || 'Aucune raison';
    try {
      const ban = await message.guild.bans.fetch(userId);
      await message.guild.members.unban(userId, reason);
      message.reply({ embeds: [successEmbed('Unban', `**${ban.user.tag}** a été débanni.\nRaison: ${reason}`)] });
    } catch {
      message.reply({ embeds: [errorEmbed('Erreur', 'Utilisateur introuvable dans les bans.')] });
    }
  },
};

// ===== KICK =====
module.exports.kick = {
  name: 'kick',
  permissions: ['KickMembers'],
  async execute(message, args) {
    const target = message.mentions.members.first();
    if (!target) return message.reply({ embeds: [errorEmbed('Usage', '`kick @user [raison]`')] });
    if (!target.kickable) return message.reply({ embeds: [errorEmbed('Erreur', 'Je ne peux pas kick cet utilisateur.')] });
    const reason = args.slice(1).join(' ') || 'Aucune raison';
    await target.kick(reason);
    message.reply({ embeds: [modEmbed('Kick', target.user, message.author, reason)] });
  },
};

// ===== MUTE (timeout) =====
module.exports.mute = {
  name: 'mute',
  aliases: ['timeout'],
  permissions: ['ModerateMembers'],
  async execute(message, args) {
    const target = message.mentions.members.first();
    if (!target) return message.reply({ embeds: [errorEmbed('Usage', '`mute @user <durée: 1m/1h/1d> [raison]`')] });
    const dur = parseDuration(args[1]);
    if (!dur) return message.reply({ embeds: [errorEmbed('Durée invalide', 'Ex: `10m`, `2h`, `1d`')] });
    const reason = args.slice(2).join(' ') || 'Aucune raison';
    await target.timeout(dur, reason);
    message.reply({ embeds: [modEmbed('Mute', target.user, message.author, reason, { duration: formatDuration(dur) })] });
  },
};

// ===== UNMUTE =====
module.exports.unmute = {
  name: 'unmute',
  permissions: ['ModerateMembers'],
  async execute(message, args) {
    const target = message.mentions.members.first();
    if (!target) return message.reply({ embeds: [errorEmbed('Usage', '`unmute @user`')] });
    await target.timeout(null);
    message.reply({ embeds: [successEmbed('Unmute', `<@${target.id}> n'est plus muté.`)] });
  },
};

// ===== LOCK =====
module.exports.lock = {
  name: 'lock',
  permissions: ['ManageChannels'],
  async execute(message, args) {
    const channel = message.mentions.channels.first() || message.channel;
    await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
    message.reply({ embeds: [successEmbed('Lock', `${channel} a été verrouillé.`)] });
  },
};

// ===== UNLOCK =====
module.exports.unlock = {
  name: 'unlock',
  permissions: ['ManageChannels'],
  async execute(message, args) {
    const channel = message.mentions.channels.first() || message.channel;
    await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: null });
    message.reply({ embeds: [successEmbed('Unlock', `${channel} a été déverrouillé.`)] });
  },
};

// ===== SLOWMODE =====
module.exports.slowmode = {
  name: 'slowmode',
  permissions: ['ManageChannels'],
  async execute(message, args) {
    const sec = parseInt(args[0]);
    if (isNaN(sec) || sec < 0 || sec > 21600) return message.reply({ embeds: [errorEmbed('Usage', '`slowmode <0-21600 secondes>`')] });
    await message.channel.setRateLimitPerUser(sec);
    message.reply({ embeds: [successEmbed('Slowmode', sec === 0 ? 'Slowmode désactivé.' : `Slowmode: **${sec}s**`)] });
  },
};

// ===== WARN =====
module.exports.warn = {
  name: 'warn',
  permissions: ['ModerateMembers'],
  async execute(message, args) {
    const target = message.mentions.members.first();
    if (!target) return message.reply({ embeds: [errorEmbed('Usage', '`warn @user [raison]`')] });
    const reason = args.slice(1).join(' ') || 'Aucune raison';
    const warns = loadData('warns.json', {});
    if (!warns[message.guild.id]) warns[message.guild.id] = {};
    if (!warns[message.guild.id][target.id]) warns[message.guild.id][target.id] = [];
    warns[message.guild.id][target.id].push({ reason, by: message.author.id, date: Date.now() });
    saveData('warns.json', warns);
    const count = warns[message.guild.id][target.id].length;
    try { await target.send({ embeds: [errorEmbed('Avertissement', `Tu as reçu un warn sur **${message.guild.name}**.\nRaison: ${reason}\nTotal warns: **${count}**`)] }); } catch {}
    message.reply({ embeds: [modEmbed('Warn', target.user, message.author, reason, { duration: `Total: ${count} warn(s)` })] });
  },
};

// ===== XCLEAR (purge) =====
module.exports.xclear = {
  name: 'xclear',
  aliases: ['clear', 'purge'],
  permissions: ['ManageMessages'],
  async execute(message, args) {
    const amount = Math.min(parseInt(args[0]) || 10, 100);
    if (isNaN(amount) || amount < 1) return message.reply({ embeds: [errorEmbed('Usage', '`xclear <1-100>`')] });
    const deleted = await message.channel.bulkDelete(amount + 1, true).catch(() => null);
    const reply = await message.channel.send({ embeds: [successEmbed('Clear', `**${(deleted?.size || 1) - 1}** messages supprimés.`)] });
    setTimeout(() => reply.delete().catch(() => {}), 3000);
  },
};

// ===== BAN ALL =====
module.exports.banall = {
  name: 'banall',
  ownerOnly: true,
  async execute(message, args) {
    if (!isOwner(message.author.id)) return message.reply({ embeds: [errorEmbed('Accès refusé', 'Owners uniquement.')] });
    const members = await message.guild.members.fetch();
    let count = 0;
    const reply = await message.reply({ embeds: [new EmbedBuilder().setColor(0xFEE75C).setTitle('⚠️ Ban All en cours...').setDescription('Bannissement en cours...')] });
    for (const [id, member] of members) {
      if (id === message.guild.ownerId || id === message.author.id || id === message.client.user.id) continue;
      if (member.bannable) { await member.ban({ reason: 'Ban All by owner' }).catch(() => {}); count++; }
    }
    reply.edit({ embeds: [successEmbed('Ban All', `**${count}** membres bannis.`)] });
  },
};

// ===== UNBAN ALL =====
module.exports.unbanall = {
  name: 'unbanall',
  ownerOnly: true,
  async execute(message) {
    if (!isOwner(message.author.id)) return;
    const bans = await message.guild.bans.fetch();
    let count = 0;
    for (const [id] of bans) { await message.guild.members.unban(id).catch(() => {}); count++; }
    message.reply({ embeds: [successEmbed('Unban All', `**${count}** utilisateurs débannis.`)] });
  },
};

// ===== MASSIVEROLE =====
module.exports.massiverole = {
  name: 'massiverole',
  permissions: ['ManageRoles'],
  async execute(message, args) {
    const role = message.mentions.roles.first();
    const action = args[0];
    if (!role || !['add','remove'].includes(action)) return message.reply({ embeds: [errorEmbed('Usage', '`massiverole <add|remove> @role`')] });
    const members = await message.guild.members.fetch();
    let count = 0;
    const reply = await message.reply({ embeds: [new EmbedBuilder().setColor(0xFEE75C).setTitle('⏳ MassiveRole').setDescription('En cours...')] });
    for (const [, member] of members) {
      if (member.user.bot) continue;
      try {
        if (action === 'add') await member.roles.add(role);
        else await member.roles.remove(role);
        count++;
      } catch {}
    }
    reply.edit({ embeds: [successEmbed('MassiveRole', `Rôle ${role} ${action === 'add' ? 'ajouté à' : 'retiré de'} **${count}** membres.`)] });
  },
};

// ===== TEMPROLE =====
module.exports.temprole = {
  name: 'temprole',
  permissions: ['ManageRoles'],
  async execute(message, args) {
    const target = message.mentions.members.first();
    const role = message.mentions.roles.first();
    const dur = parseDuration(args[2]);
    if (!target || !role || !dur) return message.reply({ embeds: [errorEmbed('Usage', '`temprole @user @role <durée>`')] });
    await target.roles.add(role);
    message.reply({ embeds: [successEmbed('TempRole', `${role} donné à ${target} pour **${formatDuration(dur)}**`)] });
    setTimeout(async () => { await target.roles.remove(role).catch(() => {}); }, dur);
  },
};

// ===== UNTEMP ROLE =====
module.exports.untemprole = {
  name: 'untemprole',
  permissions: ['ManageRoles'],
  async execute(message, args) {
    const target = message.mentions.members.first();
    const role = message.mentions.roles.first();
    if (!target || !role) return message.reply({ embeds: [errorEmbed('Usage', '`untemprole @user @role`')] });
    await target.roles.remove(role);
    message.reply({ embeds: [successEmbed('UnTempRole', `${role} retiré de ${target}.`)] });
  },
};

// ===== VOICEMOVE =====
module.exports.voicemove = {
  name: 'voicemove',
  permissions: ['MoveMembers'],
  async execute(message, args) {
    const target = message.mentions.members.first();
    const channelId = args[1] || (message.member.voice?.channelId);
    if (!target) return message.reply({ embeds: [errorEmbed('Usage', '`voicemove @user <channelId|mentionVocal>`')] });
    const vc = message.mentions.channels.filter(c => c.type === 2).first() || message.guild.channels.cache.get(channelId);
    if (!vc) return message.reply({ embeds: [errorEmbed('Erreur', 'Channel vocal introuvable.')] });
    if (!target.voice?.channel) return message.reply({ embeds: [errorEmbed('Erreur', 'L\'utilisateur n\'est pas en vocal.')] });
    await target.voice.setChannel(vc);
    message.reply({ embeds: [successEmbed('VoiceMove', `${target} déplacé vers **${vc.name}**`)] });
  },
};

// ===== BLACKLIST =====
module.exports.blacklist = {
  name: 'blacklist',
  ownerOnly: true,
  async execute(message, args) {
    const { addBlacklist } = require('../utils/dataManager');
    const target = message.mentions.users.first() || { id: args[0], tag: args[0] };
    if (!target?.id) return message.reply({ embeds: [errorEmbed('Usage', '`blacklist @user`')] });
    addBlacklist(target.id);
    message.reply({ embeds: [successEmbed('Blacklist', `<@${target.id}> blacklisté du bot.`)] });
  },
};

// ===== UNBLACKLIST =====
module.exports.unblacklist = {
  name: 'unblacklist',
  ownerOnly: true,
  async execute(message, args) {
    const { removeBlacklist } = require('../utils/dataManager');
    const id = message.mentions.users.first()?.id || args[0];
    if (!id) return message.reply({ embeds: [errorEmbed('Usage', '`unblacklist @user`')] });
    removeBlacklist(id);
    message.reply({ embeds: [successEmbed('Unblacklist', `<@${id}> retiré de la blacklist.`)] });
  },
};

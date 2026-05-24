const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { 
  loadData, saveData, isOwner, getOwners,
  addWhitelist, removeWhitelist, getWhitelist, isWhitelisted,
  savePrefix, loadPrefix,
} = require('../utils/dataManager');
const { successEmbed, errorEmbed, infoEmbed } = require('../utils/embedHelper');

// ===== WHITELIST =====
module.exports.whitelist = {
  name: 'whitelist',
  aliases: ['wl'],
  ownerOnly: true,
  async execute(message, args) {
    const target = message.mentions.users.first() || { id: args[0] };
    if (!target?.id) return message.reply({ embeds: [errorEmbed('Usage', '`whitelist @user`')] });
    addWhitelist(message.guild.id, target.id);
    message.reply({ embeds: [successEmbed('Whitelist', `<@${target.id}> ajouté à la whitelist (admin du bot).`)] });
  },
};

// ===== UNWL =====
module.exports.unwl = {
  name: 'unwl',
  ownerOnly: true,
  async execute(message, args) {
    const id = message.mentions.users.first()?.id || args[0];
    if (!id) return message.reply({ embeds: [errorEmbed('Usage', '`unwl @user`')] });
    removeWhitelist(message.guild.id, id);
    message.reply({ embeds: [successEmbed('Whitelist', `<@${id}> retiré de la whitelist.`)] });
  },
};

// ===== WATCH (liste whitelist) =====
module.exports.watch = {
  name: 'watch',
  ownerOnly: true,
  async execute(message) {
    const wl = getWhitelist(message.guild.id);
    const owners = getOwners();
    const desc = [
      `**Owners du bot:**\n${owners.map(id => `<@${id}>`).join(' | ') || 'Aucun'}`,
      `\n**Whitelist (${message.guild.name}):**\n${wl.length ? wl.map(id => `<@${id}>`).join('\n') : 'Aucun'}`,
    ].join('\n');
    message.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle('👁️ Watch').setDescription(desc).setTimestamp()] });
  },
};

// ===== PREFIX =====
module.exports.prefix = {
  name: 'prefix',
  permissions: ['ManageGuild'],
  async execute(message, args) {
    const p = args[0];
    if (!p) return message.reply({ embeds: [infoEmbed('Prefix', `Prefix actuel: \`${loadPrefix(message.guild.id)}\``)] });
    if (p.length > 5) return message.reply({ embeds: [errorEmbed('Erreur', 'Prefix trop long (max 5 caractères).')] });
    savePrefix(message.guild.id, p);
    message.reply({ embeds: [successEmbed('Prefix', `Nouveau prefix: \`${p}\``)] });
  },
};

// ===== SETNAME =====
module.exports.setname = {
  name: 'setname',
  ownerOnly: true,
  async execute(message, args) {
    const name = args.join(' ');
    if (!name) return message.reply({ embeds: [errorEmbed('Usage', '`setname <nom>`')] });
    await message.client.user.setUsername(name);
    message.reply({ embeds: [successEmbed('Setname', `Nom du bot changé en: **${name}**`)] });
  },
};

// ===== SETPIC =====
module.exports.setpic = {
  name: 'setpic',
  ownerOnly: true,
  async execute(message, args) {
    const url = args[0] || message.attachments.first()?.url;
    if (!url) return message.reply({ embeds: [errorEmbed('Usage', '`setpic <url>` ou attache une image')] });
    await message.client.user.setAvatar(url);
    message.reply({ embeds: [successEmbed('Setpic', 'Avatar du bot mis à jour.').setImage(url)] });
  },
};

// ===== SERVERLIST =====
module.exports.serverlist = {
  name: 'serverlist',
  ownerOnly: true,
  async execute(message) {
    const guilds = message.client.guilds.cache;
    const pages = [];
    let page = [];
    guilds.forEach(g => {
      page.push(`**${g.name}** — ${g.memberCount} membres — \`${g.id}\``);
      if (page.length === 10) { pages.push(page.join('\n')); page = []; }
    });
    if (page.length) pages.push(page.join('\n'));
    message.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle(`📋 Serveurs (${guilds.size})`).setDescription(pages[0] || 'Aucun').setTimestamp()] });
  },
};

// ===== UPDATEDM =====
module.exports.updatedm = {
  name: 'updatedm',
  ownerOnly: true,
  async execute(message, args) {
    const msg = args.join(' ');
    if (!msg) return message.reply({ embeds: [errorEmbed('Usage', '`updatedm <message>`')] });
    const guilds = message.client.guilds.cache;
    let sent = 0, fail = 0;
    const reply = await message.reply({ embeds: [new EmbedBuilder().setColor(0xFEE75C).setTitle('📤 UpdateDM').setDescription('Envoi en cours...')] });
    for (const [, guild] of guilds) {
      try {
        const owner = await guild.fetchOwner();
        await owner.send({ embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle('📢 Mise à jour du bot').setDescription(msg).setFooter({ text: 'Message de l\'équipe du bot' }).setTimestamp()] });
        sent++;
      } catch { fail++; }
    }
    reply.edit({ embeds: [successEmbed('UpdateDM', `Envoyé: **${sent}** serveurs\nÉchec: **${fail}**`)] });
  },
};

// ===== OWNER =====
module.exports.owner = {
  name: 'owner',
  ownerOnly: true,
  async execute(message) {
    const owners = getOwners();
    message.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle('👑 Owners du Bot').setDescription(owners.map(id => `<@${id}>`).join('\n') || 'Aucun').setTimestamp()] });
  },
};

// ===== UNOWNER =====
module.exports.unowner = {
  name: 'unowner',
  ownerOnly: true,
  async execute(message, args) {
    message.reply({ embeds: [errorEmbed('Non modifiable', 'Les owners sont définis dans les variables d\'environnement Railway (OWNER1, OWNER2).')] });
  },
};

// ===== UPDATE =====
module.exports.update = {
  name: 'update',
  ownerOnly: true,
  async execute(message, args) {
    const version = args.join(' ') || 'Non spécifiée';
    const guilds = message.client.guilds.cache;
    let sent = 0;
    for (const [, guild] of guilds) {
      try {
        const ch = guild.systemChannel || guild.channels.cache.filter(c => c.type === 0).first();
        if (ch) {
          await ch.send({ embeds: [new EmbedBuilder().setColor(0x57F287).setTitle('🔄 Mise à jour du Bot').setDescription(`Le bot a été mis à jour!\n\n**Version:** ${version}\n\nMerci de votre confiance!`).setTimestamp()] });
          sent++;
        }
      } catch {}
    }
    message.reply({ embeds: [successEmbed('Update', `Annonce envoyée sur **${sent}** serveurs.`)] });
  },
};

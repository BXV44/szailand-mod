const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { loadData, isOwner, getOwners, getWhitelist, loadPrefix } = require('../utils/dataManager');
const { infoEmbed, errorEmbed } = require('../utils/embedHelper');
const snipeStore = require('../utils/snipeStore');

// ===== HELP =====
module.exports.help = {
  name: 'help',
  async execute(message, args, client) {
    const prefix = loadPrefix(message.guild?.id);
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('📚 Aide — Liste des commandes')
      .setThumbnail(message.client.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '🔨 Modération', value: `\`ban\` \`unban\` \`kick\` \`mute\` \`unmute\` \`warn\` \`lock\` \`unlock\` \`slowmode\` \`xclear\` \`banall\` \`unbanall\` \`massiverole\` \`temprole\` \`untemprole\` \`voicemove\` \`blacklist\` \`unblacklist\`` },
        { name: '🛡️ Antiraid / Protection', value: `\`antiraid\` \`antilink\`` },
        { name: '💾 Backup', value: `\`backup create\` \`backup load\` \`backup list\` \`backup delete\`` },
        { name: '⚙️ Gestion', value: `\`whitelist\` \`unwl\` \`watch\` \`prefix\` \`setname\` \`setpic\` \`serverlist\` \`updatedm\` \`update\` \`owner\`` },
        { name: '🎫 Tickets', value: `\`ticket panel\` \`ticket setup\` \`ticket close\` \`ticket add\` \`ticket remove\`` },
        { name: '🎉 Welcome', value: `\`welcome set\` \`welcome off\` \`welcome test\` \`welcome autorole\`` },
        { name: '🔧 Utilitaire', value: `\`help\` \`adminlist\` \`botlist\` \`wiki\` \`vc\` \`user\` \`speed\` \`snipe\` \`serverinfo\`` },
      )
      .setFooter({ text: `Prefix: ${prefix} • Propriétaires: ${getOwners().map(id => `<@${id}>`).join(', ')}` })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

// ===== ADMINLIST =====
module.exports.adminlist = {
  name: 'adminlist',
  async execute(message) {
    const admins = message.guild.members.cache.filter(m => m.permissions.has(PermissionFlagsBits.Administrator) && !m.user.bot);
    const wl = getWhitelist(message.guild.id);
    const desc = admins.map(m => `<@${m.id}> — ${m.user.tag}${wl.includes(m.id) ? ' ⭐' : ''}`).join('\n') || 'Aucun admin';
    message.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle(`🔑 Admins — ${message.guild.name}`).setDescription(desc).setFooter({ text: '⭐ = Whitelisté bot' }).setTimestamp()] });
  },
};

// ===== BOTLIST =====
module.exports.botlist = {
  name: 'botlist',
  async execute(message) {
    const bots = message.guild.members.cache.filter(m => m.user.bot);
    const desc = bots.map(b => `<@${b.id}> — \`${b.user.tag}\``).join('\n') || 'Aucun bot';
    message.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle(`🤖 Bots (${bots.size}) — ${message.guild.name}`).setDescription(desc).setTimestamp()] });
  },
};

// ===== WIKI =====
module.exports.wiki = {
  name: 'wiki',
  async execute(message, args) {
    const query = args.join(' ');
    if (!query) return message.reply({ embeds: [errorEmbed('Usage', '`wiki <recherche>`')] });
    const url = `https://fr.wikipedia.org/wiki/${encodeURIComponent(query)}`;
    message.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle(`📖 Wikipedia: ${query}`).setDescription(`[Cliquer pour voir la page](${url})`).setTimestamp()] });
  },
};

// ===== VC (voice channel info) =====
module.exports.vc = {
  name: 'vc',
  async execute(message, args) {
    const member = message.mentions.members.first() || message.member;
    if (!member.voice?.channel) return message.reply({ embeds: [errorEmbed('Erreur', `${member} n'est pas en vocal.`)] });
    const vc = member.voice.channel;
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`🔊 ${vc.name}`)
      .addFields(
        { name: 'Membres', value: `${vc.members.size}/${vc.userLimit || '∞'}`, inline: true },
        { name: 'Bitrate', value: `${vc.bitrate / 1000}kbps`, inline: true },
        { name: 'ID', value: vc.id, inline: true },
        { name: 'Membres présents', value: vc.members.map(m => `<@${m.id}>`).join(', ') || 'Aucun' },
      ).setTimestamp();
    message.reply({ embeds: [embed] });
  },
};

// ===== USER =====
module.exports.user = {
  name: 'user',
  aliases: ['userinfo', 'ui', 'whois'],
  async execute(message, args) {
    const member = message.mentions.members.first() || message.member;
    const user = member.user;
    const roles = member.roles.cache.filter(r => r.id !== message.guild.id).sort((a,b) => b.position - a.position);
    const embed = new EmbedBuilder()
      .setColor(member.displayHexColor || 0x5865F2)
      .setTitle(`👤 ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: 'ID', value: user.id, inline: true },
        { name: 'Surnom', value: member.nickname || 'Aucun', inline: true },
        { name: 'Bot', value: user.bot ? 'Oui' : 'Non', inline: true },
        { name: 'Compte créé', value: `<t:${Math.floor(user.createdTimestamp/1000)}:R>`, inline: true },
        { name: 'A rejoint le serveur', value: `<t:${Math.floor(member.joinedTimestamp/1000)}:R>`, inline: true },
        { name: `Rôles (${roles.size})`, value: roles.size ? roles.map(r => `<@&${r.id}>`).join(' ').slice(0, 1024) : 'Aucun' },
      )
      .setFooter({ text: `Demandé par ${message.author.tag}` })
      .setTimestamp();
    message.reply({ embeds: [embed] });
  },
};

// ===== SPEED (ping) =====
module.exports.speed = {
  name: 'speed',
  aliases: ['ping', 'latency'],
  async execute(message) {
    const start = Date.now();
    const reply = await message.reply({ embeds: [new EmbedBuilder().setColor(0xFEE75C).setTitle('⏱️ Calcul...').setDescription('Mesure de la latence...')] });
    const latency = Date.now() - start;
    const apiPing = message.client.ws.ping;
    const color = latency < 100 ? 0x57F287 : latency < 300 ? 0xFEE75C : 0xED4245;
    reply.edit({ embeds: [new EmbedBuilder().setColor(color).setTitle('⚡ Speed Test').addFields(
      { name: '📡 Message Latency', value: `\`${latency}ms\``, inline: true },
      { name: '💓 API Ping', value: `\`${apiPing}ms\``, inline: true },
      { name: '🟢 Statut', value: latency < 200 ? 'Excellent' : latency < 500 ? 'Correct' : 'Lent', inline: true },
    ).setTimestamp()] });
  },
};

// ===== SNIPE =====
module.exports.snipe = {
  name: 'snipe',
  async execute(message) {
    const data = snipeStore.get(message.channel.id);
    if (!data) return message.reply({ embeds: [infoEmbed('Snipe', 'Aucun message supprimé récemment dans ce salon.')] });
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setAuthor({ name: data.author, iconURL: data.avatar })
      .setTitle('🕵️ Dernier message supprimé')
      .setDescription(data.content)
      .setFooter({ text: `Supprimé il y a ${Math.round((Date.now() - data.timestamp) / 1000)}s` })
      .setTimestamp(data.timestamp);
    if (data.image) embed.setImage(data.image);
    message.reply({ embeds: [embed] });
  },
};

// ===== SERVERINFO =====
module.exports.serverinfo = {
  name: 'serverinfo',
  aliases: ['si', 'server'],
  async execute(message) {
    const guild = message.guild;
    await guild.fetch();
    const members = guild.members.cache;
    const bots = members.filter(m => m.user.bot).size;
    const humans = members.filter(m => !m.user.bot).size;
    const channels = guild.channels.cache;
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`📊 ${guild.name}`)
      .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: 'Propriétaire', value: `<@${guild.ownerId}>`, inline: true },
        { name: 'ID', value: guild.id, inline: true },
        { name: 'Région', value: guild.preferredLocale || 'N/A', inline: true },
        { name: 'Membres', value: `👥 ${guild.memberCount} (${humans} humains, ${bots} bots)`, inline: false },
        { name: 'Salons', value: `💬 Texte: ${channels.filter(c=>c.type===0).size} | 🔊 Vocal: ${channels.filter(c=>c.type===2).size} | 📁 Catégories: ${channels.filter(c=>c.type===4).size}`, inline: false },
        { name: 'Rôles', value: `${guild.roles.cache.size}`, inline: true },
        { name: 'Emojis', value: `${guild.emojis.cache.size}`, inline: true },
        { name: 'Boosts', value: `${guild.premiumSubscriptionCount || 0} (Niveau ${guild.premiumTier})`, inline: true },
        { name: 'Créé le', value: `<t:${Math.floor(guild.createdTimestamp/1000)}:D> (<t:${Math.floor(guild.createdTimestamp/1000)}:R>)`, inline: false },
      )
      .setImage(guild.bannerURL({ size: 1024 }) || null)
      .setFooter({ text: `Demandé par ${message.author.tag}` })
      .setTimestamp();
    message.reply({ embeds: [embed] });
  },
};

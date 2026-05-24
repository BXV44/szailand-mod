const { ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { loadData, saveData, isOwner } = require('../utils/dataManager');
const { successEmbed, errorEmbed, infoEmbed } = require('../utils/embedHelper');

module.exports = {
  name: 'backup',
  description: 'Sauvegarde et restauration du serveur',
  async execute(message, args) {
    if (!isOwner(message.author.id)) return message.reply({ embeds: [errorEmbed('Accès refusé', 'Owners uniquement.')] });
    const sub = args[0]?.toLowerCase();

    if (sub === 'create') return createBackup(message);
    if (sub === 'load') return loadBackup(message, args[1]);
    if (sub === 'list') return listBackups(message);
    if (sub === 'delete') return deleteBackup(message, args[1]);

    message.reply({ embeds: [errorEmbed('Usage', '`backup <create|load|list|delete> [id]`')] });
  },
};

async function createBackup(message) {
  const guild = message.guild;
  const reply = await message.reply({ embeds: [new EmbedBuilder().setColor(0xFEE75C).setTitle('⏳ Backup').setDescription('Création de la sauvegarde...')] });

  const roles = guild.roles.cache
    .filter(r => !r.managed && r.id !== guild.id)
    .sort((a, b) => b.position - a.position)
    .map(r => ({ name: r.name, color: r.color, permissions: r.permissions.bitfield.toString(), hoist: r.hoist, mentionable: r.mentionable }));

  const channels = guild.channels.cache.map(c => ({
    name: c.name, type: c.type, parentName: c.parent?.name || null,
    topic: c.topic || null, nsfw: c.nsfw || false, position: c.position,
    rateLimitPerUser: c.rateLimitPerUser || 0,
  }));

  const id = Date.now().toString();
  const backups = loadData('backups.json', {});
  backups[id] = {
    id, guildId: guild.id, guildName: guild.name,
    createdAt: Date.now(), createdBy: message.author.id,
    roles, channels,
  };
  saveData('backups.json', backups);
  reply.edit({ embeds: [successEmbed('Backup Créé', `ID: \`${id}\`\nRôles: **${roles.length}** | Salons: **${channels.length}**`)] });
}

async function loadBackup(message, id) {
  if (!id) return message.reply({ embeds: [errorEmbed('Usage', '`backup load <id>`')] });
  const backups = loadData('backups.json', {});
  const b = backups[id];
  if (!b) return message.reply({ embeds: [errorEmbed('Erreur', 'Backup introuvable.')] });

  const reply = await message.reply({ embeds: [new EmbedBuilder().setColor(0xFEE75C).setTitle('⏳ Restauration').setDescription('Restauration en cours... **Ceci peut prendre du temps.**')] });
  const guild = message.guild;

  // Restore roles
  for (const r of b.roles) {
    try {
      await guild.roles.create({ name: r.name, color: r.color, permissions: BigInt(r.permissions), hoist: r.hoist, mentionable: r.mentionable });
    } catch {}
  }

  reply.edit({ embeds: [successEmbed('Restauration', `Backup \`${id}\` restauré.\nRôles: **${b.roles.length}** | Salons: **${b.channels.length}**`)] });
}

async function listBackups(message) {
  const backups = loadData('backups.json', {});
  const list = Object.values(backups).filter(b => b.guildId === message.guild.id);
  if (!list.length) return message.reply({ embeds: [infoEmbed('Backups', 'Aucun backup trouvé.')] });
  const desc = list.map(b => `\`${b.id}\` — **${b.guildName}** — <t:${Math.floor(b.createdAt/1000)}:R>`).join('\n');
  message.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle('💾 Backups').setDescription(desc).setTimestamp()] });
}

async function deleteBackup(message, id) {
  if (!id) return message.reply({ embeds: [errorEmbed('Usage', '`backup delete <id>`')] });
  const backups = loadData('backups.json', {});
  if (!backups[id]) return message.reply({ embeds: [errorEmbed('Erreur', 'Backup introuvable.')] });
  delete backups[id];
  saveData('backups.json', backups);
  message.reply({ embeds: [successEmbed('Backup', `Backup \`${id}\` supprimé.`)] });
}

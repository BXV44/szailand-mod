const { EmbedBuilder } = require('discord.js');

const COLORS = {
  success: 0x57F287,
  error: 0xED4245,
  info: 0x5865F2,
  warn: 0xFEE75C,
  mod: 0x2B2D31,
  ticket: 0x5865F2,
};

function successEmbed(title, desc) {
  return new EmbedBuilder().setColor(COLORS.success).setTitle(`✅ ${title}`).setDescription(desc).setTimestamp();
}
function errorEmbed(title, desc) {
  return new EmbedBuilder().setColor(COLORS.error).setTitle(`❌ ${title}`).setDescription(desc).setTimestamp();
}
function infoEmbed(title, desc) {
  return new EmbedBuilder().setColor(COLORS.info).setTitle(`ℹ️ ${title}`).setDescription(desc).setTimestamp();
}
function warnEmbed(title, desc) {
  return new EmbedBuilder().setColor(COLORS.warn).setTitle(`⚠️ ${title}`).setDescription(desc).setTimestamp();
}
function modEmbed(action, target, mod, reason, extra = {}) {
  const e = new EmbedBuilder()
    .setColor(COLORS.mod)
    .setTitle(`🔨 ${action}`)
    .addFields(
      { name: 'Utilisateur', value: `<@${target.id}> (${target.tag || target.id})`, inline: true },
      { name: 'Modérateur', value: `<@${mod.id}>`, inline: true },
      { name: 'Raison', value: reason || 'Aucune raison fournie', inline: false }
    )
    .setTimestamp();
  if (extra.duration) e.addFields({ name: 'Durée', value: extra.duration, inline: true });
  return e;
}

module.exports = { successEmbed, errorEmbed, infoEmbed, warnEmbed, modEmbed, COLORS };

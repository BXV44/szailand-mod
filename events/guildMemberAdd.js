const { loadData, saveData } = require('../utils/dataManager');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    // === ANTIRAID: join rate check ===
    const antiraid = loadData('antiraid.json', {});
    const gid = member.guild.id;
    if (antiraid[gid]?.enabled) {
      const now = Date.now();
      if (!antiraid[gid].joins) antiraid[gid].joins = [];
      antiraid[gid].joins = antiraid[gid].joins.filter(t => now - t < 10000);
      antiraid[gid].joins.push(now);
      saveData('antiraid.json', antiraid);
      if (antiraid[gid].joins.length >= (antiraid[gid].threshold || 5)) {
        // Kick the joining member and alert
        try {
          await member.kick('Antiraid - trop de joins en peu de temps');
          const logChannel = member.guild.channels.cache.get(antiraid[gid].logChannel);
          if (logChannel) {
            logChannel.send({
              embeds: [new EmbedBuilder()
                .setColor(0xED4245)
                .setTitle('🚨 Antiraid Déclenché')
                .setDescription(`**${member.user.tag}** a été kick (raid détecté - ${antiraid[gid].joins.length} joins en 10s)`)
                .setTimestamp()]
            });
          }
        } catch {}
        return;
      }
    }

    // === WELCOME ===
    const welcomeData = loadData('welcome.json', {});
    const cfg = welcomeData[gid];
    if (!cfg || !cfg.enabled || !cfg.channelId) return;

    const channel = member.guild.channels.cache.get(cfg.channelId);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(cfg.title || `Bienvenue sur ${member.guild.name} !`)
      .setDescription(
        (cfg.message || 'Bienvenue {user} ! Tu es le membre numéro {count} !')
          .replace('{user}', `<@${member.id}>`)
          .replace('{tag}', member.user.tag)
          .replace('{server}', member.guild.name)
          .replace('{count}', member.guild.memberCount)
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setFooter({ text: cfg.footer || member.guild.name, iconURL: member.guild.iconURL({ dynamic: true }) })
      .setTimestamp();

    if (cfg.image) embed.setImage(cfg.image);
    if (cfg.banner) embed.setBanner?.(cfg.banner);

    await channel.send({ content: cfg.ping ? `<@${member.id}>` : null, embeds: [embed] }).catch(() => {});

    // Auto role on join
    if (cfg.autorole) {
      const role = member.guild.roles.cache.get(cfg.autorole);
      if (role) member.roles.add(role).catch(() => {});
    }
  },
};

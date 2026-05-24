const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { loadData, saveData, isOwner } = require('../utils/dataManager');
const { successEmbed, errorEmbed, infoEmbed } = require('../utils/embedHelper');

module.exports = {
  name: 'welcome',
  description: 'Configure le message de bienvenue',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild) && !isOwner(message.author.id)) {
      return message.reply({ embeds: [errorEmbed('Permission', 'Tu as besoin de `Gérer le serveur`.')] });
    }

    const sub = args[0]?.toLowerCase();
    const wd = loadData('welcome.json', {});
    const gid = message.guild.id;
    if (!wd[gid]) wd[gid] = { enabled: false, channelId: null, message: null, title: null, footer: null, image: null, ping: false, autorole: null };

    if (!sub || sub === 'status') {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle('🎉 Welcome Config')
        .addFields(
          { name: 'Activé', value: wd[gid].enabled ? '✅ Oui' : '❌ Non', inline: true },
          { name: 'Salon', value: wd[gid].channelId ? `<#${wd[gid].channelId}>` : 'Non configuré', inline: true },
          { name: 'Ping', value: wd[gid].ping ? '✅ Oui' : '❌ Non', inline: true },
          { name: 'AutoRole', value: wd[gid].autorole ? `<@&${wd[gid].autorole}>` : 'Aucun', inline: true },
          { name: 'Message', value: wd[gid].message || 'Défaut', inline: false },
        ).setTimestamp()] });
    }

    if (sub === 'set') {
      const channel = message.mentions.channels.first();
      if (!channel) return message.reply({ embeds: [errorEmbed('Usage', '`welcome set #salon`')] });
      wd[gid].channelId = channel.id;
      wd[gid].enabled = true;
      saveData('welcome.json', wd);
      return message.reply({ embeds: [successEmbed('Welcome', `Salon de bienvenue: ${channel}`)] });
    }

    if (sub === 'off') {
      wd[gid].enabled = false; saveData('welcome.json', wd);
      return message.reply({ embeds: [successEmbed('Welcome', 'Messages de bienvenue désactivés.')] });
    }

    if (sub === 'on') {
      wd[gid].enabled = true; saveData('welcome.json', wd);
      return message.reply({ embeds: [successEmbed('Welcome', 'Messages de bienvenue activés.')] });
    }

    if (sub === 'message') {
      const msg = args.slice(1).join(' ');
      if (!msg) return message.reply({ embeds: [errorEmbed('Usage', '`welcome message <texte>` — Variables: {user} {tag} {server} {count}`')] });
      wd[gid].message = msg; saveData('welcome.json', wd);
      return message.reply({ embeds: [successEmbed('Welcome', `Message: ${msg}`)] });
    }

    if (sub === 'title') {
      wd[gid].title = args.slice(1).join(' ') || null; saveData('welcome.json', wd);
      return message.reply({ embeds: [successEmbed('Welcome', `Titre: ${wd[gid].title || 'Réinitialisé'}`)] });
    }

    if (sub === 'image') {
      const url = args[1] || message.attachments.first()?.url || null;
      wd[gid].image = url; saveData('welcome.json', wd);
      return message.reply({ embeds: [successEmbed('Welcome', url ? `Image définie.` : 'Image retirée.')] });
    }

    if (sub === 'footer') {
      wd[gid].footer = args.slice(1).join(' ') || null; saveData('welcome.json', wd);
      return message.reply({ embeds: [successEmbed('Welcome', `Footer: ${wd[gid].footer || 'Réinitialisé'}`)] });
    }

    if (sub === 'ping') {
      wd[gid].ping = !wd[gid].ping; saveData('welcome.json', wd);
      return message.reply({ embeds: [successEmbed('Welcome', `Ping du membre: **${wd[gid].ping ? 'ON' : 'OFF'}**`)] });
    }

    if (sub === 'autorole') {
      const role = message.mentions.roles.first();
      wd[gid].autorole = role?.id || null; saveData('welcome.json', wd);
      return message.reply({ embeds: [successEmbed('Welcome', role ? `AutoRole: ${role}` : 'AutoRole désactivé.')] });
    }

    if (sub === 'test') {
      // Simulate welcome
      const cfg = wd[gid];
      const channel = cfg.channelId ? message.guild.channels.cache.get(cfg.channelId) : message.channel;
      if (!channel) return message.reply({ embeds: [errorEmbed('Erreur', 'Salon de bienvenue introuvable.')] });
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(cfg.title || `Bienvenue sur ${message.guild.name} !`)
        .setDescription(
          (cfg.message || 'Bienvenue {user} ! Tu es le membre numéro {count} !')
            .replace('{user}', `<@${message.author.id}>`)
            .replace('{tag}', message.author.tag)
            .replace('{server}', message.guild.name)
            .replace('{count}', message.guild.memberCount)
        )
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: cfg.footer || message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
        .setTimestamp();
      if (cfg.image) embed.setImage(cfg.image);
      await channel.send({ content: cfg.ping ? `<@${message.author.id}>` : null, embeds: [embed] });
      if (channel.id !== message.channel.id) message.reply({ embeds: [successEmbed('Test', `Message de bienvenue envoyé dans ${channel}`)] });
      return;
    }

    message.reply({ embeds: [errorEmbed('Usage', '`welcome <set|on|off|message|title|image|footer|ping|autorole|test|status>`')] });
  },
};

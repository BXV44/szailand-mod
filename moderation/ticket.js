const { 
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
  ChannelType, PermissionFlagsBits, StringSelectMenuBuilder 
} = require('discord.js');
const { loadData, saveData, isOwner } = require('../utils/dataManager');
const { successEmbed, errorEmbed } = require('../utils/embedHelper');

const TICKET_GIF = 'https://cdn.discordapp.com/attachments/1507726296220700902/1507930432694648873/tenor.gif?ex=6a1459e7&is=6a130867&hm=4397ad0c2675d17914f0c9843ed05217383bb52145a3c356201728bc99b067a4&';

module.exports = {
  name: 'ticket',
  aliases: ['tickets'],
  description: 'Gestion des tickets',
  async execute(message, args, client) {
    const sub = args[0]?.toLowerCase();

    if (!sub || sub === 'panel') {
      return sendTicketPanel(message, client);
    }
    if (sub === 'setup') return setupTicket(message, args, client);
    if (sub === 'close') return closeTicket(message, args, client);
    if (sub === 'add') return addUser(message, args, client);
    if (sub === 'remove') return removeUser(message, args, client);

    return message.reply({ embeds: [errorEmbed('Usage', '`ticket panel` | `ticket setup #salon @role` | `ticket close` | `ticket add @user` | `ticket remove @user`')] });
  },
};

async function sendTicketPanel(message, client) {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels) && !isOwner(message.author.id)) {
    return message.reply({ embeds: [errorEmbed('Permission', 'Tu as besoin de `Gérer les salons`.')] });
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('🎫 Support & Tickets')
    .setDescription('Clique sur le bouton ci-dessous pour ouvrir un ticket.\nNotre équipe sera là pour t\'aider dès que possible !\n\n> **Utilise les tickets pour :**\n> • Questions générales\n> • Signalement de problèmes\n> • Demandes spéciales\n> • Partenariats')
    .setImage(TICKET_GIF)
    .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_open')
      .setLabel('📩 Ouvrir un Ticket')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('ticket_info')
      .setLabel('ℹ️ Informations')
      .setStyle(ButtonStyle.Secondary)
  );

  await message.channel.send({ embeds: [embed], components: [row] });
  await message.delete().catch(() => {});
}

async function setupTicket(message, args, client) {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild) && !isOwner(message.author.id)) {
    return message.reply({ embeds: [errorEmbed('Permission', 'Tu as besoin de `Gérer le serveur`.')] });
  }
  const channel = message.mentions.channels.first();
  const role = message.mentions.roles.first();
  if (!channel) return message.reply({ embeds: [errorEmbed('Usage', '`ticket setup #salon @role`')] });

  const tickets = loadData('tickets.json', {});
  tickets[message.guild.id] = {
    categoryId: null,
    logChannelId: channel.id,
    supportRoleId: role?.id || null,
    count: tickets[message.guild.id]?.count || 0,
  };
  saveData('tickets.json', tickets);
  message.reply({ embeds: [successEmbed('Ticket configuré', `Logs: ${channel}\nRole support: ${role || 'Aucun'}`)] });
}

async function closeTicket(message, args, client) {
  const tickets = loadData('active_tickets.json', {});
  const ticket = Object.values(tickets).find(t => t.channelId === message.channel.id);
  if (!ticket) return message.reply({ embeds: [errorEmbed('Erreur', 'Ce salon n\'est pas un ticket.')] });

  const embed = new EmbedBuilder()
    .setColor(0xED4245)
    .setTitle('🔒 Ticket Fermé')
    .setDescription(`Fermé par <@${message.author.id}>`)
    .setTimestamp();

  await message.channel.send({ embeds: [embed] });
  setTimeout(() => message.channel.delete().catch(() => {}), 3000);

  delete tickets[ticket.id];
  saveData('active_tickets.json', tickets);
}

async function addUser(message, args, client) {
  const user = message.mentions.members.first();
  if (!user) return message.reply({ embeds: [errorEmbed('Usage', '`ticket add @user`')] });
  await message.channel.permissionOverwrites.edit(user, { ViewChannel: true, SendMessages: true });
  message.reply({ embeds: [successEmbed('Ajouté', `${user} a été ajouté au ticket.`)] });
}

async function removeUser(message, args, client) {
  const user = message.mentions.members.first();
  if (!user) return message.reply({ embeds: [errorEmbed('Usage', '`ticket remove @user`')] });
  await message.channel.permissionOverwrites.edit(user, { ViewChannel: false });
  message.reply({ embeds: [successEmbed('Retiré', `${user} a été retiré du ticket.`)] });
}

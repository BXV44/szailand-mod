const { EmbedBuilder, ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { loadData, saveData } = require('../utils/dataManager');

const TICKET_GIF = 'https://cdn.discordapp.com/attachments/1507726296220700902/1507930432694648873/tenor.gif?ex=6a1459e7&is=6a130867&hm=4397ad0c2675d17914f0c9843ed05217383bb52145a3c356201728bc99b067a4&';

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'ticket_open') {
      await interaction.deferReply({ ephemeral: true });
      const guild = interaction.guild;
      const config = loadData('tickets.json', {})[guild.id];
      const activeTickets = loadData('active_tickets.json', {});

      // Check if user already has open ticket
      const existing = Object.values(activeTickets).find(
        t => t.userId === interaction.user.id && t.guildId === guild.id
      );
      if (existing) {
        const ch = guild.channels.cache.get(existing.channelId);
        return interaction.editReply({ content: `Tu as déjà un ticket ouvert: ${ch || 'Introuvable'}` });
      }

      const count = (config?.count || 0) + 1;
      const name = `ticket-${String(count).padStart(4, '0')}-${interaction.user.username.slice(0, 10)}`;

      const overwrites = [
        { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
      ];
      if (config?.supportRoleId) {
        const supportRole = guild.roles.cache.get(config.supportRoleId);
        if (supportRole) overwrites.push({ id: supportRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
      }

      const channel = await guild.channels.create({
        name,
        type: ChannelType.GuildText,
        permissionOverwrites: overwrites,
      });

      // Save ticket
      const ticketId = `${guild.id}-${Date.now()}`;
      activeTickets[ticketId] = { id: ticketId, channelId: channel.id, userId: interaction.user.id, guildId: guild.id };
      saveData('active_tickets.json', activeTickets);

      // Update count
      const tickets = loadData('tickets.json', {});
      if (tickets[guild.id]) { tickets[guild.id].count = count; saveData('tickets.json', tickets); }

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('🎫 Ticket Ouvert')
        .setDescription(`Bienvenue <@${interaction.user.id}> !\nUn membre de l'équipe sera disponible sous peu.\n\nExplique ton problème en détail.`)
        .setImage(TICKET_GIF)
        .setFooter({ text: `Ticket #${count}` })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket_close_btn').setLabel('🔒 Fermer').setStyle(ButtonStyle.Danger)
      );

      await channel.send({ content: `<@${interaction.user.id}>${config?.supportRoleId ? ` <@&${config.supportRoleId}>` : ''}`, embeds: [embed], components: [row] });
      interaction.editReply({ content: `✅ Ton ticket a été créé: ${channel}` });
    }

    if (interaction.customId === 'ticket_close_btn') {
      await interaction.reply({ content: '🔒 Fermeture du ticket dans 5 secondes...' });
      const activeTickets = loadData('active_tickets.json', {});
      const key = Object.keys(activeTickets).find(k => activeTickets[k].channelId === interaction.channel.id);
      if (key) { delete activeTickets[key]; saveData('active_tickets.json', activeTickets); }
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }

    if (interaction.customId === 'ticket_info') {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle('ℹ️ Informations Tickets').setDescription('Les tickets sont là pour communiquer en privé avec l\'équipe.\n\n**Ne pas abuse du système de tickets.**').setTimestamp()],
        ephemeral: true,
      });
    }
  },
};

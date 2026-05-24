const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActivityType,
  PermissionFlagsBits,
} = require('discord.js');

// ─── Config ───────────────────────────────────────────
const TOKEN              = process.env.TOKEN;
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID;
const SZAILAND_ID        = '1505662196665811024';
const INVITE             = 'discord.gg/Zhq5cJUkR5';
const PREFIX             = '+';
const ROLE_NAME          = 'ACCES BOT';

if (!TOKEN) { console.error('❌  TOKEN manquant dans Railway !'); process.exit(1); }

// ─── Blacklist (en mémoire – reset au restart) ─────────
const blacklist = new Set();

// ─── Client ───────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
  ],
});

// ─── Embeds helpers ───────────────────────────────────
const ok  = (desc) => new EmbedBuilder().setColor(0x57F287).setDescription(desc).setTimestamp();
const err = (desc) => new EmbedBuilder().setColor(0xED4245).setDescription(desc).setTimestamp();

// ─── Vérifie si l'user est dans szailand + a ACCES BOT ─
async function checkAccess(userId) {
  const szailand = client.guilds.cache.get(SZAILAND_ID);
  if (!szailand) return { ok: false, reason: 'guild' };

  const member = await szailand.members.fetch(userId).catch(() => null);
  if (!member) return { ok: false, reason: 'notMember' };

  const role = szailand.roles.cache.find(r => r.name === ROLE_NAME);
  if (!role || !member.roles.cache.has(role.id)) return { ok: false, reason: 'noRole' };

  return { ok: true };
}

// ─── READY ────────────────────────────────────────────
client.once('ready', () => {
  console.log('\n' + '═'.repeat(50));
  console.log('  ✅  Bot Mod connecté  : ' + client.user.tag);
  console.log('  🔗  Status            : .gg/szailand');
  console.log('═'.repeat(50) + '\n');
  client.user.setActivity('.gg/szailand', { type: ActivityType.Watching });
});

// ─── WELCOME ──────────────────────────────────────────
client.on('guildMemberAdd', async (member) => {
  if (!WELCOME_CHANNEL_ID) return;
  const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
  if (!channel) return;
  try {
    const msg = await channel.send(member.toString());
    setTimeout(() => msg.delete().catch(() => {}), 3000);
  } catch (e) {
    console.error('Welcome error:', e.message);
  }
});

// ─── COMMANDES ────────────────────────────────────────
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args    = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // Blacklist check
  if (blacklist.has(message.author.id)) {
    return message.reply({ embeds: [err('> ❌  Tu es dans la **blacklist** du bot.')] });
  }

  // +help ne nécessite pas d'accès complet
  if (command === 'help') {
    return message.reply({ embeds: [
      new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('📋 Commandes')
        .setDescription('Préfixe : `+`')
        .addFields(
          { name: '🔨 Modération', value: '> `+ban` `+unban` `+bl` `+unbl`\n> *(Nécessite le rôle Admin sur le serveur)*', inline: false },
          { name: '❓ Aide',        value: '> `+help`', inline: false },
        )
        .setFooter({ text: 'discord.gg/szailand  •  ' + INVITE })
        .setTimestamp()
    ] });
  }

  // Vérification accès pour toutes les autres commandes
  const access = await checkAccess(message.author.id);
  if (!access.ok) {
    return message.reply({ embeds: [
      new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle('❌  Accès refusé')
        .setDescription(
          access.reason === 'notMember'
            ? '> Tu dois rejoindre le serveur pour utiliser ce bot.\n> 🔗 **' + INVITE + '**'
            : '> Tu dois avoir le rôle **ACCES BOT** sur le serveur.\n> Mets **discord.gg/szailand** dans ton status Discord !'
        )
        .setFooter({ text: 'Rejoindre → ' + INVITE })
        .setTimestamp()
    ] });
  }

  // ── +ban ──────────────────────────────────────────
  if (command === 'ban') {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator))
      return message.reply({ embeds: [err('> Tu dois être **Administrateur** sur ce serveur.')] });

    const target = message.mentions.members?.first()
      || await message.guild.members.fetch(args[0]).catch(() => null);

    if (!target)
      return message.reply({ embeds: [err('> Membre introuvable.')] });
    if (!target.bannable)
      return message.reply({ embeds: [err('> Je ne peux pas bannir ce membre (rôle supérieur au mien).')] });
    if (target.id === message.author.id)
      return message.reply({ embeds: [err('> Tu ne peux pas te bannir toi-même.')] });

    const reason = args.slice(1).join(' ') || 'Aucune raison fournie';

    try {
      await target.send({ embeds: [
        new EmbedBuilder().setColor(0xED4245)
          .setTitle('🔨 Tu as été banni')
          .setDescription('> **Serveur :** ' + message.guild.name + '\n> **Raison :** ' + reason)
          .setTimestamp()
      ] }).catch(() => {});
      await target.ban({ reason });
    } catch {
      return message.reply({ embeds: [err('> Impossible de bannir ce membre.')] });
    }

    message.reply({ embeds: [ok(
      '> 🔨 **' + target.user.tag + '** a été banni.\n' +
      '> 📝 Raison : ' + reason + '\n' +
      '> 🛡️ Modérateur : ' + message.author.tag
    )] });
  }

  // ── +unban ─────────────────────────────────────────
  else if (command === 'unban') {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator))
      return message.reply({ embeds: [err('> Tu dois être **Administrateur** sur ce serveur.')] });

    const targetId = args[0];
    if (!targetId)
      return message.reply({ embeds: [err('> Fournis l\'ID de l\'utilisateur à débannir.\n> Utilisation : `+unban <ID>`')] });

    const ban = await message.guild.bans.fetch(targetId).catch(() => null);
    if (!ban)
      return message.reply({ embeds: [err('> Cet utilisateur n\'est pas banni sur ce serveur.')] });

    await message.guild.members.unban(targetId);
    message.reply({ embeds: [ok('> 🔓 **' + ban.user.tag + '** a été débanni.\n> 🛡️ Modérateur : ' + message.author.tag)] });
  }

  // ── +bl (blacklist) ────────────────────────────────
  else if (command === 'bl') {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator))
      return message.reply({ embeds: [err('> Tu dois être **Administrateur** sur ce serveur.')] });

    const target = message.mentions.users.first()
      || await client.users.fetch(args[0]).catch(() => null);

    if (!target)
      return message.reply({ embeds: [err('> Utilisateur introuvable.')] });
    if (blacklist.has(target.id))
      return message.reply({ embeds: [err('> Cet utilisateur est déjà dans la blacklist.')] });

    blacklist.add(target.id);
    message.reply({ embeds: [ok('> 🚫 **' + target.tag + '** a été ajouté à la blacklist.\n> Il ne peut plus utiliser le bot.')] });
  }

  // ── +unbl (unblacklist) ────────────────────────────
  else if (command === 'unbl') {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator))
      return message.reply({ embeds: [err('> Tu dois être **Administrateur** sur ce serveur.')] });

    const target = message.mentions.users.first()
      || await client.users.fetch(args[0]).catch(() => null);

    if (!target)
      return message.reply({ embeds: [err('> Utilisateur introuvable.')] });
    if (!blacklist.has(target.id))
      return message.reply({ embeds: [err('> Cet utilisateur n\'est pas dans la blacklist.')] });

    blacklist.delete(target.id);
    message.reply({ embeds: [ok('> ✅ **' + target.tag + '** a été retiré de la blacklist.')] });
  }
});

process.on('unhandledRejection', e => console.error('❌ unhandledRejection:', e));
process.on('uncaughtException',  e => console.error('❌ uncaughtException:',  e));

client.login(TOKEN);

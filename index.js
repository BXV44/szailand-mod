const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { loadPrefix } = require('./utils/dataManager');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction],
});

client.commands = new Collection();

// Load all command folders
const commandFolders = ['antiraid', 'backup', 'bot_gestion', 'gestion', 'moderation', 'utilitaire', 'welcome'];

function registerCommand(cmd) {
  if (!cmd || !cmd.name) return;
  client.commands.set(cmd.name, cmd);
  if (cmd.aliases) cmd.aliases.forEach(a => client.commands.set(a, cmd));
}

for (const folder of commandFolders) {
  const folderPath = path.join(__dirname, folder);
  if (!fs.existsSync(folderPath)) continue;
  const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const mod = require(path.join(folderPath, file));
    // Support both single export and named exports
    if (mod.name) {
      registerCommand(mod);
    } else {
      // Named exports (e.g., module.exports.ban = {...})
      Object.values(mod).forEach(cmd => {
        if (typeof cmd === 'object' && cmd.name) registerCommand(cmd);
      });
    }
  }
}

// Load events
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));
  for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  }
}

const token = process.env.TOKEN;
if (!token) {
  console.error('❌ Aucun TOKEN trouvé dans les variables d\'environnement !');
  console.error('👉 Ajoute TOKEN dans les variables Railway.');
  process.exit(1);
}

client.login(token);

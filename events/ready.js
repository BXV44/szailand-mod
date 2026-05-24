module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
    client.user.setPresence({
      activities: [{ name: `${process.env.PREFIX || '!'}help | Modération`, type: 3 }],
      status: 'dnd',
    });
  },
};

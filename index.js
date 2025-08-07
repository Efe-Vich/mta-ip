const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const Gamedig = require("gamedig");
const config = require("./config.json");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

let statusMessage;

async function updatePresence(playersCount) {
  try {
    await client.user.setPresence({
      activities: [{ name: `Sunucuda ${playersCount} oyuncu`, type: 0 }]
    });
  } catch (err) {
    console.error("Presence güncellenemedi:", err);
  }
}

async function updateEmbed() {
  try {
    const state = await Gamedig.query({
      type: "mtasa",
      host: config.server.ip,
      port: config.server.port
    });

    const players = state.players;
    const playerList = players.length
      ? players.map((p, i) => `${i + 1}. ${p.name || "Bilinmiyor"}`).join("\n")
      : "Aktif oyuncu yok";

    const embed = new EmbedBuilder()
      .setColor("#00008B")
      .setTitle("🎮 Sunucu Durumu")
      .addFields(
        { name: "Durum", value: "🟢 Çevrimiçi", inline: true },
        { name: "Harita", value: state.map || "Bilinmiyor", inline: true },
        { name: "Oyuncular", value: `${players.length}/${state.maxplayers}`, inline: true },
        { name: "Gecikme", value: `${state.ping} ms`, inline: true },
        { name: "IP", value: `\`${config.server.ip}:${config.server.port}\`` },
        { name: `Aktif Oyuncular (${players.length})`, value: playerList }
      )
      .setFooter({ text: new Date().toLocaleString("tr-TR") });

    const channel = await client.channels.fetch(config.channelId);
    if (!channel) {
      console.error("Belirtilen kanal bulunamadı!");
      return;
    }

    if (!statusMessage) {
      statusMessage = await channel.send({ embeds: [embed] });
    } else {
      await statusMessage.edit({ embeds: [embed] });
    }

    await updatePresence(players.length);

  } catch (error) {
    console.error("Sunucuya ulaşılamadı:", error);
    await updatePresence(0);
  }
}

client.once("ready", async () => {
  console.log(`[BOT] ${client.user.tag} aktif.`);
  await updateEmbed();

  setInterval(async () => {
    await updateEmbed();
  }, config.duration || 60000);
});

client.on('messageCreate', message => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();
  const triggers = [
    "ip",
    "ip ne",
    "ip ver",
    "ip ney",
    "nasıl girebilirim",
    "sunucuya nasıl girerim",
    "ip varmı"
  ];

  if (triggers.includes(content)) {
    message.channel.send(`🌐 Sunucu IP Adresi: \`${config.server.ip}:${config.server.port}\``);
  }
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

client.login(config.token);

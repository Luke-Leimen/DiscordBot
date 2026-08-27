const { Client, GatewayIntentBits, Collection, ChannelType } = require('discord.js');
const { readdirSync } = require('fs');
const config    = (() => { try { return require('./config.json'); } catch { return {}; } })();
const state     = require('./state');
const db        = require('./database/db');
const webServer = require('./web/server');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    // GatewayIntentBits.GuildMembers, // Aktiviere in Discord Developer Portal → Bot → Server Members Intent
  ]
});

state.client = client;
client.commands = new Collection();

const commandFiles = readdirSync('./commands').filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

client.once('clientReady', async (c) => {
  console.log(`Logged in as ${c.user.tag}`);
  state.startTime = Date.now();
  state.sessionId = db.startSession();

  const guildId = process.env.GUILD_ID || config.GUILD_ID;
  const commandData = client.commands.map(cmd => cmd.data.toJSON());
  await client.guilds.cache.get(guildId).commands.set(commandData);
  console.log(`${commandData.length} Slash Commands registriert.`);
});

client.on('guildMemberAdd', (member) => {
  db.logMemberEvent('join', member.id, member.user.username, member.guild.id);
});

client.on('guildMemberRemove', (member) => {
  db.logMemberEvent('leave', member.id, member.user.username, member.guild.id);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.type !== ChannelType.DM) return;

  console.log(`DM von ${message.author.username} (${message.author.id}): ${message.content}`);

  const logChannelId = process.env.DM_LOG_CHANNEL_ID || config.DM_LOG_CHANNEL_ID;
  if (!logChannelId) return;

  const logChannel = await client.channels.fetch(logChannelId).catch(() => null);
  if (!logChannel) return;

  logChannel.send(`📩 **DM von ${message.author.username}** (\`${message.author.id}\`):\n${message.content}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  db.logCommand(
    interaction.commandName,
    interaction.user.id,
    interaction.user.username,
    interaction.guildId,
    interaction.channelId
  );

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    const msg = { content: 'Fehler beim Ausführen des Commands.', flags: 64 };
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(msg);
      } else {
        await interaction.reply(msg);
      }
    } catch { /* Interaction abgelaufen */ }
  }
});

function shutdown() {
  if (state.sessionId) db.endSession(state.sessionId);
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

const PORT = process.env.PORT || config.WEB_PORT || 3000;
webServer.start(PORT);

client.login(process.env.BOT_TOKEN || config.BOT_TOKEN);

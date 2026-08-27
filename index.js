const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { readdirSync } = require('fs');
const config = require('./config.json');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

client.commands = new Collection();

const commandFiles = readdirSync('./commands').filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

client.once('clientReady', async (c) => {
  console.log(`Logged in as ${c.user.tag}`);

  const commandData = client.commands.map(cmd => cmd.data.toJSON());
  await client.guilds.cache.get(config.GUILD_ID).commands.set(commandData);
  console.log(`${commandData.length} Slash Commands registriert.`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'Fehler beim Ausführen des Commands.', ephemeral: true });
  }
});

client.login(config.BOT_TOKEN);

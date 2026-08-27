const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Antwortet mit Pong!'),

  async execute(interaction) {
    const time = Date.now() - interaction.createdTimestamp;
    await interaction.reply(`Pong! (${time}ms)`);
  }
};

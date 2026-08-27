const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('Antwortet mit Testen!'),

  async execute(interaction) {
    await interaction.reply('Testen!');
  }
};

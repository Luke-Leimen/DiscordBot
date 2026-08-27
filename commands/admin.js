const { SlashCommandBuilder } = require('discord.js');
const config = require('../config.json');
const tokens = require('../web/tokens');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Öffnet das Admin-Dashboard (nur für Admins)'),

  async execute(interaction) {
    const adminRoleId = process.env.ADMIN_ROLE_ID || config.ADMIN_ROLE_ID;

    if (!adminRoleId) {
      return interaction.reply({ content: '⚠️ Keine Admin-Rolle in der Config hinterlegt.', ephemeral: true });
    }

    if (!interaction.member.roles.cache.has(adminRoleId)) {
      return interaction.reply({ content: '❌ Du hast keine Berechtigung für diesen Befehl.', ephemeral: true });
    }

    const token = tokens.create();
    const baseUrl = process.env.WEB_URL || config.WEB_URL || `http://localhost:${process.env.PORT || config.WEB_PORT || 3000}`;
    const url = `${baseUrl}/admin.html?token=${token}`;

    await interaction.reply({
      content: `🔑 **Admin Panel** — Link ist 1 Stunde gültig:\n${url}`,
      ephemeral: true,
    });
  },
};

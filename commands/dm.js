const { SlashCommandBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dm')
    .setDescription('Schickt einer Person eine Direktnachricht (nur für Admins)')
    .addStringOption(option =>
      option
        .setName('user_id')
        .setDescription('Die Discord User-ID der Zielperson')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('nachricht')
        .setDescription('Die Nachricht, die gesendet werden soll')
        .setRequired(true)
    ),

  async execute(interaction) {
    const adminRoleId = process.env.ADMIN_ROLE_ID || config.ADMIN_ROLE_ID;

    if (adminRoleId && !interaction.member.roles.cache.has(adminRoleId)) {
      return interaction.reply({ content: '❌ Du hast keine Berechtigung für diesen Befehl.', flags: 64 });
    }

    await interaction.deferReply({ flags: 64 });

    const userId = interaction.options.getString('user_id');
    const nachricht = interaction.options.getString('nachricht');

    let user;
    try {
      user = await interaction.client.users.fetch(userId);
    } catch {
      return interaction.editReply({ content: '❌ Nutzer mit dieser ID nicht gefunden.' });
    }

    try {
      await user.send(nachricht);
      await interaction.editReply({ content: `✅ Nachricht an **${user.username}** (${user.id}) gesendet.` });
    } catch {
      await interaction.editReply({ content: `❌ Konnte keine DM an **${user.username}** schicken — möglicherweise hat die Person DMs deaktiviert.` });
    }
  },
};

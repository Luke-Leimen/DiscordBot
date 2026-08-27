const { SlashCommandBuilder } = require('discord.js');
const config = (() => { try { return require('../config.json'); } catch { return {}; } })();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('spam')
    .setDescription('Schickt einer Person x Nachrichten (nur für Admins)')
    .addStringOption(option =>
      option
        .setName('user_id')
        .setDescription('Die Discord User-ID der Zielperson')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('anzahl')
        .setDescription('Wie viele Nachrichten geschickt werden sollen')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    ),

  async execute(interaction) {
    const adminRoleId = process.env.ADMIN_ROLE_ID || config.ADMIN_ROLE_ID;

    if (adminRoleId && !interaction.member.roles.cache.has(adminRoleId)) {
      return interaction.reply({ content: '❌ Du hast keine Berechtigung für diesen Befehl.', flags: 64 });
    }

    await interaction.deferReply({ flags: 64 });

    const userId = interaction.options.getString('user_id');
    const anzahl = interaction.options.getInteger('anzahl');

    let user;
    try {
      user = await interaction.client.users.fetch(userId);
    } catch {
      return interaction.editReply({ content: '❌ Nutzer mit dieser ID nicht gefunden.' });
    }

    let gesendet = 0;
    for (let i = 1; i <= anzahl; i++) {
      try {
        await user.send(String(i));
        gesendet++;
      } catch {
        break;
      }
    }

    if (gesendet === anzahl) {
      await interaction.editReply({ content: `✅ ${anzahl} Nachrichten an **${user.username}** gesendet.` });
    } else if (gesendet === 0) {
      await interaction.editReply({ content: `❌ Konnte keine DM an **${user.username}** schicken — möglicherweise hat die Person DMs deaktiviert.` });
    } else {
      await interaction.editReply({ content: `⚠️ Nur ${gesendet} von ${anzahl} Nachrichten gesendet — danach fehlgeschlagen.` });
    }
  },
};

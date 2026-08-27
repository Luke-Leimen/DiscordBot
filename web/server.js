const express = require('express');
const path    = require('path');
const db      = require('../database/db');
const state   = require('../state');
const tokens  = require('./tokens');
const config  = require('../config.json');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function checkAdmin(req, res) {
  const token = req.headers['x-admin-token'];
  if (!token || !tokens.verify(token)) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

// ── Public endpoints ─────────────────────────────────────────────────────────

app.get('/api/stats', (req, res) => {
  const stats = db.getOverviewStats();
  let online = false;
  let memberCount = null;
  if (state.client && state.client.isReady()) {
    online = true;
    const guildId = process.env.GUILD_ID || config.GUILD_ID;
    const guild = state.client.guilds.cache.get(guildId);
    if (guild) memberCount = guild.memberCount;
  }
  res.json({ ...stats, online, memberCount });
});

app.get('/api/activity', (req, res) => {
  const days = Math.min(parseInt(req.query.days) || 30, 365);
  res.json(db.getActivityByDay(days));
});

app.get('/api/commands', (req, res) => {
  const days = parseInt(req.query.days) || 30;
  res.json(db.getTopCommands(days));
});

app.get('/api/members', (req, res) => {
  const days = parseInt(req.query.days) || 30;
  res.json(db.getMemberActivity(days));
});

app.get('/api/recent', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 500);
  res.json(db.getRecentLogs(limit, 0));
});

// ── Admin endpoints ───────────────────────────────────────────────────────────

app.get('/api/admin/verify', (req, res) => {
  if (!checkAdmin(req, res)) return;
  res.json({ ok: true });
});

app.get('/api/admin/logs', (req, res) => {
  if (!checkAdmin(req, res)) return;
  const limit  = Math.min(parseInt(req.query.limit)  || 50, 200);
  const offset = parseInt(req.query.offset) || 0;
  res.json(db.getRecentLogs(limit, offset));
});

app.get('/api/admin/users', (req, res) => {
  if (!checkAdmin(req, res)) return;
  const days = parseInt(req.query.days) || 0;
  res.json(db.getTopUsers(days));
});

app.get('/api/admin/user/:id', (req, res) => {
  if (!checkAdmin(req, res)) return;
  res.json(db.getUserHistory(req.params.id));
});

app.get('/api/admin/member-events', (req, res) => {
  if (!checkAdmin(req, res)) return;
  res.json(db.getMemberEvents());
});

function start(port) {
  app.listen(port, () => console.log(`Dashboard läuft auf http://localhost:${port}`));
}

module.exports = { start };

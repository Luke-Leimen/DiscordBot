const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'bot.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS command_logs (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    command   TEXT    NOT NULL,
    user_id   TEXT    NOT NULL,
    username  TEXT    NOT NULL,
    guild_id  TEXT,
    channel_id TEXT,
    timestamp INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS member_events (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT    NOT NULL,
    user_id    TEXT    NOT NULL,
    username   TEXT    NOT NULL,
    guild_id   TEXT    NOT NULL,
    timestamp  INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS bot_sessions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    start_time INTEGER NOT NULL,
    end_time   INTEGER
  );
`);

const stmts = {
  insertCommand: db.prepare(
    'INSERT INTO command_logs (command, user_id, username, guild_id, channel_id, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
  ),
  insertMember: db.prepare(
    'INSERT INTO member_events (event_type, user_id, username, guild_id, timestamp) VALUES (?, ?, ?, ?, ?)'
  ),
  startSession: db.prepare('INSERT INTO bot_sessions (start_time) VALUES (?)'),
  endSession:   db.prepare('UPDATE bot_sessions SET end_time = ? WHERE id = ?'),
};

function logCommand(command, userId, username, guildId, channelId) {
  stmts.insertCommand.run(command, userId, username, guildId || null, channelId || null, Date.now());
}

function logMemberEvent(type, userId, username, guildId) {
  stmts.insertMember.run(type, userId, username, guildId, Date.now());
}

function startSession() {
  return stmts.startSession.run(Date.now()).lastInsertRowid;
}

function endSession(id) {
  stmts.endSession.run(Date.now(), id);
}

function getOverviewStats() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return {
    totalCommands:  db.prepare('SELECT COUNT(*) as n FROM command_logs').get().n,
    uniqueUsers:    db.prepare('SELECT COUNT(DISTINCT user_id) as n FROM command_logs').get().n,
    commandsToday:  db.prepare('SELECT COUNT(*) as n FROM command_logs WHERE timestamp >= ?').get(todayStart.getTime()).n,
    lastSession:    db.prepare('SELECT * FROM bot_sessions ORDER BY id DESC LIMIT 1').get() || null,
  };
}

function getActivityByDay(days) {
  const since = days > 0 ? Date.now() - days * 86400000 : 0;
  return db.prepare(`
    SELECT date(timestamp/1000, 'unixepoch', 'localtime') AS day, COUNT(*) AS count
    FROM command_logs WHERE timestamp >= ?
    GROUP BY day ORDER BY day
  `).all(since);
}

function getTopCommands(days) {
  const since = days > 0 ? Date.now() - days * 86400000 : 0;
  return db.prepare(`
    SELECT command, COUNT(*) AS count FROM command_logs
    WHERE timestamp >= ?
    GROUP BY command ORDER BY count DESC LIMIT 10
  `).all(since);
}

function getMemberActivity(days) {
  const since = days > 0 ? Date.now() - days * 86400000 : 0;
  return db.prepare(`
    SELECT date(timestamp/1000, 'unixepoch', 'localtime') AS day, event_type, COUNT(*) AS count
    FROM member_events WHERE timestamp >= ?
    GROUP BY day, event_type ORDER BY day
  `).all(since);
}

function getTopUsers(days, limit = 50) {
  const since = days > 0 ? Date.now() - days * 86400000 : 0;
  return db.prepare(`
    SELECT username, user_id, COUNT(*) AS count FROM command_logs
    WHERE timestamp >= ?
    GROUP BY user_id ORDER BY count DESC LIMIT ?
  `).all(since, limit);
}

function getRecentLogs(limit = 50, offset = 0) {
  return db.prepare(
    'SELECT * FROM command_logs ORDER BY timestamp DESC LIMIT ? OFFSET ?'
  ).all(limit, offset);
}

function getUserHistory(userId) {
  return db.prepare(
    'SELECT * FROM command_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT 200'
  ).all(userId);
}

function getMemberEvents(limit = 200) {
  return db.prepare(
    'SELECT * FROM member_events ORDER BY timestamp DESC LIMIT ?'
  ).all(limit);
}

module.exports = {
  logCommand, logMemberEvent, startSession, endSession,
  getOverviewStats, getActivityByDay, getTopCommands,
  getMemberActivity, getTopUsers, getRecentLogs,
  getUserHistory, getMemberEvents,
};

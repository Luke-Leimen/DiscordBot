const crypto = require('crypto');

// In-memory token store: token -> expiry timestamp
const sessions = new Map();

function create() {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + 3600000); // 1 hour
  // Cleanup expired tokens
  for (const [t, exp] of sessions) {
    if (exp < Date.now()) sessions.delete(t);
  }
  return token;
}

function verify(token) {
  const exp = sessions.get(token);
  if (!exp) return false;
  if (exp < Date.now()) { sessions.delete(token); return false; }
  return true;
}

module.exports = { create, verify };

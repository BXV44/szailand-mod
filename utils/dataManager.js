const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadData(file, defaultVal = {}) {
  ensureDir();
  const fp = path.join(DATA_DIR, file);
  if (!fs.existsSync(fp)) return defaultVal;
  try { return JSON.parse(fs.readFileSync(fp, 'utf8')); } catch { return defaultVal; }
}

function saveData(file, data) {
  ensureDir();
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
}

function loadPrefix(guildId) {
  const prefixes = loadData('prefixes.json');
  return prefixes[guildId] || process.env.PREFIX || '!';
}

function savePrefix(guildId, prefix) {
  const prefixes = loadData('prefixes.json');
  prefixes[guildId] = prefix;
  saveData('prefixes.json', prefixes);
}

// Blacklist
function isBlacklisted(userId) {
  const bl = loadData('blacklist.json', { users: [] });
  return bl.users.includes(userId);
}
function addBlacklist(userId) {
  const bl = loadData('blacklist.json', { users: [] });
  if (!bl.users.includes(userId)) bl.users.push(userId);
  saveData('blacklist.json', bl);
}
function removeBlacklist(userId) {
  const bl = loadData('blacklist.json', { users: [] });
  bl.users = bl.users.filter(u => u !== userId);
  saveData('blacklist.json', bl);
}

// Owners
const OWNERS = [
  process.env.OWNER1 || '1222217828770516992',
  process.env.OWNER2 || '1371573736054194356',
].filter(Boolean);

function isOwner(userId) { return OWNERS.includes(userId); }
function getOwners() { return OWNERS; }

// Whitelist / admins
function getWhitelist(guildId) {
  const wl = loadData('whitelist.json', {});
  return wl[guildId] || [];
}
function addWhitelist(guildId, userId) {
  const wl = loadData('whitelist.json', {});
  if (!wl[guildId]) wl[guildId] = [];
  if (!wl[guildId].includes(userId)) wl[guildId].push(userId);
  saveData('whitelist.json', wl);
}
function removeWhitelist(guildId, userId) {
  const wl = loadData('whitelist.json', {});
  if (!wl[guildId]) return;
  wl[guildId] = wl[guildId].filter(u => u !== userId);
  saveData('whitelist.json', wl);
}
function isWhitelisted(guildId, userId) {
  return getWhitelist(guildId).includes(userId) || isOwner(userId);
}

module.exports = {
  loadData, saveData,
  loadPrefix, savePrefix,
  isBlacklisted, addBlacklist, removeBlacklist,
  isOwner, getOwners,
  getWhitelist, addWhitelist, removeWhitelist, isWhitelisted,
  OWNERS,
};

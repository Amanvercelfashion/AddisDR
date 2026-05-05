const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data.json');

const defaultData = {
  categories: [],
  hoods: [],
  businesses: [],
  products: [],
  featured_items: [],
  ratings: [],
  reports: [],
  users: [],
  _counters: {
    categories: 0,
    hoods: 0,
    businesses: 0,
    products: 0,
    featured_items: 0,
    ratings: 0,
    reports: 0,
    users: 0
  }
};

let data = null;

function load() {
  if (fs.existsSync(dbPath)) {
    try {
      data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      console.log('✅ Database loaded');
    } catch (e) {
      console.error('Failed to parse database, starting fresh:', e.message);
      data = JSON.parse(JSON.stringify(defaultData));
    }
  } else {
    data = JSON.parse(JSON.stringify(defaultData));
    save();
    console.log('✅ New database created');
  }
}

function save() {
  if (!data) return;
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function get() {
  if (!data) load();
  return data;
}

function nextId(table) {
  if (!data) load();
  data._counters[table] = (data._counters[table] || 0) + 1;
  return data._counters[table];
}

// Auto-save every 10 seconds
setInterval(save, 10000);

process.on('exit', save);
process.on('SIGINT', () => { save(); process.exit(0); });
process.on('SIGTERM', () => { save(); process.exit(0); });

module.exports = { get, save, load, nextId };

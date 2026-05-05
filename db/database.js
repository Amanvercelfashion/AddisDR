const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data.json');

// Default empty database structure
const defaultData = {
  categories: [],
  hoods: [],
  businesses: [],
  featured_items: [],
  ratings: [],
  reports: [],
  users: [],
  _counters: {
    categories: 0,
    hoods: 0,
    businesses: 0,
    featured_items: 0,
    ratings: 0,
    reports: 0,
    users: 0
  }
};

let data = defaultData;

// Load database
function load() {
  if (fs.existsSync(dbPath)) {
    const raw = fs.readFileSync(dbPath, 'utf8');
    data = JSON.parse(raw);
    console.log('✅ Database loaded');
  } else {
    save();
    console.log('✅ New database created');
  }
}

// Save database
function save() {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// Auto-save every 5 seconds
setInterval(save, 5000);

// Save on exit
process.on('exit', save);
process.on('SIGINT', () => {
  save();
  process.exit(0);
});

// Helper to get next ID
function nextId(table) {
  data._counters[table]++;
  return data._counters[table];
}

module.exports = {
  get: () => data,
  save,
  load,
  nextId
};

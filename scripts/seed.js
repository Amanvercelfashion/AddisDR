const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  }
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: { transport: require('ws') },
});

const dataPath = path.resolve(__dirname, '..', 'api', 'data.json');
const seedData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

const TABLES = ['categories', 'hoods', 'businesses', 'products', 'featured_items', 'users', 'ratings', 'reports'];

async function insertTable(table, records) {
  const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (count > 0) {
    console.log(`  ${table}: ${count} records already exist, skipping`);
    return;
  }

  const rows = records.map(r => {
    const { id, ...rest } = r;
    return rest;
  });

  const { error } = await supabase.from(table).insert(rows);
  if (error) {
    console.error(`  ${table}: ERROR - ${error.message}`);
  } else {
    console.log(`  ${table}: ${rows.length} records inserted`);
  }
}

async function seed() {
  console.log('Seeding Supabase database...\n');

  for (const table of TABLES) {
    const records = seedData[table];
    if (!records || records.length === 0) {
      console.log(`  ${table}: no records found, skipping`);
      continue;
    }
    await insertTable(table, records);
  }

  console.log('\nDone!');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});

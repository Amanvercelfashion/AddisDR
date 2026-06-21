const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = Object.fromEntries(
  envContent.split('\n').filter(l => l.trim() && !l.startsWith('#')).map(l => {
    const idx = l.indexOf('=');
    return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
  })
);

const supabaseUrl = env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function sql(query) {
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({ query }),
  });
  return res.json();
}

async function main() {
  // 1. Upload logo to storage
  const filePath = path.resolve(__dirname, '..', 'frontend', 'public', 'images', 'addisdr-logo.svg');
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = `logo-${Date.now()}.svg`;

  const { error: uploadError } = await supabase.storage
    .from('uploads')
    .upload(fileName, fileBuffer, { contentType: 'image/svg+xml', upsert: true });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('uploads').getPublicUrl(fileName);
  const publicUrl = data.publicUrl;
  console.log('Logo uploaded to:', publicUrl);

  // 2. Create site_settings table if missing (via raw SQL endpoint)
  const tableSql = `
    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public read site settings" ON site_settings;
    CREATE POLICY "Public read site settings" ON site_settings FOR SELECT USING (true);
  `;
  const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({ sql: tableSql }),
  });

  if (!rpcRes.ok) {
    // If exec_sql RPC doesn't exist, try direct insert (table might already exist from SQL dump)
    console.log('Note: exec_sql RPC not available, assuming table exists from seed SQL.');
  }

  // 3. Upsert the logo URL
  const { error: dbError } = await supabase
    .from('site_settings')
    .upsert({ key: 'logo_url', value: publicUrl }, { onConflict: 'key' });

  if (dbError) {
    console.log('Could not write to site_settings:', dbError.message);
    console.log('You may need to create the site_settings table manually via Supabase SQL editor.');
    console.log('Logo URL to use:', publicUrl);
  } else {
    console.log('site_settings.logo_url saved:', publicUrl);
  }

  console.log('\nTo verify, restart your backend and check GET /api/settings');
}

main().catch(console.error);

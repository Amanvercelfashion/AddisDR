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

async function main() {
  // Execute raw SQL via Supabase management endpoint
  const sql = `
    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public read site settings" ON site_settings;
    CREATE POLICY "Public read site settings" ON site_settings FOR SELECT USING (true);
    INSERT INTO site_settings (key, value) VALUES ('logo_url', '')
    ON CONFLICT (key) DO NOTHING;
  `;

  // Try the Supabase SQL endpoint
  const res = await fetch(`${supabaseUrl}/sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  const text = await res.text();
  console.log('Status:', res.status, 'Response:', text.slice(0, 500));

  if (res.ok) {
    // Now update the logo URL
    const logoUrl = `${supabaseUrl}/storage/v1/object/public/uploads/logo-1782025248081.svg`;
    const { error } = await supabase
      .from('site_settings')
      .update({ value: logoUrl })
      .eq('key', 'logo_url');

    if (error) {
      console.log('Update error:', error.message);
    } else {
      console.log('site_settings.logo_url updated to:', logoUrl);
    }
  }
}

main().catch(console.error);

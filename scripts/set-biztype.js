const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
      if (!process.env[key]) process.env[key] = val;
    }
  }
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function main() {
  const { data: biz, error: fetchErr } = await supabase.from('businesses').select('id, name').order('id');
  if (fetchErr) { console.error('Fetch error:', fetchErr.message); process.exit(1); }
  if (!biz || biz.length === 0) { console.log('No businesses found'); return; }

  for (const b of biz) {
    const type = [13, 15, 16, 17].includes(b.id) ? 'product' : 'service';
    const { error } = await supabase.from('businesses').update({ business_type: type }).eq('id', b.id);
    if (error) {
      console.error(`Error updating ${b.id} (${b.name}): ${error.message}`);
    } else {
      console.log(`Set ${b.id} (${b.name}) → ${type}`);
    }
  }

  console.log('\nDone!');
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });

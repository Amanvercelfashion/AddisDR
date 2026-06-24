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

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('=== Current businesses ===');
  const { data: allBiz, error: bizErr } = await supabase
    .from('businesses')
    .select('id, name, website_link, category_id, hood_id')
    .order('id');
  if (bizErr) { console.error('Query error:', bizErr.message); process.exit(1); }
  console.table(allBiz);

  // 1. Delete example businesses (IDs 1-12 with example.com websites)
  const exampleIds = allBiz
    .filter(b => b.website_link && b.website_link.includes('example.com'))
    .map(b => b.id);

  if (exampleIds.length > 0) {
    console.log(`\nDeleting ${exampleIds.length} example businesses (IDs: ${exampleIds.join(', ')})...`);
    const { error: delErr } = await supabase
      .from('businesses')
      .delete()
      .in('id', exampleIds);
    if (delErr) { console.error('Delete error:', delErr.message); process.exit(1); }
    console.log('Deleted successfully (cascaded to products, featured_items, ratings, reports).');
  } else {
    console.log('\nNo example businesses found to delete.');
  }

  // 2. Assign categories and hoods to real businesses
  const updates = [
    { id: 13, category_id: 3,  hood_id: 6  }, // Aman furniture store → Furniture, Gerji
    { id: 14, category_id: 3,  hood_id: 1  }, // Home Comfort → Furniture, Bole
    { id: 15, category_id: 11, hood_id: 2  }, // Gift World → Gifts & Souvenirs, Megenagna
    { id: 16, category_id: 7,  hood_id: 1  }, // Gadget Pro → Electronics, Bole
    { id: 17, category_id: 6,  hood_id: 5  }, // Chic → Fashion, Sarbet
    { id: 18, category_id: 5,  hood_id: 1  }, // BrightCare Dental Clinic → Clinics, Bole
    { id: 19, category_id: 12, hood_id: 3  }, // LinguaBridge Tutoring → Education & Tutoring, Kazanchis
    { id: 20, category_id: 13, hood_id: 8  }, // Elevate Events and Fitness → Fitness & Recreation, Summit
    { id: 21, category_id: 8,  hood_id: 1  }, // Refined Grooming Lounge → Beauty & Spa, Bole
    { id: 22, category_id: 14, hood_id: 4  }, // Lens and Light Photography → Photography, Piassa
    { id: 23, category_id: 1,  hood_id: 2  }, // Savory Bites Restaurant → Restaurants, Megenagna
  ];

  for (const u of updates) {
    const { error } = await supabase
      .from('businesses')
      .update({ category_id: u.category_id, hood_id: u.hood_id })
      .eq('id', u.id);
    if (error) {
      console.error(`Update error for business ${u.id}: ${error.message}`);
    } else {
      console.log(`Updated business ${u.id} → category_id=${u.category_id}, hood_id=${u.hood_id}`);
    }
  }

  // 3. Verify final state
  console.log('\n=== Remaining businesses after migration ===');
  const { data: remaining } = await supabase
    .from('businesses')
    .select('id, name, website_link, category_id, hood_id')
    .order('id');
  console.table(remaining);

  console.log('\nDone!');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

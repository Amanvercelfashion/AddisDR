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

const featuredItems = [
  {
    business_id: 13,
    image_url: '/uploads/1780467552240-936640068.png',
    title: 'Modern Sofa Set',
    hook_text: 'Comfort meets style — premium sofa crafted for your living room.',
    exact_price: '35,000 ETB',
    location_text: 'Gerji'
  },
  {
    business_id: 14,
    image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80',
    title: 'Home Comfort Furniture',
    hook_text: 'Quality furniture and home decor to make your space truly comfortable.',
    exact_price: 'From 2,500 ETB',
    location_text: 'Bole'
  },
  {
    business_id: 15,
    image_url: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&q=80',
    title: 'Gift Box Special',
    hook_text: 'Unique gifts and souvenirs for every occasion — wrapped with care.',
    exact_price: 'From 200 ETB',
    location_text: 'Megenagna'
  },
  {
    business_id: 16,
    image_url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&q=80',
    title: 'Latest Gadgets',
    hook_text: 'Latest gadgets, accessories, and electronics at competitive prices.',
    exact_price: 'From 500 ETB',
    location_text: 'Bole'
  },
  {
    business_id: 17,
    image_url: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&q=80',
    title: 'Ethiopian Fashion',
    hook_text: 'Trendy fashion and apparel blending modern style with Ethiopian flair.',
    exact_price: '$$',
    location_text: 'Sarbet'
  },
  {
    business_id: 18,
    image_url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&q=80',
    title: 'Dental Checkup',
    hook_text: 'Comprehensive dental care with modern equipment and experienced dentists.',
    exact_price: 'From 500 ETB',
    location_text: 'Bole'
  },
  {
    business_id: 19,
    image_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80',
    title: 'Language Tutoring',
    hook_text: 'Language and academic tutoring bridging students to success.',
    exact_price: 'From 300 ETB/hr',
    location_text: 'Kazanchis'
  },
  {
    business_id: 20,
    image_url: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&q=80',
    title: 'Fitness Training',
    hook_text: 'Fitness training and event planning for a healthier, more vibrant lifestyle.',
    exact_price: 'From 1,000 ETB',
    location_text: 'Summit'
  },
  {
    business_id: 21,
    image_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80',
    title: 'Premium Grooming',
    hook_text: 'Premium grooming and barber services for the modern gentleman.',
    exact_price: 'From 250 ETB',
    location_text: 'Bole'
  },
  {
    business_id: 22,
    image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80',
    title: 'Photography Session',
    hook_text: 'Professional photography for events, portraits, and commercial projects.',
    exact_price: 'From 3,000 ETB',
    location_text: 'Piassa'
  },
  {
    business_id: 23,
    image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80',
    title: 'Savory Bites Platter',
    hook_text: 'Delicious local and international cuisine in a warm, inviting atmosphere.',
    exact_price: '$$',
    location_text: 'Megenagna'
  }
];

async function main() {
  console.log('Deleting existing featured items...');
  await supabase.from('featured_items').delete().neq('id', 0);

  console.log(`Inserting ${featuredItems.length} featured items...`);
  for (let i = 0; i < featuredItems.length; i++) {
    const item = featuredItems[i];
    const { error } = await supabase.from('featured_items').insert({
      ...item,
      created_at: new Date().toISOString()
    });
    if (error) {
      console.error(`Error inserting item ${i + 1} (business ${item.business_id}): ${error.message}`);
    } else {
      console.log(`  Inserted: ${item.title} (business ${item.business_id})`);
    }
  }

  // Verify
  const { data: result } = await supabase
    .from('featured_items')
    .select('*, businesses(name)')
    .order('id');
  console.log('\n=== Featured Items ===');
  console.table(result.map(r => ({
    id: r.id,
    business: r.businesses?.name,
    title: r.title,
    price: r.exact_price
  })));

  console.log('\nDone!');
}

main().catch(err => { console.error('Failed:', err); process.exit(1); });

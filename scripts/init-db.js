const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../db/data.json');

console.log('🔄 Seeding database with sample data...');

// Build fresh data directly
const data = {
  categories: [],
  hoods: [],
  businesses: [],
  products: [],
  featured_items: [],
  ratings: [],
  reports: [],
  users: [],
  _counters: { categories: 0, hoods: 0, businesses: 0, products: 0, featured_items: 0, ratings: 0, reports: 0, users: 0 }
};

// Categories
const categories = [
  'Restaurants', 'Grocery', 'Furniture', 'Pharmacy', 
  'Clinics', 'Fashion', 'Electronics', 'Beauty & Spa', 
  'Bakery & Café', 'Auto Services'
];

categories.forEach((name, i) => {
  data.categories.push({ id: i + 1, name });
  data._counters.categories = i + 1;
});

// Hoods
const hoods = [
  { name: 'Bole', description: 'Central business district' },
  { name: 'Megenagna', description: 'Residential and commercial area' },
  { name: 'Kazanchis', description: 'Embassy district' },
  { name: 'Piassa', description: 'Historic downtown' },
  { name: 'Sarbet', description: 'Residential neighbourhood' },
  { name: 'Gerji', description: 'Growing commercial area' },
  { name: 'Ayat', description: 'Residential area' },
  { name: 'Summit', description: 'Upscale neighbourhood' },
  { name: 'Mexico', description: 'Central area' },
  { name: '4 Kilo', description: 'University area' },
  { name: '6 Kilo', description: 'Residential area' }
];

hoods.forEach((h, i) => {
  data.hoods.push({ id: i + 1, ...h });
  data._counters.hoods = i + 1;
});

// Helper to get IDs
const getCatId = (name) => data.categories.find(c => c.name === name)?.id;
const getHoodId = (name) => data.hoods.find(h => h.name === name)?.id;

// Businesses
const businesses = [
  {
    name: 'Yod Abyssinia',
    category: 'Restaurants',
    hood: 'Bole',
    website_link: 'https://example.com',
    phone_number: '+251911000001',
    location_link: 'https://maps.google.com',
    image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',
    hook_text: 'Traditional Ethiopian cuisine with live cultural shows nightly.',
    price_indicator: '$$',
    rating_avg: 4.8,
    rating_count: 312
  },
  {
    name: 'Shoa Supermarket',
    category: 'Grocery',
    hood: 'Megenagna',
    website_link: 'https://example.com',
    phone_number: '+251911000002',
    location_link: 'https://maps.google.com',
    image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80',
    hook_text: 'Fresh produce, imported goods, and household essentials under one roof.',
    price_indicator: 'Affordable',
    rating_avg: 4.3,
    rating_count: 189
  },
  {
    name: 'Selam Furniture',
    category: 'Furniture',
    hood: 'Kazanchis',
    website_link: 'https://example.com',
    phone_number: '+251911000003',
    location_link: 'https://maps.google.com',
    image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80',
    hook_text: 'Modern and classic furniture crafted locally with premium materials.',
    price_indicator: 'From 3,500 ETB',
    rating_avg: 4.5,
    rating_count: 74
  },
  {
    name: 'Kenema Pharmacy',
    category: 'Pharmacy',
    hood: 'Bole',
    website_link: 'https://example.com',
    phone_number: '+251911000004',
    location_link: 'https://maps.google.com',
    image_url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80',
    hook_text: '24/7 pharmacy with licensed pharmacists and home delivery.',
    price_indicator: 'Affordable',
    rating_avg: 4.6,
    rating_count: 221
  },
  {
    name: 'Bethzatha Clinic',
    category: 'Clinics',
    hood: 'Piassa',
    website_link: 'https://example.com',
    phone_number: '+251911000005',
    location_link: 'https://maps.google.com',
    image_url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&q=80',
    hook_text: 'General and specialist consultations with same-day appointments.',
    price_indicator: 'From 500 ETB',
    rating_avg: 4.7,
    rating_count: 156
  },
  {
    name: 'Desta Fashion House',
    category: 'Fashion',
    hood: 'Sarbet',
    website_link: 'https://example.com',
    phone_number: '+251911000006',
    location_link: 'https://maps.google.com',
    image_url: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&q=80',
    hook_text: 'Contemporary Ethiopian fashion blending habesha and modern styles.',
    price_indicator: '$$',
    rating_avg: 4.4,
    rating_count: 98
  },
  {
    name: 'Addis Tech Hub',
    category: 'Electronics',
    hood: 'Gerji',
    website_link: 'https://example.com',
    phone_number: '+251911000007',
    location_link: 'https://maps.google.com',
    image_url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80',
    hook_text: 'Laptops, phones, accessories and expert repair services.',
    price_indicator: 'From 1,200 ETB',
    rating_avg: 4.2,
    rating_count: 143
  },
  {
    name: 'Liya Beauty Spa',
    category: 'Beauty & Spa',
    hood: 'Bole',
    website_link: 'https://example.com',
    phone_number: '+251911000008',
    location_link: 'https://maps.google.com',
    image_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80',
    hook_text: 'Full-service salon and spa with natural Ethiopian beauty treatments.',
    price_indicator: 'From 350 ETB',
    rating_avg: 4.9,
    rating_count: 267
  },
  {
    name: "Kaldi's Coffee",
    category: 'Bakery & Café',
    hood: 'Megenagna',
    website_link: 'https://example.com',
    phone_number: '+251911000009',
    location_link: 'https://maps.google.com',
    image_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=80',
    hook_text: "Ethiopia's beloved coffee chain — freshly roasted, always welcoming.",
    price_indicator: 'Affordable',
    rating_avg: 4.7,
    rating_count: 504
  },
  {
    name: 'Bole Auto Center',
    category: 'Auto Services',
    hood: 'Bole',
    website_link: 'https://example.com',
    phone_number: '+251911000010',
    location_link: 'https://maps.google.com',
    image_url: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80',
    hook_text: 'Full mechanical service, car wash, and detailing by certified technicians.',
    price_indicator: 'From 800 ETB',
    rating_avg: 4.3,
    rating_count: 88
  },
  {
    name: 'Summit Grill',
    category: 'Restaurants',
    hood: 'Summit',
    website_link: 'https://example.com',
    phone_number: '+251911000011',
    location_link: 'https://maps.google.com',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
    hook_text: 'Grilled meats and mezze platters with a rooftop view of the city.',
    price_indicator: '$$$',
    rating_avg: 4.6,
    rating_count: 201
  },
  {
    name: 'Ayat Fresh Market',
    category: 'Grocery',
    hood: 'Ayat',
    website_link: 'https://example.com',
    phone_number: '+251911000012',
    location_link: 'https://maps.google.com',
    image_url: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&q=80',
    hook_text: 'Farm-to-table fresh vegetables, fruits, and organic products daily.',
    price_indicator: 'Affordable',
    rating_avg: 4.1,
    rating_count: 67
  }
];

businesses.forEach((b, i) => {
  data.businesses.push({
    id: i + 1,
    name: b.name,
    category_id: getCatId(b.category),
    hood_id: getHoodId(b.hood),
    website_link: b.website_link,
    phone_number: b.phone_number,
    location_link: b.location_link,
    image_url: b.image_url,
    hook_text: b.hook_text,
    price_indicator: b.price_indicator,
    rating_avg: b.rating_avg,
    rating_count: b.rating_count,
    created_at: new Date().toISOString()
  });
  data._counters.businesses = i + 1;
});

// Featured products
const getBizId = (name) => data.businesses.find(b => b.name === name)?.id;

const featured = [
  {
    business: 'Yod Abyssinia',
    title: 'Doro Wat Platter',
    hook_text: 'Slow-cooked spiced chicken in rich berbere sauce, served with injera.',
    exact_price: '280 ETB',
    location_text: 'Bole',
    image_url: 'https://images.unsplash.com/photo-1567364816519-cbc9c4ffe1eb?w=400&q=80'
  },
  {
    business: 'Shoa Supermarket',
    title: 'Fresh Avocado Juice',
    hook_text: 'Thick blended avocado with a hint of honey — a Addis classic.',
    exact_price: '85 ETB',
    location_text: 'Megenagna',
    image_url: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&q=80'
  },
  {
    business: "Kaldi's Coffee",
    title: 'Macchiato',
    hook_text: "Ethiopia's signature espresso topped with a cloud of steamed milk.",
    exact_price: '55 ETB',
    location_text: 'Megenagna',
    image_url: 'https://images.unsplash.com/photo-1485808191679-5f86510bd9d4?w=400&q=80'
  },
  {
    business: 'Desta Fashion House',
    title: 'Habesha Dress (Netela)',
    hook_text: 'Hand-woven traditional cotton dress with embroidered border detail.',
    exact_price: '1,200 ETB',
    location_text: 'Sarbet',
    image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4f7b?w=400&q=80'
  },
  {
    business: 'Liya Beauty Spa',
    title: 'Deep Tissue Massage',
    hook_text: '60-minute full-body massage using natural Ethiopian oils.',
    exact_price: '450 ETB',
    location_text: 'Bole',
    image_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80'
  },
  {
    business: 'Kenema Pharmacy',
    title: 'Paracetamol 500mg (20 tabs)',
    hook_text: 'Standard pain relief tablets, licensed and quality-checked.',
    exact_price: '35 ETB',
    location_text: 'Bole',
    image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80'
  },
  {
    business: 'Summit Grill',
    title: 'Tibs (Mixed Meat)',
    hook_text: 'Sautéed beef and lamb with rosemary, jalapeño, and onion.',
    exact_price: '320 ETB',
    location_text: 'Summit',
    image_url: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=400&q=80'
  },
  {
    business: "Kaldi's Coffee",
    title: 'Croissant & Coffee Combo',
    hook_text: 'Buttery croissant paired with a freshly pulled espresso shot.',
    exact_price: '120 ETB',
    location_text: 'Megenagna',
    image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80'
  }
];

featured.forEach((f, i) => {
  data.featured_items.push({
    id: i + 1,
    business_id: getBizId(f.business),
    image_url: f.image_url,
    title: f.title,
    hook_text: f.hook_text,
    exact_price: f.exact_price,
    location_text: f.location_text,
    created_at: new Date().toISOString()
  });
  data._counters.featured_items = i + 1;
});

// Products per business (searchable)
const products = [
  { business: 'Yod Abyssinia',       name: 'Doro Wat',              description: 'Slow-cooked spiced chicken in berbere sauce with injera.',  price: '280 ETB',    image_url: 'https://images.unsplash.com/photo-1567364816519-cbc9c4ffe1eb?w=400&q=80' },
  { business: 'Yod Abyssinia',       name: 'Tibs Firfir',           description: 'Shredded injera sautéed with spiced lamb and vegetables.',   price: '220 ETB',    image_url: null },
  { business: 'Yod Abyssinia',       name: 'Tej (Honey Wine)',      description: 'Traditional Ethiopian honey wine served chilled.',           price: '120 ETB',    image_url: null },
  { business: 'Shoa Supermarket',    name: 'Avocado Juice',         description: 'Thick blended avocado with honey.',                         price: '85 ETB',     image_url: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&q=80' },
  { business: 'Shoa Supermarket',    name: 'Organic Honey (1kg)',   description: 'Pure Ethiopian forest honey, unprocessed.',                 price: '350 ETB',    image_url: null },
  { business: "Kaldi's Coffee",      name: 'Macchiato',             description: "Ethiopia's signature espresso with steamed milk.",          price: '55 ETB',     image_url: 'https://images.unsplash.com/photo-1485808191679-5f86510bd9d4?w=400&q=80' },
  { business: "Kaldi's Coffee",      name: 'Croissant',             description: 'Buttery, flaky croissant baked fresh daily.',               price: '75 ETB',     image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80' },
  { business: "Kaldi's Coffee",      name: 'Cappuccino',            description: 'Double espresso with velvety steamed milk foam.',           price: '80 ETB',     image_url: null },
  { business: 'Desta Fashion House', name: 'Habesha Dress (Netela)',description: 'Hand-woven traditional cotton dress with embroidered border.',price: '1,200 ETB', image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4f7b?w=400&q=80' },
  { business: 'Desta Fashion House', name: 'Gabi (Shawl)',          description: 'Thick woven cotton shawl, perfect for cool evenings.',      price: '650 ETB',    image_url: null },
  { business: 'Liya Beauty Spa',     name: 'Deep Tissue Massage',   description: '60-minute full-body massage with Ethiopian oils.',          price: '450 ETB',    image_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80' },
  { business: 'Liya Beauty Spa',     name: 'Hair Treatment',        description: 'Nourishing hair mask and blow-dry styling.',                price: '300 ETB',    image_url: null },
  { business: 'Liya Beauty Spa',     name: 'Manicure & Pedicure',   description: 'Full nail care with gel polish of your choice.',           price: '250 ETB',    image_url: null },
  { business: 'Kenema Pharmacy',     name: 'Paracetamol 500mg',     description: 'Standard pain relief, 20 tablets per pack.',               price: '35 ETB',     image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80' },
  { business: 'Kenema Pharmacy',     name: 'Vitamin C 1000mg',      description: 'Immune support supplement, 30 effervescent tablets.',      price: '180 ETB',    image_url: null },
  { business: 'Bethzatha Clinic',    name: 'General Consultation',  description: 'Doctor visit with diagnosis and prescription.',            price: '500 ETB',    image_url: null },
  { business: 'Bethzatha Clinic',    name: 'Blood Test (CBC)',      description: 'Complete blood count with same-day results.',              price: '350 ETB',    image_url: null },
  { business: 'Summit Grill',        name: 'Tibs (Mixed Meat)',     description: 'Sautéed beef and lamb with rosemary and jalapeño.',        price: '320 ETB',    image_url: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=400&q=80' },
  { business: 'Summit Grill',        name: 'Grilled Fish',          description: 'Whole tilapia grilled with lemon herb butter.',            price: '280 ETB',    image_url: null },
  { business: 'Selam Furniture',     name: 'Sofa Set (3+1+1)',      description: 'Modern fabric sofa set with solid wood frame.',            price: '18,500 ETB', image_url: null },
  { business: 'Addis Tech Hub',      name: 'Laptop Screen Repair',  description: 'Screen replacement for most laptop brands, same day.',    price: '2,500 ETB',  image_url: null },
  { business: 'Addis Tech Hub',      name: 'Phone Charging Port Repair', description: 'USB-C / micro-USB port replacement.',               price: '800 ETB',    image_url: null },
  { business: 'Bole Auto Center',    name: 'Full Car Wash',         description: 'Exterior wash, interior vacuum, and window clean.',       price: '250 ETB',    image_url: null },
  { business: 'Bole Auto Center',    name: 'Oil Change',            description: 'Engine oil + filter replacement, all car types.',        price: '800 ETB',    image_url: null },
  { business: 'Ayat Fresh Market',   name: 'Organic Vegetables (1kg)', description: 'Mixed seasonal vegetables, farm-fresh daily.',       price: '80 ETB',     image_url: null },
];

products.forEach((p, i) => {
  data.products.push({
    id: i + 1,
    business_id: getBizId(p.business),
    name: p.name,
    description: p.description,
    price: p.price,
    image_url: p.image_url,
    created_at: new Date().toISOString()
  });
  data._counters.products = i + 1;
});

// Write directly to file
fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
console.log(`   - ${categories.length} categories`);
console.log(`   - ${hoods.length} hoods`);
console.log(`   - ${businesses.length} businesses`);
console.log(`   - ${featured.length} featured products`);
console.log(`   - ${products.length} searchable products`);

process.exit(0);

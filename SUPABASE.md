# Supabase Integration Guide

## 1. Prerequisites

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Name: `AddisDR`
3. Database password: save this securely
4. Region: pick closest to your users (e.g. `West US` or `EU West`)
5. Wait for the project to spin up (~2 min)

## 2. Run the SQL Schema

In Supabase Dashboard → **SQL Editor**, paste and run the following SQL:

```sql
-- ============================================================
-- 1. TABLES
-- ============================================================

-- Categories
CREATE TABLE categories (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL
);

-- Hoods / neighbourhoods
CREATE TABLE hoods (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

-- Businesses
CREATE TABLE businesses (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  hood_id BIGINT REFERENCES hoods(id) ON DELETE SET NULL,
  website_link TEXT,
  phone_number TEXT,
  location_link TEXT,
  image_url TEXT,
  hook_text TEXT,
  price_indicator TEXT,
  rating_avg NUMERIC(3,1) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Products
CREATE TABLE products (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  business_id BIGINT REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Featured items (carousel)
CREATE TABLE featured_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  business_id BIGINT REFERENCES businesses(id) ON DELETE CASCADE,
  image_url TEXT,
  title TEXT,
  hook_text TEXT,
  exact_price TEXT,
  location_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Users
CREATE TABLE users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  hood_id BIGINT REFERENCES hoods(id) ON DELETE SET NULL,
  phone TEXT UNIQUE,
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ratings (references businesses + users — must come after both)
CREATE TABLE ratings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  business_id BIGINT REFERENCES businesses(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (business_id, user_id)
);

-- Reports
CREATE TABLE reports (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  business_id BIGINT REFERENCES businesses(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. INDEXES
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_businesses_category ON businesses(category_id);
CREATE INDEX idx_businesses_hood ON businesses(hood_id);
CREATE INDEX idx_businesses_rating ON businesses(rating_avg DESC, rating_count DESC);
CREATE INDEX idx_products_business ON products(business_id);
CREATE INDEX idx_ratings_business ON ratings(business_id);
CREATE INDEX idx_ratings_user ON ratings(user_id);
CREATE INDEX idx_reports_business ON reports(business_id);
CREATE INDEX idx_reports_created ON reports(created_at DESC);
CREATE INDEX idx_users_phone ON users(phone);

-- Trigram indexes for product name/description search
CREATE INDEX idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);
CREATE INDEX idx_products_desc_trgm ON products USING GIN (description gin_trgm_ops);

-- ============================================================
-- 3. VIEWS (convenience — join enrichment)
-- ============================================================

CREATE VIEW vw_businesses AS
SELECT
  b.*,
  c.name AS category_name,
  h.name AS hood_name
FROM businesses b
LEFT JOIN categories c ON c.id = b.category_id
LEFT JOIN hoods h ON h.id = b.hood_id;

CREATE VIEW vw_products AS
SELECT
  p.*,
  b.name AS business_name
FROM products p
LEFT JOIN businesses b ON b.id = p.business_id;

CREATE VIEW vw_featured_items AS
SELECT
  f.*,
  b.name AS business_name
FROM featured_items f
LEFT JOIN businesses b ON b.id = f.business_id;

CREATE VIEW vw_reports AS
SELECT
  r.*,
  b.name AS business_name
FROM reports r
LEFT JOIN businesses b ON b.id = r.business_id;

CREATE VIEW vw_users AS
SELECT
  u.*,
  h.name AS hood_name,
  u.name || ' from ' || h.name AS display_name
FROM users u
LEFT JOIN hoods h ON h.id = u.hood_id;

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE hoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Public read on reference / lookup tables
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read hoods" ON hoods FOR SELECT USING (true);
CREATE POLICY "Public read businesses" ON businesses FOR SELECT USING (true);
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Public read featured" ON featured_items FOR SELECT USING (true);

-- Ratings — anyone can read, service_role can write (the backend API uses service_role)
CREATE POLICY "Public read ratings" ON ratings FOR SELECT USING (true);
CREATE POLICY "Service role insert ratings" ON ratings FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role update ratings" ON ratings FOR UPDATE USING (auth.role() = 'service_role');

-- Reports — anyone can insert, service_role can read
CREATE POLICY "Service role read reports" ON reports FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "Anyone insert reports" ON reports FOR INSERT WITH CHECK (true);

-- Users — service_role only (app uses phone/password auth, not Supabase Auth)
-- NOTE: auth.uid() = id removed to avoid uuid = bigint type mismatch
CREATE POLICY "Users read own profile" ON users FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "Users insert own profile" ON users FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Users update own profile" ON users FOR UPDATE USING (auth.role() = 'service_role');

-- ============================================================
-- 5. STORAGE BUCKET (for image uploads)
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true);

-- Public read on all uploaded images
CREATE POLICY "Public read uploads" ON storage.objects
  FOR SELECT USING (bucket_id = 'uploads');

-- Authenticated / service_role upload
CREATE POLICY "Authenticated upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'uploads' AND (auth.role() = 'authenticated' OR auth.role() = 'service_role'));

-- Allow uploader or service_role to update / delete
CREATE POLICY "Auth update own uploads" ON storage.objects
  FOR UPDATE USING (bucket_id = 'uploads' AND (owner = auth.uid() OR auth.role() = 'service_role'));
CREATE POLICY "Auth delete own uploads" ON storage.objects
  FOR DELETE USING (bucket_id = 'uploads' AND (owner = auth.uid() OR auth.role() = 'service_role'));

-- ============================================================
-- 6. SEED DATA
-- ============================================================

-- Categories
INSERT INTO categories (name) VALUES
  ('Restaurants'),
  ('Grocery'),
  ('Furniture'),
  ('Pharmacy'),
  ('Clinics'),
  ('Fashion'),
  ('Electronics'),
  ('Beauty & Spa'),
  ('Bakery & Café'),
  ('Auto Services'),
  ('Gifts & Souvenirs'),
  ('Education & Tutoring'),
  ('Fitness & Recreation'),
  ('Photography');

-- Hoods
INSERT INTO hoods (name, description) VALUES
  ('Bole', 'Central business district'),
  ('Megenagna', 'Residential and commercial area'),
  ('Kazanchis', 'Embassy district'),
  ('Piassa', 'Historic downtown'),
  ('Sarbet', 'Residential neighbourhood'),
  ('Gerji', 'Growing commercial area'),
  ('Ayat', 'Residential area'),
  ('Summit', 'Upscale neighbourhood'),
  ('Mexico', 'Central area'),
  ('4 Kilo', 'University area'),
  ('6 Kilo', 'Residential area');

-- Businesses (OVERRIDING SYSTEM VALUE lets us provide explicit IDs)
INSERT INTO businesses (id, name, category_id, hood_id, website_link, phone_number, location_link, image_url, hook_text, price_indicator, rating_avg, rating_count, created_at)
OVERRIDING SYSTEM VALUE
VALUES
  (1,  'Yod Abyssinia',            1,  1,  'https://example.com', '+251911000001', 'https://maps.google.com', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',  'Traditional Ethiopian cuisine with live cultural shows nightly.',                                               '$$',              5,   1,   '2026-05-05T19:13:14.342Z'),
  (2,  'Shoa Supermarket',         2,  2,  'https://example.com', '+251911000002', 'https://maps.google.com', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80',  'Fresh produce, imported goods, and household essentials under one roof.',                                       'Affordable',      4.3, 189, '2026-05-05T19:13:14.343Z'),
  (3,  'Selam Furniture',          3,  3,  'https://example.com', '+251911000003', 'https://maps.google.com', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80',  'Modern and classic furniture crafted locally with premium materials.',                                           'From 3,500 ETB',  5,   1,   '2026-05-05T19:13:14.343Z'),
  (4,  'Kenema Pharmacy',          4,  1,  'https://example.com', '+251911000004', 'https://maps.google.com', 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80',  '24/7 pharmacy with licensed pharmacists and home delivery.',                                                     'Affordable',      4.6, 221, '2026-05-05T19:13:14.343Z'),
  (5,  'Bethzatha Clinic',         5,  4,  'https://example.com', '+251911000005', 'https://maps.google.com', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&q=80',  'General and specialist consultations with same-day appointments.',                                               'From 500 ETB',    5,   1,   '2026-05-05T19:13:14.343Z'),
  (6,  'Desta Fashion House',      6,  5,  'https://example.com', '+251911000006', 'https://maps.google.com', 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&q=80',  'Contemporary Ethiopian fashion blending habesha and modern styles.',                                             '$$',              4.4, 98,  '2026-05-05T19:13:14.343Z'),
  (7,  'Addis Tech Hub',           7,  6,  'https://example.com', '+251911000007', 'https://maps.google.com', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80',  'Laptops, phones, accessories and expert repair services.',                                                       'From 1,200 ETB',  4.2, 143, '2026-05-05T19:13:14.343Z'),
  (8,  'Liya Beauty Spa',          8,  1,  'https://example.com', '+251911000008', 'https://maps.google.com', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80',  'Full-service salon and spa with natural Ethiopian beauty treatments.',                                           'From 350 ETB',    4.9, 267, '2026-05-05T19:13:14.343Z'),
  (9,  E'Kaldi''s Coffee',         9,  2,  'https://example.com', '+251911000009', 'https://maps.google.com', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=80',  E'Ethiopia''s beloved coffee chain — freshly roasted, always welcoming.',                                        'Affordable',      4.7, 504, '2026-05-05T19:13:14.343Z'),
  (10, 'Bole Auto Center',         10, 1,  'https://example.com', '+251911000010', 'https://maps.google.com', 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80',  'Full mechanical service, car wash, and detailing by certified technicians.',                                     'From 800 ETB',    4.3, 88,  '2026-05-05T19:13:14.343Z'),
  (11, 'Summit Grill',             1,  8,  'https://example.com', '+251911000011', 'https://maps.google.com', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',  'Grilled meats and mezze platters with a rooftop view of the city.',                                              '$$$',             4.6, 201, '2026-05-05T19:13:14.344Z'),
  (12, 'Jinx Fresh Market',        2,  7,  'https://example.com', '+251911000012', 'https://maps.google.com', 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&q=80',  'Farm-to-table fresh vegetables, fruits, and organic products daily.',                                            'Affordable',      4.1, 67,  '2026-05-05T19:13:14.344Z'),
  (13, 'Aman furniture store',     3,  6,  'http://localhost:3001/admin.html', '+251988898022', 'http://localhost:3001/admin.html', '/uploads/1780467552240-936640068.png', 'Aman yleyal alkuh iko, Ychlal Aman Ychlal, Ychlal Aman Ychlal',          'From 2000 ETB',   5,   1,   '2026-06-03T06:19:12.275Z'),
  (14, 'Home Comfort',             3,  1,  'https://stores-addisdr.vercel.app/home-comfort', '+251911000014', 'https://maps.google.com', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80', 'Quality furniture and home decor to make your space truly comfortable.',                                         'From 2,500 ETB',  0,   0,   '2026-06-16T00:00:00.000Z'),
  (15, 'Gift World',               11, 2,  'https://stores-addisdr.vercel.app/giftworld', '+251911000015', 'https://maps.google.com', 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=600&q=80', 'Unique gifts and souvenirs for every occasion — wrapped with care.',                                             'From 200 ETB',    0,   0,   '2026-06-16T00:00:00.000Z'),
  (16, 'Gadget Pro',               7,  1,  'https://stores-addisdr.vercel.app/gadgetpro', '+251911000016', 'https://maps.google.com', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80', 'Latest gadgets, accessories, and electronics at competitive prices.',                                            'From 500 ETB',    0,   0,   '2026-06-16T00:00:00.000Z'),
  (17, 'Chic',                     6,  5,  'https://stores-addisdr.vercel.app/chic', '+251911000017', 'https://maps.google.com', 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&q=80', 'Trendy fashion and apparel blending modern style with Ethiopian flair.',                                         '$$',              0,   0,   '2026-06-16T00:00:00.000Z'),
  (18, 'BrightCare Dental Clinic', 5,  1,  'https://services-addisdr.vercel.app/brightcare-dental-clinic', '+251911000018', 'https://maps.google.com', 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&q=80', 'Comprehensive dental care with modern equipment and experienced dentists.',                                      'From 500 ETB',    0,   0,   '2026-06-16T00:00:00.000Z'),
  (19, 'LinguaBridge Tutoring',    12, 3,  'https://services-addisdr.vercel.app/linguabridge-tutoring', '+251911000019', 'https://maps.google.com', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80', 'Language and academic tutoring bridging students to success.',                                                    'From 300 ETB/hr', 0,   0,   '2026-06-16T00:00:00.000Z'),
  (20, 'Elevate Events and Fitness', 13, 8, 'https://services-addisdr.vercel.app/elevate-events-and-fitness', '+251911000020', 'https://maps.google.com', 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&q=80', 'Fitness training and event planning for a healthier, more vibrant lifestyle.',                                   'From 1,000 ETB',  0,   0,   '2026-06-16T00:00:00.000Z'),
  (21, 'Refined Grooming Lounge',  8,  1,  'https://services-addisdr.vercel.app/refined-grooming-lounge', '+251911000021', 'https://maps.google.com', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80', 'Premium grooming and barber services for the modern gentleman.',                                                 'From 250 ETB',    0,   0,   '2026-06-16T00:00:00.000Z'),
  (22, 'Lens and Light Photography', 14, 4, 'https://services-addisdr.vercel.app/lens-and-light-photography', '+251911000022', 'https://maps.google.com', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80', 'Professional photography for events, portraits, and commercial projects.',                                      'From 3,000 ETB',  0,   0,   '2026-06-16T00:00:00.000Z'),
  (23, 'Savory Bites Restaurant',  1,  2,  'https://services-addisdr.vercel.app/savory-bites-restaurant', '+251911000023', 'https://maps.google.com', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80', 'Delicious local and international cuisine in a warm, inviting atmosphere.',                                      '$$',              0,   0,   '2026-06-16T00:00:00.000Z');

-- Advance sequences past seed IDs
SELECT setval('businesses_id_seq', 23);

-- Featured items
INSERT INTO featured_items (id, business_id, image_url, title, hook_text, exact_price, location_text, created_at)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 1,  'https://images.unsplash.com/photo-1567364816519-cbc9c4ffe1eb?w=400&q=80', 'Doro Wat Platter',       'Slow-cooked spiced chicken in rich berbere sauce, served with injera.',                   '280 ETB',  'Bole',      '2026-05-05T19:13:14.344Z'),
  (2, 2,  'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&q=80', 'Fresh Avocado Juice',    'Thick blended avocado with a hint of honey — a Addis classic.',                            '85 ETB',   'Megenagna', '2026-05-05T19:13:14.344Z'),
  (3, 9,  'https://images.unsplash.com/photo-1485808191679-5f86510bd9d4?w=400&q=80', 'Macchiato',              E'Ethiopia''s signature espresso topped with a cloud of steamed milk.',                     '55 ETB',   'Megenagna', '2026-05-05T19:13:14.344Z'),
  (4, 6,  'https://images.unsplash.com/photo-1594938298603-c8148c4b4f7b?w=400&q=80', 'Habesha Dress (Netela)', 'Hand-woven traditional cotton dress with embroidered border detail.',                      '1,200 ETB','Sarbet',    '2026-05-05T19:13:14.344Z'),
  (5, 8,  'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80', 'Deep Tissue Massage',    '60-minute full-body massage using natural Ethiopian oils.',                                '450 ETB',  'Bole',      '2026-05-05T19:13:14.344Z'),
  (6, 4,  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80', 'Paracetamol 500mg (20 tabs)', 'Standard pain relief tablets, licensed and quality-checked.',                          '35 ETB',   'Bole',      '2026-05-05T19:13:14.344Z'),
  (7, 11, 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=400&q=80', 'Tibs (Mixed Meat)',      'Sautéed beef and lamb with rosemary, jalapeño, and onion.',                               '320 ETB',  'Summit',    '2026-05-05T19:13:14.344Z'),
  (8, 9,  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80', 'Croissant & Coffee Combo', 'Buttery croissant paired with a freshly pulled espresso shot.',                         '120 ETB',  'Megenagna', '2026-05-05T19:13:14.344Z');
SELECT setval('featured_items_id_seq', 8);

-- Products
INSERT INTO products (id, business_id, name, description, price, image_url, created_at)
OVERRIDING SYSTEM VALUE
VALUES
  (1,  1,  'Doro Wat',                'Slow-cooked spiced chicken in berbere sauce with injera.',                                    '280 ETB',     'https://images.unsplash.com/photo-1567364816519-cbc9c4ffe1eb?w=400&q=80', '2026-05-05T19:13:14.344Z'),
  (2,  1,  'Tibs Firfir',             'Shredded injera sautéed with spiced lamb and vegetables.',                                     '220 ETB',     NULL,                                                                          '2026-05-05T19:13:14.344Z'),
  (3,  1,  'Tej (Honey Wine)',        'Traditional Ethiopian honey wine served chilled.',                                              '120 ETB',     NULL,                                                                          '2026-05-05T19:13:14.344Z'),
  (4,  2,  'Avocado Juice',           'Thick blended avocado with honey.',                                                             '85 ETB',      'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&q=80', '2026-05-05T19:13:14.344Z'),
  (5,  2,  'Organic Honey (1kg)',     'Pure Ethiopian forest honey, unprocessed.',                                                    '350 ETB',     NULL,                                                                          '2026-05-05T19:13:14.344Z'),
  (6,  9,  'Macchiato',               E'Ethiopia''s signature espresso with steamed milk.',                                           '55 ETB',      'https://images.unsplash.com/photo-1485808191679-5f86510bd9d4?w=400&q=80', '2026-05-05T19:13:14.344Z'),
  (7,  9,  'Croissant',               'Buttery, flaky croissant baked fresh daily.',                                                  '75 ETB',      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80', '2026-05-05T19:13:14.344Z'),
  (8,  9,  'Cappuccino',              'Double espresso with velvety steamed milk foam.',                                              '80 ETB',      NULL,                                                                          '2026-05-05T19:13:14.344Z'),
  (9,  6,  'Habesha Dress (Netela)',  'Hand-woven traditional cotton dress with embroidered border.',                                 '1,200 ETB',   'https://images.unsplash.com/photo-1594938298603-c8148c4b4f7b?w=400&q=80', '2026-05-05T19:13:14.344Z'),
  (10, 6,  'Gabi (Shawl)',            'Thick woven cotton shawl, perfect for cool evenings.',                                          '650 ETB',     NULL,                                                                          '2026-05-05T19:13:14.344Z'),
  (11, 8,  'Deep Tissue Massage',     '60-minute full-body massage with Ethiopian oils.',                                             '450 ETB',     'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80', '2026-05-05T19:13:14.344Z'),
  (12, 8,  'Hair Treatment',          'Nourishing hair mask and blow-dry styling.',                                                   '300 ETB',     NULL,                                                                          '2026-05-05T19:13:14.344Z'),
  (13, 8,  'Manicure & Pedicure',     'Full nail care with gel polish of your choice.',                                               '250 ETB',     NULL,                                                                          '2026-05-05T19:13:14.344Z'),
  (14, 4,  'Paracetamol 500mg',       'Standard pain relief, 20 tablets per pack.',                                                   '35 ETB',      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80', '2026-05-05T19:13:14.344Z'),
  (15, 4,  'Vitamin C 1000mg',        'Immune support supplement, 30 effervescent tablets.',                                           '180 ETB',     NULL,                                                                          '2026-05-05T19:13:14.344Z'),
  (16, 5,  'General Consultation',    'Doctor visit with diagnosis and prescription.',                                                '500 ETB',     NULL,                                                                          '2026-05-05T19:13:14.344Z'),
  (17, 5,  'Blood Test (CBC)',        'Complete blood count with same-day results.',                                                  '350 ETB',     NULL,                                                                          '2026-05-05T19:13:14.344Z'),
  (18, 11, 'Tibs (Mixed Meat)',       'Sautéed beef and lamb with rosemary and jalapeño.',                                            '320 ETB',     'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=400&q=80', '2026-05-05T19:13:14.344Z'),
  (19, 11, 'Grilled Fish',            'Whole tilapia grilled with lemon herb butter.',                                                '280 ETB',     NULL,                                                                          '2026-05-05T19:13:14.344Z'),
  (20, 3,  'Sofa Set (3+1+1)',        'Modern fabric sofa set with solid wood frame.',                                                '18,500 ETB',  NULL,                                                                          '2026-05-05T19:13:14.344Z'),
  (21, 7,  'Laptop Screen Repair',    'Screen replacement for most laptop brands, same day.',                                         '2,500 ETB',   NULL,                                                                          '2026-05-05T19:13:14.344Z'),
  (22, 7,  'Phone Charging Port Repair', 'USB-C / micro-USB port replacement.',                                                      '800 ETB',     NULL,                                                                          '2026-05-05T19:13:14.344Z'),
  (23, 10, 'Full Car Wash',           'Exterior wash, interior vacuum, and window clean.',                                            '250 ETB',     NULL,                                                                          '2026-05-05T19:13:14.344Z'),
  (24, 10, 'Oil Change',              'Engine oil + filter replacement, all car types.',                                              '800 ETB',     NULL,                                                                          '2026-05-05T19:13:14.344Z'),
  (25, 12, 'Organic Vegetables (1kg)','Mixed seasonal vegetables, farm-fresh daily.',                                                 '80 ETB',      NULL,                                                                          '2026-05-05T19:13:14.344Z'),
  (26, 13, 'sofa',                    'yabede sofa',                                                                                  '35,000 ETB',  '/uploads/1780468283685-400306121.png',                                      '2026-06-03T06:31:23.747Z');
SELECT setval('products_id_seq', 26);

-- Users
INSERT INTO users (id, name, hood_id, phone, created_at)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'Aman', 6, NULL, '2026-05-14T00:57:29.885Z'),
  (2, 'Aman', 8, NULL, '2026-05-23T17:53:40.068Z');
SELECT setval('users_id_seq', 2);

-- Ratings
INSERT INTO ratings (id, business_id, user_id, rating, created_at)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 13, 2, 5, '2026-06-03T06:32:39.516Z'),
  (2, 3,  2, 5, '2026-06-03T06:50:12.332Z'),
  (3, 1,  2, 5, '2026-06-03T06:59:23.342Z'),
  (4, 5,  2, 5, '2026-06-03T07:03:04.510Z');
SELECT setval('ratings_id_seq', 4);

-- Reports
INSERT INTO reports (id, business_id, user_name, reason, created_at)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 10, 'Anonymous',        'cnb', '2026-05-14T00:56:19.860Z'),
  (2, 10, 'Aman from Summit', 'try', '2026-06-02T08:25:04.432Z'),
  (3, 1,  'Aman from Summit', 'g',   '2026-06-03T06:59:40.533Z');
SELECT setval('reports_id_seq', 3);
```

After running, verify:
- [ ] 8 tables created (categories, hoods, businesses, products, featured_items, ratings, reports, users)
- [ ] 5 views created (vw_businesses, vw_products, vw_featured_items, vw_reports, vw_users)
- [ ] Seed data populated (14 categories, 11 hoods, 23 businesses, 26 products, etc.)
- [ ] Storage bucket `uploads` created

## 3. Environment Variables

### 3.1 Local `.env`

Open `D:\AddisDR\.env` and replace the placeholder values:

```env
# Supabase (backend)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Supabase (frontend – VITE_ prefix required)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Where to find these values:**
- Supabase Dashboard → **Project Settings → API**
- `SUPABASE_URL` = **Project URL**
- `SUPABASE_SERVICE_ROLE_KEY` = **service_role key** (keep secret — never expose to client)
- `VITE_SUPABASE_ANON_KEY` = **anon public key** (safe for frontend)
- `VITE_SUPABASE_URL` — same as `SUPABASE_URL`

### 3.2 Vercel Environment Variables

In Vercel Dashboard → **Settings → Environment Variables**, add all four variables above. Set them for **Production** and optionally **Preview**.

> ⚠️ Never commit `.env` to git (already in `.gitignore`).

## 4. Storage Bucket for Uploads

The SQL already created the `uploads` bucket and set RLS policies. To verify:

1. Supabase Dashboard → **Storage**
2. You should see a bucket named `uploads`
3. Under **Policies** tab, confirm:
   - Public read access
   - Authenticated upload access

The backend will use the `service_role` key for uploads, which bypasses all RLS. If you later want the frontend to upload directly, you'll need to add user-level policies.

## 5. Code Migration: JSON File → Supabase

### 5.1 Create a Supabase client module

Create `D:\AddisDR\api\lib\supabase.js`:

```js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — using JSON file');
}

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

module.exports = supabase;
```

### 5.2 Update each route handler

Each route file needs to change from reading/writing a local JSON object to querying Supabase. Here's a before/after pattern for every route.

---

#### categories.js

**Before** (JSON file):
```js
const db = dbModule.get();
res.json(db.categories);
```

**After** (Supabase):
```js
const { data, error } = await supabase.from('categories').select('*');
if (error) throw error;
res.json(data);
```

---

#### hoods.js

**Before:**
```js
const db = dbModule.get();
res.json(db.hoods);
```

**After:**
```js
const { data, error } = await supabase.from('hoods').select('*');
if (error) throw error;
res.json(data);
```

---

#### businesses.js (most complex)

**Before:**
```js
router.get('/', (req, res) => {
  const db = dbModule.get();
  const { category, hood } = req.query;
  let businesses = db.businesses.map(b => {
    const cat = db.categories.find(c => c.id === b.category_id);
    const h = db.hoods.find(hd => hd.id === b.hood_id);
    return { ...b, category_name: cat ? cat.name : '', hood_name: h ? h.name : '' };
  });
  if (category && category !== 'all') {
    businesses = businesses.filter(b => b.category_name === category);
  }
  if (hood && hood !== 'all') {
    businesses = businesses.filter(b => b.hood_name === hood);
  }
  businesses.sort((a, b) => {
    if (b.rating_avg !== a.rating_avg) return b.rating_avg - a.rating_avg;
    return b.rating_count - a.rating_count;
  });
  res.json(businesses);
});
```

**After:**
```js
router.get('/', async (req, res) => {
  const { category, hood } = req.query;
  let query = supabase
    .from('vw_businesses')
    .select('*')
    .order('rating_avg', { ascending: false })
    .order('rating_count', { ascending: false });

  if (category && category !== 'all') {
    query = query.eq('category_name', category);
  }
  if (hood && hood !== 'all') {
    query = query.eq('hood_name', hood);
  }

  const { data, error } = await query;
  if (error) throw error;
  res.json(data);
});
```

**GET /:id:**

**After:**
```js
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('vw_businesses')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Business not found' });
  res.json(data);
});
```

---

#### featured.js

**Before:**
```js
const db = dbModule.get();
const items = db.featured_items.map(f => {
  const business = db.businesses.find(b => b.id === f.business_id);
  return { ...f, business_name: business ? business.name : '' };
});
```

**After:**
```js
const { data, error } = await supabase
  .from('vw_featured_items')
  .select('*');
if (error) throw error;
res.json(data);
```

---

#### products.js

**Before** (GET /):
```js
const db = dbModule.get();
const { business_id } = req.query;
let products = db.products || [];
if (business_id) products = products.filter(p => p.business_id === parseInt(business_id));
res.json(products);
```

**After:**
```js
let query = supabase.from('products').select('*');
if (req.query.business_id) {
  query = query.eq('business_id', req.query.business_id);
}
const { data, error } = await query;
if (error) throw error;
res.json(data);
```

**GET /search:**

**After:**
```js
const q = (req.query.q || '').trim();
if (!q || q.length < 2) return res.json([]);
const { data, error } = await supabase
  .from('vw_products')
  .select('*')
  .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
  .limit(20);
if (error) throw error;
res.json(data);
```

---

#### ratings.js

**Before** (POST /):
```js
// Check if user already rated
const existingIndex = db.ratings.findIndex(r =>
  r.business_id === business_id && r.user_id === user_id
);
if (existingIndex >= 0) {
  db.ratings[existingIndex].rating = rating;
} else {
  db.ratings.push({ id: dbModule.nextId('ratings'), business_id, user_id, rating, created_at: new Date().toISOString() });
}
// Recalculate business rating
const businessRatings = db.ratings.filter(r => r.business_id === business_id);
const avg = businessRatings.reduce((sum, r) => sum + r.rating, 0) / businessRatings.length;
const business = db.businesses.find(b => b.id === business_id);
if (business) { business.rating_avg = avg; business.rating_count = businessRatings.length; }
```

**After:**
```js
// Upsert — Supabase's ON CONFLICT handles the uniqueness constraint
const { data: existing, error: findErr } = await supabase
  .from('ratings')
  .select('id')
  .eq('business_id', business_id)
  .eq('user_id', user_id)
  .maybeSingle();

if (existing) {
  await supabase.from('ratings').update({ rating }).eq('id', existing.id);
} else {
  await supabase.from('ratings').insert({ business_id, user_id, rating });
}

// Recalculate — use a Supabase RPC or compute inline
const { data: stats } = await supabase
  .from('ratings')
  .select('rating')
  .eq('business_id', business_id);

const avg = stats.reduce((s, r) => s + r.rating, 0) / stats.length;
await supabase
  .from('businesses')
  .update({ rating_avg: avg, rating_count: stats.length })
  .eq('id', business_id);

res.json({ success: true, rating_avg: avg, rating_count: stats.length });
```

**GET /user/:userId/business/:businessId:**

**After:**
```js
const { data, error } = await supabase
  .from('ratings')
  .select('*')
  .eq('user_id', req.params.userId)
  .eq('business_id', req.params.businessId)
  .maybeSingle();
res.json(data || { rating: null });
```

---

#### reports.js

**Before:**
```js
const report = { id: dbModule.nextId('reports'), business_id, user_name, reason, created_at: new Date().toISOString() };
db.reports.push(report);
dbModule.save();
```

**After:**
```js
const { data, error } = await supabase
  .from('reports')
  .insert({ business_id, user_name, reason })
  .select()
  .single();
if (error) throw error;
res.json({ success: true, id: data.id });
```

---

#### users.js

**Register:**
```js
const { data: existing } = await supabase
  .from('users')
  .select('id')
  .eq('phone', phone)
  .maybeSingle();
if (existing) return res.status(409).json({ error: 'Phone number already registered' });

const password_hash = await bcrypt.hash(password, 10);
const { data: user, error } = await supabase
  .from('users')
  .insert({ name: name.trim(), hood_id: parseInt(hood_id), phone: phone.trim(), password_hash })
  .select()
  .single();
if (error) throw error;

// Fetch enriched user via view
const { data: enriched } = await supabase
  .from('vw_users')
  .select('*')
  .eq('id', user.id)
  .single();

res.json(enriched);
```

**Login:**
```js
const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('phone', phone)
  .maybeSingle();
if (!user) return res.status(401).json({ error: 'Phone number not found' });
if (user.password_hash) {
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Incorrect password' });
}
const { data: enriched } = await supabase
  .from('vw_users')
  .select('*')
  .eq('id', user.id)
  .single();
res.json(enriched);
```

**GET /:id:**
```js
const { data, error } = await supabase
  .from('vw_users')
  .select('*')
  .eq('id', req.params.id)
  .single();
if (error) return res.status(404).json({ error: 'User not found' });
res.json(data);
```

---

#### admin.js

All admin CRUD operations follow the same pattern — replace `dbModule.get()` / `dbModule.save()` / `dbModule.nextId()` with the equivalent Supabase `.insert()`, `.select()`, `.update()`, `.delete()` calls.

Key changes:
- **INSERT**: omit `id` (auto-generated), use `.insert({...}).select().single()`
- **UPDATE**: use `.update({...}).eq('id', id)`
- **DELETE**: use `.delete().eq('id', id)`
- **File uploads**: use `supabase.storage.from('uploads').upload(path, file.buffer)` instead of writing to local `uploads/` directory
- Generate the image URL as `supabase.storage.from('uploads').getPublicUrl(path).data.publicUrl`

### 5.3 Update `api/index.js`

- Remove the `dbModule` require and `dbModule.load()` call
- Remove `express.static('/uploads', ...)` (Supabase storage replaces this)
- The `createClient` import is already there; it will be consumed through `api/lib/supabase.js`

### 5.4 (Optional) Delete local JSON database

After verifying everything works with Supabase:
- Delete `D:\AddisDR\api\db\database.js`
- Delete `D:\AddisDR\api\db\data.json`
- Remove `require('../db/database')` from all route files

## 6. Router changes: Make handlers `async`

All route handlers that call Supabase must be `async`. Change:

```js
router.get('/', (req, res) => {
```

to:

```js
router.get('/', async (req, res) => {
```

And wrap errors with a try/catch or add an Express async error wrapper:

```js
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```

## 7. Verification Checklist

After migration:

- [ ] `GET /api/categories` returns 14 categories
- [ ] `GET /api/hoods` returns 11 hoods
- [ ] `GET /api/businesses` returns 23 businesses with `category_name` and `hood_name`
- [ ] `GET /api/businesses?category=Restaurants` returns only restaurant-category businesses
- [ ] `GET /api/businesses/1` returns Yod Abyssinia with joined names
- [ ] `GET /api/featured` returns 8 featured items with `business_name`
- [ ] `GET /api/products?business_id=1` returns 3 products for Yod Abyssinia
- [ ] `GET /api/products/search?q=Macchiato` returns matching products
- [ ] `POST /api/ratings` creates/updates a rating and recalculates business average
- [ ] `POST /api/reports` creates a new report
- [ ] `POST /api/users/register` creates a user with bcrypt password
- [ ] `POST /api/users/login` authenticates by phone + password
- [ ] `GET /api/health` returns ok
- [ ] Image uploads go to Supabase Storage bucket `uploads`
- [ ] Uploaded images are publicly accessible via the storage URL

## 8. Rollback

If something goes wrong, the old JSON file database (`data.json`) and all the route files are still in place — just revert the route handler changes and restore `api/index.js` and `database.js`.

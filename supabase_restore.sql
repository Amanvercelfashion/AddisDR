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

-- Ratings (references businesses + users)
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

-- Site settings (key-value store for config like logo URL)
CREATE TABLE site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
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

-- Site settings — public read, service_role write
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read site settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Service role write site settings" ON site_settings FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role update site settings" ON site_settings FOR UPDATE USING (auth.role() = 'service_role');

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
  (9,  13, '/uploads/1780467552240-936640068.png',                                 'Modern Sofa Set',        'Comfort meets style — premium sofa crafted for your living room.',              '35,000 ETB',     'Gerji',     '2026-06-24T12:14:27.092Z'),
  (10, 14, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80', 'Home Comfort Furniture', 'Quality furniture and home decor to make your space truly comfortable.',          'From 2,500 ETB', 'Bole',      '2026-06-24T12:14:27.367Z'),
  (11, 15, 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&q=80', 'Gift Box Special',      'Unique gifts and souvenirs for every occasion — wrapped with care.',              'From 200 ETB',   'Megenagna', '2026-06-24T12:14:27.557Z'),
  (12, 16, 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&q=80', 'Latest Gadgets',         'Latest gadgets, accessories, and electronics at competitive prices.',             'From 500 ETB',   'Bole',      '2026-06-24T12:14:27.740Z'),
  (13, 17, 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&q=80', 'Ethiopian Fashion',      'Trendy fashion and apparel blending modern style with Ethiopian flair.',          '$$',             'Sarbet',    '2026-06-24T12:14:27.922Z'),
  (14, 18, 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&q=80', 'Dental Checkup',         'Comprehensive dental care with modern equipment and experienced dentists.',       'From 500 ETB',   'Bole',      '2026-06-24T12:14:28.106Z'),
  (15, 19, 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80', 'Language Tutoring',      'Language and academic tutoring bridging students to success.',                    'From 300 ETB/hr','Kazanchis', '2026-06-24T12:14:28.286Z'),
  (16, 20, 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&q=80', 'Fitness Training',       'Fitness training and event planning for a healthier, more vibrant lifestyle.',    'From 1,000 ETB', 'Summit',    '2026-06-24T12:14:28.452Z'),
  (17, 21, 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80', 'Premium Grooming',        'Premium grooming and barber services for the modern gentleman.',                  'From 250 ETB',   'Bole',      '2026-06-24T12:14:28.629Z'),
  (18, 22, 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80', 'Photography Session',    'Professional photography for events, portraits, and commercial projects.',        'From 3,000 ETB', 'Piassa',    '2026-06-24T12:14:28.798Z'),
  (19, 23, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80', 'Savory Bites Platter',    'Delicious local and international cuisine in a warm, inviting atmosphere.',       '$$',             'Megenagna', '2026-06-24T12:14:28.964Z');
SELECT setval('featured_items_id_seq', 19);

-- Products
INSERT INTO products (id, business_id, name, description, price, image_url, created_at)
OVERRIDING SYSTEM VALUE
VALUES
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
  (1, 13, 2, 5, '2026-06-03T06:32:39.516Z');
SELECT setval('ratings_id_seq', 1);

-- Reports (all previously referenced example businesses which are now removed)

-- Site settings (logo URL will be updated by upload script)
INSERT INTO site_settings (key, value) VALUES
  ('logo_url', '/images/addisdr-logo.svg')
ON CONFLICT (key) DO NOTHING;

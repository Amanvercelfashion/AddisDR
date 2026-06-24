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
  business_type TEXT DEFAULT 'service' CHECK (business_type IN ('product', 'service')),
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
INSERT INTO businesses (id, name, category_id, hood_id, website_link, phone_number, location_link, image_url, hook_text, price_indicator, business_type, rating_avg, rating_count, created_at, address)
OVERRIDING SYSTEM VALUE
VALUES
  (13, 'Aman furniture store',     3,  6,  'http://localhost:3001/admin.html', '+251988898022', 'http://localhost:3001/admin.html', '/uploads/1780467552240-936640068.png', 'Aman yleyal alkuh iko, Ychlal Aman Ychlal, Ychlal Aman Ychlal',          'From 2000 ETB',   'product', 5,   1,   '2026-06-03T06:19:12.275Z', 'Gerji, Addis Ababa, near Gerji Mazoria'),
  (14, 'Home Comfort',             3,  1,  'https://stores-addisdr.vercel.app/home-comfort', '+251911000014', 'https://maps.google.com', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80', 'Quality furniture and home decor to make your space truly comfortable.',                                         'From 2,500 ETB',  'product', 0,   0,   '2026-06-16T00:00:00.000Z', 'Bole, Addis Ababa, around Bole Medhanealem'),
  (15, 'Gift World',               11, 2,  'https://stores-addisdr.vercel.app/giftworld', '+251911000015', 'https://maps.google.com', 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=600&q=80', 'Unique gifts and souvenirs for every occasion — wrapped with care.',                                             'From 200 ETB',    'product', 0,   0,   '2026-06-16T00:00:00.000Z', 'Megenagna, Addis Ababa, near Megenagna Mall'),
  (16, 'Gadget Pro',               7,  1,  'https://stores-addisdr.vercel.app/gadgetpro', '+251911000016', 'https://maps.google.com', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80', 'Latest gadgets, accessories, and electronics at competitive prices.',                                            'From 500 ETB',    'product', 0,   0,   '2026-06-16T00:00:00.000Z', 'Bole, Addis Ababa, opposite Bole International Airport'),
  (17, 'Chic',                     6,  5,  'https://stores-addisdr.vercel.app/chic', '+251911000017', 'https://maps.google.com', 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&q=80', 'Trendy fashion and apparel blending modern style with Ethiopian flair.',                                         '$$',              'product', 0,   0,   '2026-06-16T00:00:00.000Z', 'Sarbet, Addis Ababa, near Sarbet Bus Terminal'),
  (18, 'BrightCare Dental Clinic', 5,  1,  'https://services-addisdr.vercel.app/brightcare-dental-clinic', '+251911000018', 'https://maps.google.com', 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&q=80', 'Comprehensive dental care with modern equipment and experienced dentists.',                                      'From 500 ETB',    'service', 0,   0,   '2026-06-16T00:00:00.000Z', 'Bole, Addis Ababa, behind Bole General Hospital'),
  (19, 'LinguaBridge Tutoring',    12, 3,  'https://services-addisdr.vercel.app/linguabridge-tutoring', '+251911000019', 'https://maps.google.com', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80', 'Language and academic tutoring bridging students to success.',                                                    'From 300 ETB/hr', 'service', 0,   0,   '2026-06-16T00:00:00.000Z', 'Kazanchis, Addis Ababa, near Kazanchis Police Station'),
  (20, 'Elevate Events and Fitness', 13, 8, 'https://services-addisdr.vercel.app/elevate-events-and-fitness', '+251911000020', 'https://maps.google.com', 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&q=80', 'Fitness training and event planning for a healthier, more vibrant lifestyle.',                                   'From 1,000 ETB',  'service', 0,   0,   '2026-06-16T00:00:00.000Z', 'Summit, Addis Ababa, near Summit Fitness Center'),
  (21, 'Refined Grooming Lounge',  8,  1,  'https://services-addisdr.vercel.app/refined-grooming-lounge', '+251911000021', 'https://maps.google.com', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80', 'Premium grooming and barber services for the modern gentleman.',                                                 'From 250 ETB',    'service', 0,   0,   '2026-06-16T00:00:00.000Z', 'Bole, Addis Ababa, near Bole Dembel City Center'),
  (22, 'Lens and Light Photography', 14, 4, 'https://services-addisdr.vercel.app/lens-and-light-photography', '+251911000022', 'https://maps.google.com', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80', 'Professional photography for events, portraits, and commercial projects.',                                      'From 3,000 ETB',  'service', 0,   0,   '2026-06-16T00:00:00.000Z', 'Piassa, Addis Ababa, near Piassa Meskel Square'),
  (23, 'Savory Bites Restaurant',  1,  2,  'https://services-addisdr.vercel.app/savory-bites-restaurant', '+251911000023', 'https://maps.google.com', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80', 'Delicious local and international cuisine in a warm, inviting atmosphere.',                                      '$$',              'service', 0,   0,   '2026-06-16T00:00:00.000Z', 'Megenagna, Addis Ababa, opposite Megenagna Church');

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

-- ============================================================
-- 2. MIGRATIONS
-- ============================================================
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS address TEXT;

-- Products
INSERT INTO products (id, business_id, name, description, price, image_url, created_at)
OVERRIDING SYSTEM VALUE
VALUES
  -- Aman Furniture Store (13)
  (27, 13, 'Modern Sofa Set',         'Premium comfort meets modern design — a centerpiece for your living room.',                                                                     '35,000 ETB',  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  (28, 13, 'Wooden Dining Table',     'Solid wood dining table that seats 6–8, perfect for family gatherings.',                                                                        '25,000 ETB',  'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  (29, 13, 'Queen Size Bed Frame',    'Elegant and sturdy bed frame with a contemporary finish.',                                                                                      '18,000 ETB',  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  (30, 13, 'Office Desk',             'Spacious desk with built-in storage for a productive workspace.',                                                                              '12,000 ETB',  'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  -- Home Comfort (14)
  (31, 14, 'Furniture Assembly Service',     'Professional assembly for all types of furniture.',                                                                                     'From 500 ETB', 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  (32, 14, 'Interior Design Consultation',   'Expert advice to transform your space with style.',                                                                                     'From 2,000 ETB','https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  (33, 14, 'Custom Furniture Making',         'Bespoke furniture crafted to your exact specifications.',                                                                               'From 5,000 ETB','https://images.unsplash.com/photo-1505798577917-a65157d3320a?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  (34, 14, 'Furniture Repair & Restoration',  'Give your old furniture a new lease on life.',                                                                                         'From 1,000 ETB','https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  -- Gift World (15)
  (35, 15, 'Gift Box Special',        'Curated gift boxes for every occasion — beautifully wrapped.',                                                                                  'From 200 ETB', 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  (36, 15, 'Handcrafted Souvenirs',   'Unique Ethiopian souvenirs made by local artisans.',                                                                                            'From 350 ETB', 'https://images.unsplash.com/photo-1603400521630-9f2de124b33b?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  (37, 15, 'Birthday Gift Basket',    'Thoughtfully arranged basket with treats and surprises.',                                                                                       'From 500 ETB', 'https://images.unsplash.com/photo-1549465220-1a8b9238cd50?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  (38, 15, 'Corporate Gift Sets',     'Professional gift sets for clients and employees.',                                                                                             'From 1,000 ETB','https://images.unsplash.com/photo-1513202331-3e9dc46abd0e?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  -- Gadget Pro (16)
  (39, 16, 'Wireless Headphones',     'High-quality wireless headphones with noise cancellation.',                                                                                     '2,500 ETB',    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  (40, 16, 'Phone Accessories Pack',  'Screen protector, case, and charger in one convenient pack.',                                                                                   'From 500 ETB', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  (41, 16, 'Smart Watch',             'Feature-packed smartwatch for fitness and daily use.',                                                                                          '8,000 ETB',    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  (42, 16, 'Bluetooth Speaker',       'Portable speaker with rich sound and deep bass.',                                                                                               '1,500 ETB',    'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  -- Chic (17)
  (43, 17, 'Habesha Kemis',           'Elegant traditional Ethiopian dress for special occasions.',                                                                                    'From 3,000 ETB','https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  (44, 17, 'Modern Dress',            'Stylish contemporary dress for casual and formal wear.',                                                                                        'From 1,500 ETB','https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  (45, 17, 'Men''s Suit',             'Tailored suit with modern fit for the professional gentleman.',                                                                                 'From 5,000 ETB','https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  (46, 17, 'Traditional Accessories', 'Complete your look with handcrafted jewelry and scarves.',                                                                                      'From 500 ETB', 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  -- BrightCare Dental Clinic (18)
  (47, 18, 'Dental Checkup',          'Comprehensive dental examination with modern equipment.',                                                                                       'From 500 ETB', 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  (48, 18, 'Teeth Whitening',         'Professional teeth whitening for a brighter smile.',                                                                                            'From 2,000 ETB','https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  (49, 18, 'Tooth Extraction',        'Safe and gentle tooth removal by experienced dentists.',                                                                                        'From 800 ETB', 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  (50, 18, 'Dental Filling',          'Durable fillings to restore damaged teeth.',                                                                                                    'From 1,000 ETB','https://images.unsplash.com/photo-1631382927884-6e59678ae866?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  -- LinguaBridge Tutoring (19)
  (51, 19, 'English Language Tutoring',   'Improve your English speaking, writing, and comprehension.',                                                                                'From 300 ETB/hr','https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  (52, 19, 'Mathematics Tutoring',        'From basic arithmetic to advanced calculus — we cover it all.',                                                                             'From 300 ETB/hr','https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  (53, 19, 'SAT & Exam Preparation',      'Intensive prep courses for SAT, TOEFL, and local exams.',                                                                                  'From 500 ETB/hr','https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  (54, 19, 'Amharic Language Course',     'Learn Amharic from beginner to conversational fluency.',                                                                                    'From 250 ETB/hr','https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  -- Elevate Events and Fitness (20)
  (55, 20, 'Personal Fitness Training',   'One-on-one training tailored to your fitness goals.',                                                                                      'From 1,000 ETB','https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  (56, 20, 'Group Fitness Classes',       'Energetic group sessions for motivation and fun.',                                                                                          'From 500 ETB/session','https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  (57, 20, 'Event Planning Service',      'Full-service event planning for weddings, parties, and corporate events.',                                                                'From 5,000 ETB','https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  (58, 20, 'Yoga & Wellness Sessions',    'Relax and rejuvenate with guided yoga and meditation.',                                                                                     'From 400 ETB', 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  -- Refined Grooming Lounge (21)
  (59, 21, 'Premium Haircut',             'Expert haircut tailored to your style and preference.',                                                                                     'From 250 ETB', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  (60, 21, 'Beard Grooming',             'Precision beard trim, shaping, and conditioning.',                                                                                          'From 200 ETB', 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  (61, 21, 'Facial Treatment',           'Deep cleansing and rejuvenating facial for healthy skin.',                                                                                   'From 400 ETB', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  (62, 21, 'Full Grooming Package',      'Haircut, beard trim, facial, and hot towel finish.',                                                                                         'From 800 ETB', 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  -- Lens and Light Photography (22)
  (63, 22, 'Portrait Photography',       'Professional portrait sessions for individuals and families.',                                                                               'From 3,000 ETB','https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  (64, 22, 'Wedding Photography',        'Complete wedding day coverage with stunning results.',                                                                                        'From 15,000 ETB','https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  (65, 22, 'Event Photography',          'Capture your corporate events, parties, and gatherings.',                                                                                    'From 5,000 ETB','https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  (66, 22, 'Commercial Product Shoot',   'High-quality product photography for your business.',                                                                                        'From 4,000 ETB','https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  -- Savory Bites Restaurant (23)
  (67, 23, 'Special Tibs Platter',       'Tender meat sautéed with onions, peppers, and aromatic spices.',                                                                             '350 ETB',      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  (68, 23, 'Pasta Special',              'Delicious pasta tossed in house-made sauce with fresh ingredients.',                                                                         '250 ETB',      'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  (69, 23, 'Grilled Fish',               'Freshly grilled fish served with seasonal vegetables.',                                                                                      '400 ETB',      'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80',  '2026-06-24T12:00:00.000Z'),
  (70, 23, 'Mixed Juice',                'Refreshing blend of seasonal fruits — served chilled.',                                                                                      '80 ETB',       'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&q=80',  '2026-06-24T12:00:00.000Z');
SELECT setval('products_id_seq', 70);

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

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const serverless = require('serverless-http');

// ── In-memory database ──────────────────────────────────────────
const dbPath = path.join(__dirname, 'data.json');

const defaultData = {
  categories: [], hoods: [], businesses: [], products: [],
  featured_items: [], ratings: [], reports: [], users: [],
  _counters: { categories: 0, hoods: 0, businesses: 0, products: 0,
               featured_items: 0, ratings: 0, reports: 0, users: 0 }
};

let data = null;

function dbLoad() {
  if (fs.existsSync(dbPath)) {
    try {
      data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    } catch (e) {
      data = JSON.parse(JSON.stringify(defaultData));
    }
  } else {
    data = JSON.parse(JSON.stringify(defaultData));
    dbSave();
  }
}

function dbSave() { if (data) fs.writeFileSync(dbPath, JSON.stringify(data, null, 2)); }

function dbGet() { if (!data) dbLoad(); return data; }

function dbNextId(table) {
  if (!data) dbLoad();
  data._counters[table] = (data._counters[table] || 0) + 1;
  return data._counters[table];
}

setInterval(dbSave, 10000);
process.on('exit', dbSave);
process.on('SIGINT', () => { dbSave(); process.exit(0); });
process.on('SIGTERM', () => { dbSave(); process.exit(0); });

dbLoad();

// ── Multer setup ────────────────────────────────────────────────
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    /jpeg|jpg|png|webp/.test(path.extname(file.originalname).toLowerCase())
      ? cb(null, true) : cb(new Error('Images only'));
  }
});

// ── Admin password ──────────────────────────────────────────────
const ADMIN_PASSWORD = 'Yoakin@2906admin';

function enrichUser(user, db) {
  const hood = db.hoods.find(h => h.id === user.hood_id);
  return {
    id: user.id, name: user.name, hood_id: user.hood_id,
    phone: user.phone,
    hood_name: hood ? hood.name : '',
    display_name: `${user.name} from ${hood ? hood.name : ''}`,
    created_at: user.created_at
  };
}

// ── Express app ─────────────────────────────────────────────────
const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadDir));

// ────────────────────────────────────────────────────────────────
// PUBLIC ROUTES
// ────────────────────────────────────────────────────────────────

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Categories
app.get('/api/categories', (req, res) => {
  try { res.json(dbGet().categories); }
  catch (error) { res.status(500).json({ error: error.message }); }
});

// Hoods
app.get('/api/hoods', (req, res) => {
  try { res.json(dbGet().hoods); }
  catch (error) { res.status(500).json({ error: error.message }); }
});

// Businesses
app.get('/api/businesses', (req, res) => {
  try {
    const db = dbGet();
    const { category, hood } = req.query;
    let businesses = db.businesses.map(b => {
      const cat = db.categories.find(c => c.id === b.category_id);
      const h = db.hoods.find(hd => hd.id === b.hood_id);
      return { ...b, category_name: cat ? cat.name : '', hood_name: h ? h.name : '' };
    });
    if (category && category !== 'all') businesses = businesses.filter(b => b.category_name === category);
    if (hood && hood !== 'all') businesses = businesses.filter(b => b.hood_name === hood);
    businesses.sort((a, b) => {
      if (b.rating_avg !== a.rating_avg) return b.rating_avg - a.rating_avg;
      return b.rating_count - a.rating_count;
    });
    res.json(businesses);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/businesses/:id', (req, res) => {
  try {
    const db = dbGet();
    const business = db.businesses.find(b => b.id === parseInt(req.params.id));
    if (!business) return res.status(404).json({ error: 'Business not found' });
    const cat = db.categories.find(c => c.id === business.category_id);
    const h = db.hoods.find(hd => hd.id === business.hood_id);
    res.json({ ...business, category_name: cat ? cat.name : '', hood_name: h ? h.name : '' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Featured items
app.get('/api/featured', (req, res) => {
  try {
    const db = dbGet();
    const items = db.featured_items.map(f => {
      const business = db.businesses.find(b => b.id === f.business_id);
      return { ...f, business_name: business ? business.name : '' };
    });
    res.json(items);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Products
app.get('/api/products/search', (req, res) => {
  try {
    const db = dbGet();
    const q = (req.query.q || '').trim().toLowerCase();
    if (!q || q.length < 2) return res.json([]);
    const results = (db.products || [])
      .filter(p => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q))
      .map(p => {
        const biz = db.businesses.find(b => b.id === p.business_id);
        const hood = biz ? db.hoods.find(h => h.id === biz.hood_id) : null;
        return { ...p, business_name: biz ? biz.name : '', business_id: biz ? biz.id : null, hood_name: hood ? hood.name : '' };
      })
      .slice(0, 20);
    res.json(results);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/products', (req, res) => {
  try {
    const db = dbGet();
    const { business_id } = req.query;
    let products = db.products || [];
    if (business_id) products = products.filter(p => p.business_id === parseInt(business_id));
    res.json(products);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Ratings
app.post('/api/ratings', (req, res) => {
  try {
    const db = dbGet();
    const { business_id, user_id, rating } = req.body;
    if (!user_id) return res.status(401).json({ error: 'You must be signed in to rate' });
    const user = db.users.find(u => u.id === user_id);
    if (!user) return res.status(401).json({ error: 'You must be signed in to rate' });
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    const existingIndex = db.ratings.findIndex(r => r.business_id === business_id && r.user_id === user_id);
    if (existingIndex >= 0) {
      db.ratings[existingIndex].rating = rating;
    } else {
      db.ratings.push({ id: dbNextId('ratings'), business_id, user_id, rating, created_at: new Date().toISOString() });
    }
    const businessRatings = db.ratings.filter(r => r.business_id === business_id);
    const avg = businessRatings.reduce((sum, r) => sum + r.rating, 0) / businessRatings.length;
    const business = db.businesses.find(b => b.id === business_id);
    if (business) { business.rating_avg = avg; business.rating_count = businessRatings.length; }
    dbSave();
    res.json({ success: true, rating_avg: avg, rating_count: businessRatings.length });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/ratings/user/:userId/business/:businessId', (req, res) => {
  try {
    const db = dbGet();
    const rating = db.ratings.find(r => r.user_id === parseInt(req.params.userId) && r.business_id === parseInt(req.params.businessId));
    res.json(rating || { rating: null });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Reports
app.post('/api/reports', (req, res) => {
  try {
    const db = dbGet();
    const { business_id, user_name, reason } = req.body;
    if (!user_name || !reason) return res.status(400).json({ error: 'Name and reason are required' });
    const report = { id: dbNextId('reports'), business_id, user_name, reason, created_at: new Date().toISOString() };
    db.reports.push(report);
    dbSave();
    res.json({ success: true, id: report.id });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Users
app.post('/api/users/register', async (req, res) => {
  try {
    const db = dbGet();
    const { name, hood_id, phone, password } = req.body;
    if (!name || !hood_id || !phone || !password) return res.status(400).json({ error: 'Name, neighbourhood, phone and password are required' });
    if (password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' });
    if (db.users.find(u => u.phone === phone)) return res.status(409).json({ error: 'Phone number already registered' });
    const password_hash = await bcrypt.hash(password, 10);
    const user = { id: dbNextId('users'), name: name.trim(), hood_id: parseInt(hood_id), phone: phone.trim(), password_hash, created_at: new Date().toISOString() };
    db.users.push(user);
    dbSave();
    res.json(enrichUser(user, db));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const db = dbGet();
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ error: 'Phone and password are required' });
    const user = db.users.find(u => u.phone === phone);
    if (!user) return res.status(401).json({ error: 'Phone number not found' });
    if (user.password_hash) {
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ error: 'Incorrect password' });
    }
    res.json(enrichUser(user, db));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/users/signin', (req, res) => {
  try {
    const db = dbGet();
    const { name, hood_id } = req.body;
    if (!name || !hood_id) return res.status(400).json({ error: 'Name and hood are required' });
    let user = db.users.find(u => u.name === name && u.hood_id === parseInt(hood_id));
    if (!user) {
      user = { id: dbNextId('users'), name, hood_id: parseInt(hood_id), created_at: new Date().toISOString() };
      db.users.push(user);
      dbSave();
    }
    res.json(enrichUser(user, db));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/users/:id', (req, res) => {
  try {
    const db = dbGet();
    const user = db.users.find(u => u.id === parseInt(req.params.id));
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(enrichUser(user, db));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ────────────────────────────────────────────────────────────────
// ADMIN ROUTES (protected by x-admin-token)
// ────────────────────────────────────────────────────────────────

app.post('/api/admin/auth', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) res.json({ success: true, token: ADMIN_PASSWORD });
  else res.status(401).json({ error: 'Wrong password' });
});

function adminAuth(req, res, next) {
  if (req.path === '/auth' && req.method === 'POST') return next();
  const token = req.headers['x-admin-token'] || req.query.token;
  if (token !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// Categories admin
app.get('/api/admin/categories', adminAuth, (req, res) => { res.json(dbGet().categories); });
app.post('/api/admin/categories', adminAuth, (req, res) => {
  const db = dbGet();
  const item = { id: dbNextId('categories'), name: req.body.name };
  db.categories.push(item); dbSave(); res.json(item);
});
app.put('/api/admin/categories/:id', adminAuth, (req, res) => {
  const db = dbGet();
  const item = db.categories.find(c => c.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: 'Not found' });
  item.name = req.body.name; dbSave(); res.json({ success: true });
});
app.delete('/api/admin/categories/:id', adminAuth, (req, res) => {
  const db = dbGet();
  db.categories = db.categories.filter(c => c.id !== parseInt(req.params.id));
  dbSave(); res.json({ success: true });
});

// Hoods admin
app.get('/api/admin/hoods', adminAuth, (req, res) => { res.json(dbGet().hoods); });
app.post('/api/admin/hoods', adminAuth, (req, res) => {
  const db = dbGet();
  const item = { id: dbNextId('hoods'), name: req.body.name, description: req.body.description || '' };
  db.hoods.push(item); dbSave(); res.json(item);
});
app.put('/api/admin/hoods/:id', adminAuth, (req, res) => {
  const db = dbGet();
  const item = db.hoods.find(h => h.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: 'Not found' });
  item.name = req.body.name; item.description = req.body.description || '';
  dbSave(); res.json({ success: true });
});
app.delete('/api/admin/hoods/:id', adminAuth, (req, res) => {
  const db = dbGet();
  db.hoods = db.hoods.filter(h => h.id !== parseInt(req.params.id));
  dbSave(); res.json({ success: true });
});

// Businesses admin
app.get('/api/admin/businesses', adminAuth, (req, res) => {
  const db = dbGet();
  const list = db.businesses.map(b => {
    const cat = db.categories.find(c => c.id === b.category_id);
    const hood = db.hoods.find(h => h.id === b.hood_id);
    return { ...b, category_name: cat?.name || '', hood_name: hood?.name || '' };
  });
  res.json(list);
});
app.post('/api/admin/businesses', adminAuth, upload.single('image'), (req, res) => {
  const db = dbGet();
  const { name, category_id, hood_id, website_link, phone_number, location_link, hook_text, price_indicator } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : req.body.image_url || null;
  const item = {
    id: dbNextId('businesses'), name, category_id: parseInt(category_id), hood_id: parseInt(hood_id),
    website_link: website_link || null, phone_number: phone_number || null,
    location_link: location_link || null, image_url, hook_text: hook_text || null,
    price_indicator: price_indicator || null, rating_avg: 0, rating_count: 0, created_at: new Date().toISOString()
  };
  db.businesses.push(item); dbSave(); res.json({ id: item.id, success: true });
});
app.put('/api/admin/businesses/:id', adminAuth, upload.single('image'), (req, res) => {
  const db = dbGet();
  const item = db.businesses.find(b => b.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: 'Not found' });
  const { name, category_id, hood_id, website_link, phone_number, location_link, hook_text, price_indicator } = req.body;
  item.name = name; item.category_id = parseInt(category_id); item.hood_id = parseInt(hood_id);
  item.website_link = website_link || null; item.phone_number = phone_number || null;
  item.location_link = location_link || null; item.hook_text = hook_text || null;
  item.price_indicator = price_indicator || null;
  if (req.file) item.image_url = `/uploads/${req.file.filename}`;
  dbSave(); res.json({ success: true });
});
app.delete('/api/admin/businesses/:id', adminAuth, (req, res) => {
  const db = dbGet();
  db.businesses = db.businesses.filter(b => b.id !== parseInt(req.params.id));
  dbSave(); res.json({ success: true });
});

// Featured items admin
app.get('/api/admin/featured', adminAuth, (req, res) => {
  const db = dbGet();
  const list = db.featured_items.map(f => {
    const biz = db.businesses.find(b => b.id === f.business_id);
    return { ...f, business_name: biz?.name || '' };
  });
  res.json(list);
});
app.post('/api/admin/featured', adminAuth, upload.single('image'), (req, res) => {
  const db = dbGet();
  const { business_id, title, hook_text, exact_price, location_text } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : req.body.image_url || null;
  const item = {
    id: dbNextId('featured_items'), business_id: parseInt(business_id), image_url, title,
    hook_text: hook_text || null, exact_price: exact_price || null,
    location_text: location_text || null, created_at: new Date().toISOString()
  };
  db.featured_items.push(item); dbSave(); res.json({ id: item.id, success: true });
});
app.put('/api/admin/featured/:id', adminAuth, upload.single('image'), (req, res) => {
  const db = dbGet();
  const item = db.featured_items.find(f => f.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: 'Not found' });
  const { business_id, title, hook_text, exact_price, location_text } = req.body;
  item.business_id = parseInt(business_id); item.title = title;
  item.hook_text = hook_text || null; item.exact_price = exact_price || null;
  item.location_text = location_text || null;
  if (req.file) item.image_url = `/uploads/${req.file.filename}`;
  dbSave(); res.json({ success: true });
});
app.delete('/api/admin/featured/:id', adminAuth, (req, res) => {
  const db = dbGet();
  db.featured_items = db.featured_items.filter(f => f.id !== parseInt(req.params.id));
  dbSave(); res.json({ success: true });
});

// Products admin
app.get('/api/admin/products', adminAuth, (req, res) => {
  const db = dbGet();
  const { business_id } = req.query;
  let products = db.products || [];
  if (business_id) products = products.filter(p => p.business_id === parseInt(business_id));
  const enriched = products.map(p => {
    const biz = db.businesses.find(b => b.id === p.business_id);
    return { ...p, business_name: biz?.name || '' };
  });
  res.json(enriched);
});
app.post('/api/admin/products', adminAuth, upload.single('image'), (req, res) => {
  const db = dbGet();
  if (!db.products) db.products = [];
  const { business_id, name, description, price } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : req.body.image_url || null;
  const item = {
    id: dbNextId('products'), business_id: parseInt(business_id), name,
    description: description || null, price: price || null, image_url,
    created_at: new Date().toISOString()
  };
  db.products.push(item); dbSave(); res.json({ id: item.id, success: true });
});
app.put('/api/admin/products/:id', adminAuth, upload.single('image'), (req, res) => {
  const db = dbGet();
  if (!db.products) return res.status(404).json({ error: 'Not found' });
  const item = db.products.find(p => p.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: 'Not found' });
  const { business_id, name, description, price } = req.body;
  item.business_id = parseInt(business_id); item.name = name;
  item.description = description || null; item.price = price || null;
  if (req.file) item.image_url = `/uploads/${req.file.filename}`;
  dbSave(); res.json({ success: true });
});
app.delete('/api/admin/products/:id', adminAuth, (req, res) => {
  const db = dbGet();
  if (!db.products) return res.json({ success: true });
  db.products = db.products.filter(p => p.id !== parseInt(req.params.id));
  dbSave(); res.json({ success: true });
});

// Reports admin
app.get('/api/admin/reports', adminAuth, (req, res) => {
  const db = dbGet();
  const list = db.reports.map(r => {
    const biz = db.businesses.find(b => b.id === r.business_id);
    return { ...r, business_name: biz?.name || '' };
  });
  list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(list);
});
app.get('/api/admin/reports/summary', adminAuth, (req, res) => {
  const db = dbGet();
  const summary = {};
  db.reports.forEach(r => {
    if (!summary[r.business_id]) {
      const biz = db.businesses.find(b => b.id === r.business_id);
      summary[r.business_id] = { id: r.business_id, name: biz?.name || '', report_count: 0 };
    }
    summary[r.business_id].report_count++;
  });
  const result = Object.values(summary).sort((a, b) => b.report_count - a.report_count);
  res.json(result);
});
app.delete('/api/admin/reports/:id', adminAuth, (req, res) => {
  const db = dbGet();
  db.reports = db.reports.filter(r => r.id !== parseInt(req.params.id));
  dbSave(); res.json({ success: true });
});

// ── Error handler ──────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

module.exports = serverless(app);

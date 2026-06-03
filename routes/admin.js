const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dbModule = require('../db/database');

// ===== ADMIN PASSWORD AUTH =====
const ADMIN_PASSWORD = 'Yoakin@2906admin';

router.use((req, res, next) => {
  // Allow GET requests to the password-check endpoint without auth
  if (req.path === '/auth' && req.method === 'POST') return next();
  const token = req.headers['x-admin-token'] || req.query.token;
  if (token !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// POST /api/admin/auth — verify password, return token
router.post('/auth', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    res.json({ success: true, token: ADMIN_PASSWORD });
  } else {
    res.status(401).json({ error: 'Wrong password' });
  }
});

// ===== MULTER SETUP =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
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

// ===== CATEGORIES =====
router.get('/categories', (req, res) => {
  res.json(dbModule.get().categories);
});

router.post('/categories', (req, res) => {
  const db = dbModule.get();
  const item = { id: dbModule.nextId('categories'), name: req.body.name };
  db.categories.push(item);
  dbModule.save();
  res.json(item);
});

router.put('/categories/:id', (req, res) => {
  const db = dbModule.get();
  const item = db.categories.find(c => c.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: 'Not found' });
  item.name = req.body.name;
  dbModule.save();
  res.json({ success: true });
});

router.delete('/categories/:id', (req, res) => {
  const db = dbModule.get();
  db.categories = db.categories.filter(c => c.id !== parseInt(req.params.id));
  dbModule.save();
  res.json({ success: true });
});

// ===== HOODS =====
router.get('/hoods', (req, res) => {
  res.json(dbModule.get().hoods);
});

router.post('/hoods', (req, res) => {
  const db = dbModule.get();
  const item = { id: dbModule.nextId('hoods'), name: req.body.name, description: req.body.description || '' };
  db.hoods.push(item);
  dbModule.save();
  res.json(item);
});

router.put('/hoods/:id', (req, res) => {
  const db = dbModule.get();
  const item = db.hoods.find(h => h.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: 'Not found' });
  item.name = req.body.name;
  item.description = req.body.description || '';
  dbModule.save();
  res.json({ success: true });
});

router.delete('/hoods/:id', (req, res) => {
  const db = dbModule.get();
  db.hoods = db.hoods.filter(h => h.id !== parseInt(req.params.id));
  dbModule.save();
  res.json({ success: true });
});

// ===== BUSINESSES =====
router.get('/businesses', (req, res) => {
  const db = dbModule.get();
  const list = db.businesses.map(b => {
    const cat = db.categories.find(c => c.id === b.category_id);
    const hood = db.hoods.find(h => h.id === b.hood_id);
    return { ...b, category_name: cat?.name || '', hood_name: hood?.name || '' };
  });
  res.json(list);
});

router.post('/businesses', upload.single('image'), (req, res) => {
  const db = dbModule.get();
  const { name, category_id, hood_id, website_link, phone_number, location_link, hook_text, price_indicator } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : req.body.image_url || null;
  const item = {
    id: dbModule.nextId('businesses'),
    name, category_id: parseInt(category_id), hood_id: parseInt(hood_id),
    website_link: website_link || null, phone_number: phone_number || null,
    location_link: location_link || null, image_url,
    hook_text: hook_text || null, price_indicator: price_indicator || null,
    rating_avg: 0, rating_count: 0, created_at: new Date().toISOString()
  };
  db.businesses.push(item);
  dbModule.save();
  res.json({ id: item.id, success: true });
});

router.put('/businesses/:id', upload.single('image'), (req, res) => {
  const db = dbModule.get();
  const item = db.businesses.find(b => b.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: 'Not found' });
  const { name, category_id, hood_id, website_link, phone_number, location_link, hook_text, price_indicator } = req.body;
  item.name = name;
  item.category_id = parseInt(category_id);
  item.hood_id = parseInt(hood_id);
  item.website_link = website_link || null;
  item.phone_number = phone_number || null;
  item.location_link = location_link || null;
  item.hook_text = hook_text || null;
  item.price_indicator = price_indicator || null;
  if (req.file) item.image_url = `/uploads/${req.file.filename}`;
  dbModule.save();
  res.json({ success: true });
});

router.delete('/businesses/:id', (req, res) => {
  const db = dbModule.get();
  db.businesses = db.businesses.filter(b => b.id !== parseInt(req.params.id));
  dbModule.save();
  res.json({ success: true });
});

// ===== FEATURED ITEMS =====
router.get('/featured', (req, res) => {
  const db = dbModule.get();
  const list = db.featured_items.map(f => {
    const biz = db.businesses.find(b => b.id === f.business_id);
    return { ...f, business_name: biz?.name || '' };
  });
  res.json(list);
});

router.post('/featured', upload.single('image'), (req, res) => {
  const db = dbModule.get();
  const { business_id, title, hook_text, exact_price, location_text } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : req.body.image_url || null;
  const item = {
    id: dbModule.nextId('featured_items'),
    business_id: parseInt(business_id), image_url, title,
    hook_text: hook_text || null, exact_price: exact_price || null,
    location_text: location_text || null, created_at: new Date().toISOString()
  };
  db.featured_items.push(item);
  dbModule.save();
  res.json({ id: item.id, success: true });
});

router.put('/featured/:id', upload.single('image'), (req, res) => {
  const db = dbModule.get();
  const item = db.featured_items.find(f => f.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: 'Not found' });
  const { business_id, title, hook_text, exact_price, location_text } = req.body;
  item.business_id = parseInt(business_id);
  item.title = title;
  item.hook_text = hook_text || null;
  item.exact_price = exact_price || null;
  item.location_text = location_text || null;
  if (req.file) item.image_url = `/uploads/${req.file.filename}`;
  dbModule.save();
  res.json({ success: true });
});

router.delete('/featured/:id', (req, res) => {
  const db = dbModule.get();
  db.featured_items = db.featured_items.filter(f => f.id !== parseInt(req.params.id));
  dbModule.save();
  res.json({ success: true });
});

// ===== PRODUCTS (per business) =====
router.get('/products', (req, res) => {
  const db = dbModule.get();
  const { business_id } = req.query;
  let products = db.products || [];
  if (business_id) products = products.filter(p => p.business_id === parseInt(business_id));
  const enriched = products.map(p => {
    const biz = db.businesses.find(b => b.id === p.business_id);
    return { ...p, business_name: biz?.name || '' };
  });
  res.json(enriched);
});

router.post('/products', upload.single('image'), (req, res) => {
  const db = dbModule.get();
  if (!db.products) db.products = [];
  const { business_id, name, description, price } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : req.body.image_url || null;
  const item = {
    id: dbModule.nextId('products'),
    business_id: parseInt(business_id),
    name, description: description || null,
    price: price || null, image_url,
    created_at: new Date().toISOString()
  };
  db.products.push(item);
  dbModule.save();
  res.json({ id: item.id, success: true });
});

router.put('/products/:id', upload.single('image'), (req, res) => {
  const db = dbModule.get();
  if (!db.products) return res.status(404).json({ error: 'Not found' });
  const item = db.products.find(p => p.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: 'Not found' });
  const { business_id, name, description, price } = req.body;
  item.business_id = parseInt(business_id);
  item.name = name;
  item.description = description || null;
  item.price = price || null;
  if (req.file) item.image_url = `/uploads/${req.file.filename}`;
  dbModule.save();
  res.json({ success: true });
});

router.delete('/products/:id', (req, res) => {
  const db = dbModule.get();
  if (!db.products) return res.json({ success: true });
  db.products = db.products.filter(p => p.id !== parseInt(req.params.id));
  dbModule.save();
  res.json({ success: true });
});

// ===== REPORTS =====
router.get('/reports', (req, res) => {
  const db = dbModule.get();
  const list = db.reports.map(r => {
    const biz = db.businesses.find(b => b.id === r.business_id);
    return { ...r, business_name: biz?.name || '' };
  });
  list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(list);
});

router.get('/reports/summary', (req, res) => {
  const db = dbModule.get();
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

router.delete('/reports/:id', (req, res) => {
  const db = dbModule.get();
  db.reports = db.reports.filter(r => r.id !== parseInt(req.params.id));
  dbModule.save();
  res.json({ success: true });
});

module.exports = router;

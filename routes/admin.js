const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/database');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// ===== CATEGORIES =====
router.get('/categories', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM categories ORDER BY name');
    res.json(stmt.all());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/categories', (req, res) => {
  try {
    const { name } = req.body;
    const stmt = db.prepare('INSERT INTO categories (name) VALUES (?)');
    const result = stmt.run(name);
    res.json({ id: result.lastInsertRowid, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/categories/:id', (req, res) => {
  try {
    const { name } = req.body;
    const stmt = db.prepare('UPDATE categories SET name = ? WHERE id = ?');
    stmt.run(name, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/categories/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM categories WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== HOODS =====
router.get('/hoods', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM hoods ORDER BY name');
    res.json(stmt.all());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/hoods', (req, res) => {
  try {
    const { name, description } = req.body;
    const stmt = db.prepare('INSERT INTO hoods (name, description) VALUES (?, ?)');
    const result = stmt.run(name, description || null);
    res.json({ id: result.lastInsertRowid, name, description });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/hoods/:id', (req, res) => {
  try {
    const { name, description } = req.body;
    const stmt = db.prepare('UPDATE hoods SET name = ?, description = ? WHERE id = ?');
    stmt.run(name, description || null, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/hoods/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM hoods WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== BUSINESSES =====
router.get('/businesses', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT 
        b.*,
        c.name as category_name,
        h.name as hood_name
      FROM businesses b
      JOIN categories c ON b.category_id = c.id
      JOIN hoods h ON b.hood_id = h.id
      ORDER BY b.name
    `);
    res.json(stmt.all());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/businesses', upload.single('image'), (req, res) => {
  try {
    const {
      name, category_id, hood_id, website_link,
      phone_number, location_link, hook_text, price_indicator
    } = req.body;
    
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    
    const stmt = db.prepare(`
      INSERT INTO businesses 
      (name, category_id, hood_id, website_link, phone_number, location_link, image_url, hook_text, price_indicator)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      name, category_id, hood_id, website_link || null,
      phone_number || null, location_link || null, image_url,
      hook_text || null, price_indicator || null
    );
    
    res.json({ id: result.lastInsertRowid, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/businesses/:id', upload.single('image'), (req, res) => {
  try {
    const {
      name, category_id, hood_id, website_link,
      phone_number, location_link, hook_text, price_indicator
    } = req.body;
    
    let image_url = req.body.existing_image_url;
    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    }
    
    const stmt = db.prepare(`
      UPDATE businesses SET
        name = ?, category_id = ?, hood_id = ?, website_link = ?,
        phone_number = ?, location_link = ?, image_url = ?,
        hook_text = ?, price_indicator = ?
      WHERE id = ?
    `);
    
    stmt.run(
      name, category_id, hood_id, website_link || null,
      phone_number || null, location_link || null, image_url,
      hook_text || null, price_indicator || null, req.params.id
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/businesses/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM businesses WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== FEATURED ITEMS =====
router.get('/featured', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT 
        f.*,
        b.name as business_name
      FROM featured_items f
      JOIN businesses b ON f.business_id = b.id
      ORDER BY f.created_at DESC
    `);
    res.json(stmt.all());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/featured', upload.single('image'), (req, res) => {
  try {
    const { business_id, title, hook_text, exact_price, location_text } = req.body;
    
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    
    const stmt = db.prepare(`
      INSERT INTO featured_items 
      (business_id, image_url, title, hook_text, exact_price, location_text)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      business_id, image_url, title,
      hook_text || null, exact_price || null, location_text || null
    );
    
    res.json({ id: result.lastInsertRowid, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/featured/:id', upload.single('image'), (req, res) => {
  try {
    const { business_id, title, hook_text, exact_price, location_text } = req.body;
    
    let image_url = req.body.existing_image_url;
    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    }
    
    const stmt = db.prepare(`
      UPDATE featured_items SET
        business_id = ?, image_url = ?, title = ?,
        hook_text = ?, exact_price = ?, location_text = ?
      WHERE id = ?
    `);
    
    stmt.run(
      business_id, image_url, title,
      hook_text || null, exact_price || null, location_text || null,
      req.params.id
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/featured/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM featured_items WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== REPORTS =====
router.get('/reports', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT 
        r.*,
        b.name as business_name
      FROM reports r
      JOIN businesses b ON r.business_id = b.id
      ORDER BY r.created_at DESC
    `);
    res.json(stmt.all());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/reports/summary', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT 
        b.id,
        b.name,
        COUNT(r.id) as report_count
      FROM businesses b
      LEFT JOIN reports r ON b.id = r.business_id
      GROUP BY b.id
      HAVING report_count > 0
      ORDER BY report_count DESC
    `);
    res.json(stmt.all());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/reports/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM reports WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

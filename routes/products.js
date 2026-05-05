const express = require('express');
const router = express.Router();
const dbModule = require('../db/database');

// GET /api/products/search?q=...
// Searches product name + description across all businesses
router.get('/search', (req, res) => {
  try {
    const db = dbModule.get();
    const q = (req.query.q || '').trim().toLowerCase();

    if (!q || q.length < 2) {
      return res.json([]);
    }

    const results = (db.products || [])
      .filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      )
      .map(p => {
        const biz = db.businesses.find(b => b.id === p.business_id);
        const hood = biz ? db.hoods.find(h => h.id === biz.hood_id) : null;
        return {
          ...p,
          business_name: biz ? biz.name : '',
          business_id: biz ? biz.id : null,
          hood_name: hood ? hood.name : ''
        };
      })
      .slice(0, 20); // cap at 20 results

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products?business_id=...  (all products for a business)
router.get('/', (req, res) => {
  try {
    const db = dbModule.get();
    const { business_id } = req.query;
    let products = db.products || [];
    if (business_id) {
      products = products.filter(p => p.business_id === parseInt(business_id));
    }
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

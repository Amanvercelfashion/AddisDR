const express = require('express');
const router = express.Router();
const dbModule = require('../db/database');

// GET all featured items
router.get('/', (req, res) => {
  try {
    const db = dbModule.get();
    const items = db.featured_items.map(f => {
      const business = db.businesses.find(b => b.id === f.business_id);
      return {
        ...f,
        business_name: business ? business.name : ''
      };
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

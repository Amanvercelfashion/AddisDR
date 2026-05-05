const express = require('express');
const router = express.Router();
const dbModule = require('../db/database');

// GET all businesses with optional filters
router.get('/', (req, res) => {
  try {
    const db = dbModule.get();
    const { category, hood } = req.query;
    
    let businesses = db.businesses.map(b => {
      const cat = db.categories.find(c => c.id === b.category_id);
      const h = db.hoods.find(hd => hd.id === b.hood_id);
      return {
        ...b,
        category_name: cat ? cat.name : '',
        hood_name: h ? h.name : ''
      };
    });
    
    // Apply filters
    if (category && category !== 'all') {
      businesses = businesses.filter(b => b.category_name === category);
    }
    
    if (hood && hood !== 'all') {
      businesses = businesses.filter(b => b.hood_name === hood);
    }
    
    // Sort by rating
    businesses.sort((a, b) => {
      if (b.rating_avg !== a.rating_avg) return b.rating_avg - a.rating_avg;
      return b.rating_count - a.rating_count;
    });
    
    res.json(businesses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single business by ID
router.get('/:id', (req, res) => {
  try {
    const db = dbModule.get();
    const business = db.businesses.find(b => b.id === parseInt(req.params.id));
    
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    
    const cat = db.categories.find(c => c.id === business.category_id);
    const h = db.hoods.find(hd => hd.id === business.hood_id);
    
    res.json({
      ...business,
      category_name: cat ? cat.name : '',
      hood_name: h ? h.name : ''
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

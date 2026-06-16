const express = require('express');
const router = express.Router();
const dbModule = require('../db/database');

// POST a new rating
router.post('/', (req, res) => {
  try {
    const db = dbModule.get();
    const { business_id, user_id, rating } = req.body;
    
    if (!user_id) {
      return res.status(401).json({ error: 'You must be signed in to rate' });
    }

    // Verify the user actually exists in the database
    const user = db.users.find(u => u.id === user_id);
    if (!user) {
      return res.status(401).json({ error: 'You must be signed in to rate' });
    }
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    // Check if user already rated
    const existingIndex = db.ratings.findIndex(r => 
      r.business_id === business_id && r.user_id === user_id
    );
    
    if (existingIndex >= 0) {
      // Update existing
      db.ratings[existingIndex].rating = rating;
    } else {
      // Add new
      db.ratings.push({
        id: dbModule.nextId('ratings'),
        business_id,
        user_id,
        rating,
        created_at: new Date().toISOString()
      });
    }
    
    // Recalculate business rating
    const businessRatings = db.ratings.filter(r => r.business_id === business_id);
    const avg = businessRatings.reduce((sum, r) => sum + r.rating, 0) / businessRatings.length;
    
    const business = db.businesses.find(b => b.id === business_id);
    if (business) {
      business.rating_avg = avg;
      business.rating_count = businessRatings.length;
    }
    
    dbModule.save();
    res.json({ success: true, rating_avg: avg, rating_count: businessRatings.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET user's rating for a business
router.get('/user/:userId/business/:businessId', (req, res) => {
  try {
    const db = dbModule.get();
    const rating = db.ratings.find(r => 
      r.user_id === parseInt(req.params.userId) && 
      r.business_id === parseInt(req.params.businessId)
    );
    res.json(rating || { rating: null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

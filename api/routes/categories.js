const express = require('express');
const router = express.Router();
const dbModule = require('../db/database');

// GET all categories
router.get('/', (req, res) => {
  try {
    const db = dbModule.get();
    res.json(db.categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

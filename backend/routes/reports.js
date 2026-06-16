const express = require('express');
const router = express.Router();
const dbModule = require('../db/database');

// POST a new report
router.post('/', (req, res) => {
  try {
    const db = dbModule.get();
    const { business_id, user_name, reason } = req.body;
    
    if (!user_name || !reason) {
      return res.status(400).json({ error: 'Name and reason are required' });
    }
    
    const report = {
      id: dbModule.nextId('reports'),
      business_id,
      user_name,
      reason,
      created_at: new Date().toISOString()
    };
    
    db.reports.push(report);
    dbModule.save();
    
    res.json({ success: true, id: report.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

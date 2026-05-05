const express = require('express');
const router = express.Router();
const dbModule = require('../db/database');

// POST sign in / create user
router.post('/signin', (req, res) => {
  try {
    const db = dbModule.get();
    const { name, hood_id } = req.body;
    
    if (!name || !hood_id) {
      return res.status(400).json({ error: 'Name and hood are required' });
    }
    
    // Check if user exists
    let user = db.users.find(u => u.name === name && u.hood_id === parseInt(hood_id));
    
    if (user) {
      const hood = db.hoods.find(h => h.id === user.hood_id);
      return res.json({
        ...user,
        hood_name: hood ? hood.name : '',
        display_name: `${user.name} from ${hood ? hood.name : ''}`
      });
    }
    
    // Create new user
    const hood = db.hoods.find(h => h.id === parseInt(hood_id));
    user = {
      id: dbModule.nextId('users'),
      name,
      hood_id: parseInt(hood_id),
      created_at: new Date().toISOString()
    };
    
    db.users.push(user);
    dbModule.save();
    
    res.json({
      ...user,
      hood_name: hood ? hood.name : '',
      display_name: `${name} from ${hood ? hood.name : ''}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET user by ID
router.get('/:id', (req, res) => {
  try {
    const db = dbModule.get();
    const user = db.users.find(u => u.id === parseInt(req.params.id));
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const hood = db.hoods.find(h => h.id === user.hood_id);
    res.json({
      ...user,
      hood_name: hood ? hood.name : '',
      display_name: `${user.name} from ${hood ? hood.name : ''}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

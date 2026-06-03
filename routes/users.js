const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const dbModule = require('../db/database');

// Helper — enrich user with hood_name and display_name
function enrichUser(user, db) {
  const hood = db.hoods.find(h => h.id === user.hood_id);
  return {
    id: user.id,
    name: user.name,
    hood_id: user.hood_id,
    phone: user.phone,
    hood_name: hood ? hood.name : '',
    display_name: `${user.name} from ${hood ? hood.name : ''}`,
    created_at: user.created_at
  };
}

// POST /api/users/register
router.post('/register', async (req, res) => {
  try {
    const db = dbModule.get();
    const { name, hood_id, phone, password } = req.body;

    if (!name || !hood_id || !phone || !password) {
      return res.status(400).json({ error: 'Name, neighbourhood, phone and password are required' });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    // Phone must be unique
    if (db.users.find(u => u.phone === phone)) {
      return res.status(409).json({ error: 'Phone number already registered' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = {
      id: dbModule.nextId('users'),
      name: name.trim(),
      hood_id: parseInt(hood_id),
      phone: phone.trim(),
      password_hash,
      created_at: new Date().toISOString()
    };
    db.users.push(user);
    dbModule.save();

    res.json(enrichUser(user, db));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/login
router.post('/login', async (req, res) => {
  try {
    const db = dbModule.get();
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password are required' });
    }

    const user = db.users.find(u => u.phone === phone);
    if (!user) {
      return res.status(401).json({ error: 'Phone number not found' });
    }

    // Legacy users (created without password) — let them in if no hash stored
    if (user.password_hash) {
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ error: 'Incorrect password' });
    }

    res.json(enrichUser(user, db));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/signin  (legacy — kept for backward compat)
router.post('/signin', (req, res) => {
  try {
    const db = dbModule.get();
    const { name, hood_id } = req.body;
    if (!name || !hood_id) return res.status(400).json({ error: 'Name and hood are required' });
    let user = db.users.find(u => u.name === name && u.hood_id === parseInt(hood_id));
    if (!user) {
      user = { id: dbModule.nextId('users'), name, hood_id: parseInt(hood_id),
               created_at: new Date().toISOString() };
      db.users.push(user);
      dbModule.save();
    }
    res.json(enrichUser(user, db));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id
router.get('/:id', (req, res) => {
  try {
    const db = dbModule.get();
    const user = db.users.find(u => u.id === parseInt(req.params.id));
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(enrichUser(user, db));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

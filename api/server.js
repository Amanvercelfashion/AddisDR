const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const serverless = require('serverless-http');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const ADMIN_PASSWORD = 'Yoakin@2906admin';

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ storage: multer.memoryStorage() });

async function uploadImage(file) {
  const ext = file.originalname.split('.').pop();
  const filePath = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
  const { error } = await supabase.storage.from('uploads').upload(filePath, file.buffer, {
    contentType: file.mimetype,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);
  return data.publicUrl;
}

// ── PUBLIC ROUTES ─────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/categories', async (req, res) => {
  try {
    const { data, error } = await supabase.from('categories').select('*').order('id');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/hoods', async (req, res) => {
  try {
    const { data, error } = await supabase.from('hoods').select('*').order('id');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/businesses', async (req, res) => {
  try {
    const { category, hood } = req.query;
    let query = supabase
      .from('vw_businesses')
      .select('*')
      .order('rating_avg', { ascending: false })
      .order('rating_count', { ascending: false });
    if (category && category !== 'all') {
      query = query.eq('category_name', category);
    }
    if (hood && hood !== 'all') {
      query = query.eq('hood_name', hood);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/businesses/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vw_businesses')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) return res.status(404).json({ error: 'Business not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/featured', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vw_featured_items')
      .select('*')
      .order('id');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) return res.json([]);
    const { data, error } = await supabase
      .from('vw_products')
      .select('*')
      .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
      .limit(20);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    let query = supabase.from('products').select('*').order('id');
    if (req.query.business_id) {
      query = query.eq('business_id', req.query.business_id);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ratings', async (req, res) => {
  try {
    const { business_id, user_id, rating } = req.body;
    if (!user_id) return res.status(401).json({ error: 'You must be signed in to rate' });
    const { data: userData } = await supabase.from('users').select('id').eq('id', user_id).maybeSingle();
    if (!userData) return res.status(401).json({ error: 'You must be signed in to rate' });
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5' });

    const { data: existing } = await supabase
      .from('ratings')
      .select('id')
      .eq('business_id', business_id)
      .eq('user_id', user_id)
      .maybeSingle();

    if (existing) {
      const { error: updateErr } = await supabase
        .from('ratings')
        .update({ rating })
        .eq('id', existing.id);
      if (updateErr) throw updateErr;
    } else {
      const { error: insertErr } = await supabase
        .from('ratings')
        .insert({ business_id, user_id, rating });
      if (insertErr) throw insertErr;
    }

    const { data: stats } = await supabase
      .from('ratings')
      .select('rating')
      .eq('business_id', business_id);

    const avg = stats.reduce((s, r) => s + r.rating, 0) / stats.length;
    await supabase
      .from('businesses')
      .update({ rating_avg: avg, rating_count: stats.length })
      .eq('id', business_id);

    res.json({ success: true, rating_avg: avg, rating_count: stats.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ratings/user/:userId/business/:businessId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ratings')
      .select('*')
      .eq('user_id', req.params.userId)
      .eq('business_id', req.params.businessId)
      .maybeSingle();
    if (error) throw error;
    res.json(data || { rating: null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reports', async (req, res) => {
  try {
    const { business_id, user_name, reason } = req.body;
    if (!user_name || !reason) return res.status(400).json({ error: 'Name and reason are required' });
    const { data, error } = await supabase
      .from('reports')
      .insert({ business_id, user_name, reason })
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, id: data.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/register', async (req, res) => {
  try {
    const { name, hood_id, phone, password } = req.body;
    if (!name || !hood_id || !phone || !password) {
      return res.status(400).json({ error: 'Name, neighbourhood, phone and password are required' });
    }
    if (password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' });

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();
    if (existing) return res.status(409).json({ error: 'Phone number already registered' });

    const password_hash = await bcrypt.hash(password, 10);
    const { data: user, error: insertErr } = await supabase
      .from('users')
      .insert({ name: name.trim(), hood_id: parseInt(hood_id), phone: phone.trim(), password_hash })
      .select()
      .single();
    if (insertErr) throw insertErr;

    const { data: enriched } = await supabase
      .from('vw_users')
      .select('*')
      .eq('id', user.id)
      .single();

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ error: 'Phone and password are required' });

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();
    if (!user) return res.status(401).json({ error: 'Phone number not found' });

    if (user.password_hash) {
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ error: 'Incorrect password' });
    }

    const { data: enriched } = await supabase
      .from('vw_users')
      .select('*')
      .eq('id', user.id)
      .single();

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/signin', async (req, res) => {
  try {
    const { name, hood_id } = req.body;
    if (!name || !hood_id) return res.status(400).json({ error: 'Name and hood are required' });

    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('name', name)
      .eq('hood_id', parseInt(hood_id))
      .maybeSingle();

    if (!user) {
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({ name, hood_id: parseInt(hood_id) })
        .select()
        .single();
      if (error) throw error;
      user = newUser;
    }

    const { data: enriched } = await supabase
      .from('vw_users')
      .select('*')
      .eq('id', user.id)
      .single();

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vw_users')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) return res.status(404).json({ error: 'User not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ADMIN ROUTES ──────────────────────────────────────────────

app.post('/api/admin/auth', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) res.json({ success: true, token: ADMIN_PASSWORD });
  else res.status(401).json({ error: 'Wrong password' });
});

function adminAuth(req, res, next) {
  if (req.path === '/auth' && req.method === 'POST') return next();
  const token = req.headers['x-admin-token'] || req.query.token;
  if (token !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// ———————————————————————————————
// Categories admin
// ———————————————————————————————

app.get('/api/admin/categories', adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('categories').select('*').order('id');
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/categories', adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('categories').insert({ name: req.body.name }).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/categories/:id', adminAuth, async (req, res) => {
  try {
    const { error } = await supabase.from('categories').update({ name: req.body.name }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/categories/:id', adminAuth, async (req, res) => {
  try {
    const { error } = await supabase.from('categories').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ———————————————————————————————
// Hoods admin
// ———————————————————————————————

app.get('/api/admin/hoods', adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('hoods').select('*').order('id');
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/hoods', adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('hoods').insert({ name: req.body.name, description: req.body.description || '' }).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/hoods/:id', adminAuth, async (req, res) => {
  try {
    const { error } = await supabase.from('hoods').update({ name: req.body.name, description: req.body.description || '' }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/hoods/:id', adminAuth, async (req, res) => {
  try {
    const { error } = await supabase.from('hoods').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ———————————————————————————————
// Businesses admin
// ———————————————————————————————

app.get('/api/admin/businesses', adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('vw_businesses').select('*').order('id');
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/businesses', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { name, category_id, hood_id, website_link, phone_number, location_link, hook_text, price_indicator } = req.body;
    let image_url = req.body.image_url || null;
    if (req.file) {
      image_url = await uploadImage(req.file);
    }
    const { data, error } = await supabase.from('businesses').insert({
      name, category_id: parseInt(category_id), hood_id: parseInt(hood_id),
      website_link: website_link || null, phone_number: phone_number || null,
      location_link: location_link || null, image_url, hook_text: hook_text || null,
      price_indicator: price_indicator || null, rating_avg: 0, rating_count: 0,
    }).select().single();
    if (error) throw error;
    res.json({ id: data.id, success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/businesses/:id', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { name, category_id, hood_id, website_link, phone_number, location_link, hook_text, price_indicator } = req.body;
    const updates = {
      name, category_id: parseInt(category_id), hood_id: parseInt(hood_id),
      website_link: website_link || null, phone_number: phone_number || null,
      location_link: location_link || null, hook_text: hook_text || null,
      price_indicator: price_indicator || null,
    };
    if (req.file) {
      updates.image_url = await uploadImage(req.file);
    }
    const { error } = await supabase.from('businesses').update(updates).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/businesses/:id', adminAuth, async (req, res) => {
  try {
    const { error } = await supabase.from('businesses').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ———————————————————————————————
// Featured items admin
// ———————————————————————————————

app.get('/api/admin/featured', adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('vw_featured_items').select('*').order('id');
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/featured', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { business_id, title, hook_text, exact_price, location_text } = req.body;
    let image_url = req.body.image_url || null;
    if (req.file) {
      image_url = await uploadImage(req.file);
    }
    const { data, error } = await supabase.from('featured_items').insert({
      business_id: parseInt(business_id), image_url, title,
      hook_text: hook_text || null, exact_price: exact_price || null,
      location_text: location_text || null,
    }).select().single();
    if (error) throw error;
    res.json({ id: data.id, success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/featured/:id', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { business_id, title, hook_text, exact_price, location_text } = req.body;
    const updates = {
      business_id: parseInt(business_id), title,
      hook_text: hook_text || null, exact_price: exact_price || null,
      location_text: location_text || null,
    };
    if (req.file) {
      updates.image_url = await uploadImage(req.file);
    }
    const { error } = await supabase.from('featured_items').update(updates).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/featured/:id', adminAuth, async (req, res) => {
  try {
    const { error } = await supabase.from('featured_items').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ———————————————————————————————
// Products admin
// ———————————————————————————————

app.get('/api/admin/products', adminAuth, async (req, res) => {
  try {
    let query = supabase.from('vw_products').select('*').order('id');
    if (req.query.business_id) {
      query = query.eq('business_id', req.query.business_id);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/products', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { business_id, name, description, price } = req.body;
    let image_url = req.body.image_url || null;
    if (req.file) {
      image_url = await uploadImage(req.file);
    }
    const { data, error } = await supabase.from('products').insert({
      business_id: parseInt(business_id), name,
      description: description || null, price: price || null, image_url,
    }).select().single();
    if (error) throw error;
    res.json({ id: data.id, success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/products/:id', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { business_id, name, description, price } = req.body;
    const updates = {
      business_id: parseInt(business_id), name,
      description: description || null, price: price || null,
    };
    if (req.file) {
      updates.image_url = await uploadImage(req.file);
    }
    const { error } = await supabase.from('products').update(updates).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/products/:id', adminAuth, async (req, res) => {
  try {
    const { error } = await supabase.from('products').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ———————————————————————————————
// Reports admin
// ———————————————————————————————

app.get('/api/admin/reports', adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vw_reports')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/reports/summary', adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('business_id, businesses!inner(name)');
    if (error) throw error;
    const summary = {};
    data.forEach(r => {
      if (!summary[r.business_id]) {
        summary[r.business_id] = { id: r.business_id, name: r.businesses?.name || '', report_count: 0 };
      }
      summary[r.business_id].report_count++;
    });
    const result = Object.values(summary).sort((a, b) => b.report_count - a.report_count);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/reports/:id', adminAuth, async (req, res) => {
  try {
    const { error } = await supabase.from('reports').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Error handler ──────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

module.exports = serverless(app);

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');
const serverless = require('serverless-http');
const { createClient } = require('@supabase/supabase-js');

const dbModule = require('./db/database');
const businessRoutes = require('./routes/businesses');
const featuredRoutes = require('./routes/featured');
const categoryRoutes = require('./routes/categories');
const hoodRoutes = require('./routes/hoods');
const ratingRoutes = require('./routes/ratings');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const productRoutes = require('./routes/products');

dbModule.load();

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/businesses', businessRoutes);
app.use('/api/featured', featuredRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/hoods', hoodRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

module.exports = serverless(app);

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
// Serve screenshot files from public/screenshots folder (for deployment)
// Also serve from .playwright-mcp for local development backward compatibility
app.use('/screenshots', express.static(path.join(__dirname, 'public', 'screenshots')));
app.use('/.playwright-mcp', express.static(path.join(__dirname, 'public', 'screenshots')));

// Data file paths
const DATA_DIR = path.join(__dirname, 'data');
const DECISIONS_FILE = path.join(DATA_DIR, 'decisions.json');
const ANSWERS_FILE = path.join(DATA_DIR, 'answers.json');
const PROGRESS_FILE = path.join(DATA_DIR, 'progress-log.json');
const INVENTORY_FILE = path.join(__dirname, 'exports', 'product-inventory.json');

// Helper: Read JSON file safely
function readJsonFile(filePath, defaultValue = {}) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
  }
  return defaultValue;
}

// Helper: Write JSON file safely
function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error.message);
    return false;
  }
}

// WooCommerce API client (initialized lazily to prevent startup crashes)
let wooCommerce = null;

function getWooCommerce() {
  if (!wooCommerce && process.env.WC_URL && process.env.WC_CONSUMER_KEY && process.env.WC_CONSUMER_SECRET) {
    wooCommerce = new WooCommerceRestApi({
      url: process.env.WC_URL,
      consumerKey: process.env.WC_CONSUMER_KEY,
      consumerSecret: process.env.WC_CONSUMER_SECRET,
      version: 'wc/v3'
    });
  }
  return wooCommerce;
}

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

// Check auth status
app.get('/api/auth/check', (req, res) => {
  const password = process.env.DASHBOARD_PASSWORD;
  res.json({
    required: !!password,
    authenticated: !password // If no password set, consider authenticated
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  const correctPassword = process.env.DASHBOARD_PASSWORD;

  if (!correctPassword) {
    return res.json({ success: true });
  }

  if (password === correctPassword) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Forkert adgangskode' });
  }
});

// ============================================
// PRODUCT INVENTORY ENDPOINTS
// ============================================

// Get full product inventory
app.get('/api/inventory', (req, res) => {
  try {
    const inventory = readJsonFile(INVENTORY_FILE, null);
    if (!inventory) {
      return res.status(404).json({ error: 'Product inventory not found. Run extract-products.js first.' });
    }
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// PRODUCT DECISIONS ENDPOINTS
// ============================================

// Get all decisions
app.get('/api/decisions', (req, res) => {
  const data = readJsonFile(DECISIONS_FILE, { updatedAt: null, decisions: {} });
  res.json(data);
});

// Save product decision
app.post('/api/products/:id/review', (req, res) => {
  const productId = req.params.id;
  const { decision } = req.body;

  if (!['keep', 'remove', 'undecided'].includes(decision)) {
    return res.status(400).json({ error: 'Invalid decision. Must be: keep, remove, or undecided' });
  }

  const data = readJsonFile(DECISIONS_FILE, { updatedAt: null, decisions: {} });
  data.decisions[productId] = {
    decision,
    updatedAt: new Date().toISOString()
  };
  data.updatedAt = new Date().toISOString();

  if (writeJsonFile(DECISIONS_FILE, data)) {
    res.json({ success: true, productId, decision });
  } else {
    res.status(500).json({ error: 'Failed to save decision' });
  }
});

// ============================================
// QUESTION ANSWERS ENDPOINTS
// ============================================

// Get all answers
app.get('/api/answers', (req, res) => {
  const data = readJsonFile(ANSWERS_FILE, { updatedAt: null, answers: {} });
  res.json(data);
});

// Save question answer
app.post('/api/questions/:id/answer', (req, res) => {
  const questionId = req.params.id;
  const { answer } = req.body;

  if (typeof answer !== 'string') {
    return res.status(400).json({ error: 'Answer must be a string' });
  }

  const data = readJsonFile(ANSWERS_FILE, { updatedAt: null, answers: {} });
  data.answers[questionId] = {
    answer,
    updatedAt: new Date().toISOString()
  };
  data.updatedAt = new Date().toISOString();

  if (writeJsonFile(ANSWERS_FILE, data)) {
    res.json({ success: true, questionId, answer });
  } else {
    res.status(500).json({ error: 'Failed to save answer' });
  }
});

// ============================================
// PROGRESS LOG ENDPOINTS
// ============================================

// Get progress log
app.get('/api/progress', (req, res) => {
  const data = readJsonFile(PROGRESS_FILE, { entries: [], milestones: {} });
  res.json(data);
});

// Add progress entry
app.post('/api/progress', (req, res) => {
  const { date, category, text } = req.body;

  if (!date || !category || !text) {
    return res.status(400).json({ error: 'Missing required fields: date, category, text' });
  }

  const validCategories = ['analyse', 'design', 'udvikling', 'indhold', 'admin'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({ error: `Invalid category. Must be one of: ${validCategories.join(', ')}` });
  }

  const data = readJsonFile(PROGRESS_FILE, { entries: [], milestones: {} });
  data.entries.unshift({ date, category, text, createdAt: new Date().toISOString() });

  if (writeJsonFile(PROGRESS_FILE, data)) {
    res.json({ success: true, entry: { date, category, text } });
  } else {
    res.status(500).json({ error: 'Failed to save progress entry' });
  }
});

// Update milestone
app.post('/api/progress/milestone', (req, res) => {
  const { milestone, completed } = req.body;

  if (!milestone || typeof completed !== 'boolean') {
    return res.status(400).json({ error: 'Missing required fields: milestone, completed (boolean)' });
  }

  const data = readJsonFile(PROGRESS_FILE, { entries: [], milestones: {} });
  data.milestones[milestone] = completed;

  if (writeJsonFile(PROGRESS_FILE, data)) {
    res.json({ success: true, milestone, completed });
  } else {
    res.status(500).json({ error: 'Failed to update milestone' });
  }
});

// ============================================
// WOOCOMMERCE ENDPOINTS
// ============================================

// Simple health check for Railway (no external dependencies)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WooCommerce connection test
app.get('/api/status', async (req, res) => {
  const wc = getWooCommerce();
  if (!wc) {
    return res.status(503).json({
      connected: false,
      error: 'WooCommerce not configured'
    });
  }
  try {
    await wc.get('');
    res.json({
      connected: true,
      store: process.env.WC_URL,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      connected: false,
      error: error.message
    });
  }
});

// Orders
app.get('/api/orders', async (req, res) => {
  const wc = getWooCommerce();
  if (!wc) return res.status(503).json({ error: 'WooCommerce not configured' });
  try {
    const params = {
      per_page: req.query.per_page || 50,
      page: req.query.page || 1,
      orderby: req.query.orderby || 'date',
      order: req.query.order || 'desc'
    };

    // Date filters
    if (req.query.after) params.after = req.query.after;
    if (req.query.before) params.before = req.query.before;
    if (req.query.status) params.status = req.query.status;

    const response = await wc.get('orders', params);
    res.json({
      orders: response.data,
      total: response.headers['x-wp-total'],
      totalPages: response.headers['x-wp-totalpages']
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Single order
app.get('/api/orders/:id', async (req, res) => {
  const wc = getWooCommerce();
  if (!wc) return res.status(503).json({ error: 'WooCommerce not configured' });
  try {
    const response = await wc.get(`orders/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Customers
app.get('/api/customers', async (req, res) => {
  const wc = getWooCommerce();
  if (!wc) return res.status(503).json({ error: 'WooCommerce not configured' });
  try {
    const params = {
      per_page: req.query.per_page || 50,
      page: req.query.page || 1,
      orderby: req.query.orderby || 'registered_date',
      order: req.query.order || 'desc'
    };

    if (req.query.search) params.search = req.query.search;

    const response = await wc.get('customers', params);
    res.json({
      customers: response.data,
      total: response.headers['x-wp-total'],
      totalPages: response.headers['x-wp-totalpages']
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Single customer
app.get('/api/customers/:id', async (req, res) => {
  const wc = getWooCommerce();
  if (!wc) return res.status(503).json({ error: 'WooCommerce not configured' });
  try {
    const response = await wc.get(`customers/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Customer orders - searches by both customer ID and email for complete results
app.get('/api/customers/:id/orders', async (req, res) => {
  const wc = getWooCommerce();
  if (!wc) return res.status(503).json({ error: 'WooCommerce not configured' });
  try {
    // Fetch orders by customer ID
    const byIdResponse = await wc.get('orders', {
      customer: req.params.id,
      per_page: 100
    });

    let allOrders = byIdResponse.data || [];
    const orderIds = new Set(allOrders.map(o => o.id));

    // If email is provided, also search by billing email to catch guest orders
    if (req.query.email) {
      try {
        const byEmailResponse = await wc.get('orders', {
          search: req.query.email,
          per_page: 100
        });

        // Add orders not already found by customer ID (avoid duplicates)
        (byEmailResponse.data || []).forEach(order => {
          if (!orderIds.has(order.id) &&
              order.billing &&
              order.billing.email &&
              order.billing.email.toLowerCase() === req.query.email.toLowerCase()) {
            allOrders.push(order);
          }
        });
      } catch (emailError) {
        console.warn('Email search failed:', emailError.message);
      }
    }

    // Sort by date (newest first)
    allOrders.sort((a, b) => new Date(b.date_created) - new Date(a.date_created));

    res.json({
      orders: allOrders,
      total: allOrders.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Products
app.get('/api/products', async (req, res) => {
  const wc = getWooCommerce();
  if (!wc) return res.status(503).json({ error: 'WooCommerce not configured' });
  try {
    const params = {
      per_page: req.query.per_page || 50,
      page: req.query.page || 1,
      orderby: req.query.orderby || 'date',
      order: req.query.order || 'desc'
    };

    if (req.query.category) params.category = req.query.category;
    if (req.query.search) params.search = req.query.search;
    if (req.query.status) params.status = req.query.status;

    const response = await wc.get('products', params);
    res.json({
      products: response.data,
      total: response.headers['x-wp-total'],
      totalPages: response.headers['x-wp-totalpages']
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Single product by ID
app.get('/api/products/:id', async (req, res) => {
  const wc = getWooCommerce();
  if (!wc) return res.status(503).json({ error: 'WooCommerce not configured' });
  try {
    const response = await wc.get(`products/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Product categories
app.get('/api/products/categories', async (req, res) => {
  const wc = getWooCommerce();
  if (!wc) return res.status(503).json({ error: 'WooCommerce not configured' });
  try {
    const response = await wc.get('products/categories', {
      per_page: 100
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reports - Sales totals
app.get('/api/reports/sales', async (req, res) => {
  const wc = getWooCommerce();
  if (!wc) return res.status(503).json({ error: 'WooCommerce not configured' });
  try {
    const params = {};
    if (req.query.date_min) params.date_min = req.query.date_min;
    if (req.query.date_max) params.date_max = req.query.date_max;

    const response = await wc.get('reports/sales', params);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reports - Top sellers
app.get('/api/reports/top_sellers', async (req, res) => {
  const wc = getWooCommerce();
  if (!wc) return res.status(503).json({ error: 'WooCommerce not configured' });
  try {
    const params = { period: req.query.period || 'year' };
    if (req.query.date_min) params.date_min = req.query.date_min;
    if (req.query.date_max) params.date_max = req.query.date_max;

    const response = await wc.get('reports/top_sellers', params);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reports - Orders totals by status
app.get('/api/reports/orders/totals', async (req, res) => {
  const wc = getWooCommerce();
  if (!wc) return res.status(503).json({ error: 'WooCommerce not configured' });
  try {
    const response = await wc.get('reports/orders/totals');
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reports - Customers totals
app.get('/api/reports/customers/totals', async (req, res) => {
  const wc = getWooCommerce();
  if (!wc) return res.status(503).json({ error: 'WooCommerce not configured' });
  try {
    const response = await wc.get('reports/customers/totals');
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reports - Products totals
app.get('/api/reports/products/totals', async (req, res) => {
  const wc = getWooCommerce();
  if (!wc) return res.status(503).json({ error: 'WooCommerce not configured' });
  try {
    const response = await wc.get('reports/products/totals');
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// System info (from audit data) - Comprehensive v1.0 audit findings
// UPDATED: totalRevenue corrected to 361,109 DKK (full extraction)
app.get('/api/audit', (req, res) => {
  res.json({
    platform: {
      cms: 'WordPress',
      ecommerce: 'WooCommerce 10.4.3',
      theme: 'Avada 7.14.2',
      hosting: 'one.com Beginner',
      php: '8.4',
      database: 'MariaDB'
    },

    // Quick Reference Metrics (from AUDIT-INDEX.md)
    quickReference: {
      products: { count: 158, breakdown: '20 simple, 138 variable' },
      productVariations: 206,
      totalSKUs: 368,
      orders: { count: '1,163', span: '9 years of history (2017-2026)' },
      users: { total: 67, breakdown: '62 customers, 4 admin, 1 manager' },
      databaseTables: 88,
      activePlugins: 11,
      mediaFiles: 282,
      urlRedirects: 10,
      productCategories: 9
    },

    // Sales Statistics - UPDATED with complete extraction data
    salesStats: {
      totalRevenue: 361109,
      totalCompletedOrders: 643,
      averageOrderValue: 562,
      uniqueCustomers: 295,
      repeatCustomerRate: 6.8,
      averageCLV: 563,
      revenueByYear: [
        { year: 2017, revenue: 19752, orders: 40, aov: 494 },
        { year: 2018, revenue: 70409, orders: 109, aov: 646 },
        { year: 2019, revenue: 94412, orders: 140, aov: 674 },
        { year: 2020, revenue: 76454, orders: 156, aov: 490 },
        { year: 2021, revenue: 27882, orders: 72, aov: 387 },
        { year: 2022, revenue: 27519, orders: 44, aov: 625 },
        { year: 2023, revenue: 6163, orders: 14, aov: 440 },
        { year: 2024, revenue: 3669, orders: 9, aov: 408 },
        { year: 2025, revenue: 29584, orders: 56, aov: 528 },
        { year: 2026, revenue: 5265, orders: 3, aov: 1755 }
      ],
      topProductsByRevenue: [
        { rank: 1, productId: 177, name: 'Chapeau Clarque', revenue: 62440, pctOfTotal: 17.3 },
        { rank: 2, productId: 857, name: 'Chauffør Kasket', revenue: 33104, pctOfTotal: 9.2 },
        { rank: 3, productId: 173, name: 'Bowler', revenue: 28662, pctOfTotal: 7.9 },
        { rank: 4, productId: 1779, name: 'Tyrolerhat 569', revenue: 21305, pctOfTotal: 5.9 },
        { rank: 5, productId: 158, name: 'Læderkasket', revenue: 17965, pctOfTotal: 5.0 },
        { rank: 6, productId: 161, name: 'Høj Hat', revenue: 10792, pctOfTotal: 3.0 },
        { rank: 7, productId: 288, name: 'Kjoleskjorte Boswell', revenue: 8952, pctOfTotal: 2.5 },
        { rank: 8, productId: 1775, name: 'Kaptajn Kasket 562', revenue: 7401, pctOfTotal: 2.0 },
        { rank: 9, productId: 286, name: 'Kjolevest Boswell', revenue: 6925, pctOfTotal: 1.9 },
        { rank: 10, productId: 1630, name: 'Lux Panama 2042', revenue: 6855, pctOfTotal: 1.9 }
      ],
      ordersByStatus: [
        { status: 'On-hold', count: 441, pct: 37.9 },
        { status: 'Completed', count: 643, pct: 55.3 },
        { status: 'Processing', count: 16, pct: 1.4 },
        { status: 'Pending', count: 13, pct: 1.1 },
        { status: 'Cancelled', count: 50, pct: 4.3 }
      ],
      // Channel distribution for Overview enhancement
      channelDistribution: {
        note: 'Estimated annual revenue by sales channel',
        channels: [
          { name: 'Fysisk butik', revenue: 364000, note: '~3.5K DKK/dag × 2 dage × 52 uger' },
          { name: 'Tønder Festival', revenue: 50000, note: 'Årlig festival (estimate)' },
          { name: 'Website (2019 peak)', revenue: 94412, note: 'Bedste år uden optimering' },
          { name: 'Website (2025)', revenue: 29584, note: 'Seneste fulde år' }
        ],
        insight: 'Hjemmesiden nåede næsten 95K DKK i 2019 med nul optimering. Det er det største uudnyttede vækstpotentiale.'
      }
    },

    // Full Plugin List (from PLUGIN-INVENTORY.md)
    plugins: [
      { name: 'WooCommerce', version: '10.4.3', classification: 'Critical', author: 'Automattic', customCode: false },
      { name: 'Frisbii Pay (Reepay)', version: '1.8.8', classification: 'Critical', author: 'Frisbii', customCode: false },
      { name: 'Avada Builder', version: '3.14.2', classification: 'Critical', author: 'ThemeFusion', customCode: false },
      { name: 'Avada Core', version: '5.14.2', classification: 'Critical', author: 'ThemeFusion', customCode: false },
      { name: 'Conditional Shipping for WooCommerce', version: '3.6.1', classification: 'Medium', author: 'Lauri Karisola / WP Trio', customCode: false },
      { name: 'Cookie-Script.com', version: '1.4.3', classification: 'Medium', author: 'Cookie-Script.com', customCode: false },
      { name: 'Redirection', version: '5.6.1', classification: 'Medium', author: 'John Godley', customCode: false },
      { name: 'Slider Revolution', version: '6.7.39', classification: 'Medium', author: 'ThemePunch', customCode: false },
      { name: 'All-in-One WP Migration', version: '7.101', classification: 'Low', author: 'ServMask', customCode: false },
      { name: 'All-in-One WP Migration Unlimited', version: '2.81', classification: 'Low', author: 'ServMask', customCode: false },
      { name: 'WP Mail Logging', version: '1.15.0', classification: 'Low', author: 'WP Mail Logging Team', customCode: false }
    ],

    // Scores (realistic assessment from comprehensive audit)
    scores: {
      overall: 62,
      technicalSEO: 60,
      performance: 50,
      security: 50
    },

    // Key Findings (from AUDIT-INDEX.md)
    keyFindings: {
      positive: [
        'No custom code or plugins - All 11 plugins are standard off-the-shelf versions',
        'No child theme - All customizations are database-based (theme options)',
        'Standard plugin stack - All plugins have replaceable alternatives',
        'Clear payment integration - Reepay payment gateway is well-documented',
        'Privacy-conscious setup - No external analytics (Google Analytics, Facebook Pixel)',
        'Moderate data volumes - 158 products, ~1,163 orders over 9 years'
      ],
      technical: [
        { finding: 'HPOS active for orders', impact: 'Modern storage format, orders in dedicated wc_orders tables' },
        { finding: 'Table prefix: www_', impact: 'Non-standard prefix (not wp_), note for migration' },
        { finding: 'Reepay in LIVE mode', impact: 'Payment gateway is production-ready, not test mode' },
        { finding: 'No CDN configured', impact: 'Current hosting plan does not include CDN' },
        { finding: 'Email auth missing', impact: 'SPF/DKIM/DMARC not configured on domain' }
      ],
      // What's Wrong - Consolidated issues requiring attention
      problems: [
        {
          category: 'performance',
          category_da: 'Ydeevne',
          category_en: 'Performance',
          issue: 'LCP 5.4 sekunder',
          issue_en: 'LCP 5.4 seconds',
          detail: 'Largest Contentful Paint er over det acceptable niveau. Google anbefaler under 2.5 sekunder.',
          detail_en: 'Largest Contentful Paint exceeds acceptable threshold. Google recommends under 2.5 seconds.',
          severity: 'high'
        },
        {
          category: 'performance',
          category_da: 'Ydeevne',
          category_en: 'Performance',
          issue: '~4 MB billedoptimering mulig',
          issue_en: '~4 MB image optimization possible',
          detail: 'Billeder er ikke komprimeret eller konverteret til moderne formater (WebP).',
          detail_en: 'Images are not compressed or converted to modern formats (WebP).',
          severity: 'high'
        },
        {
          category: 'accessibility',
          category_da: 'Tilgængelighed',
          category_en: 'Accessibility',
          issue: 'Farvekontrastfejl',
          issue_en: 'Color contrast failure',
          detail: 'Orange tekst (#ff9800) på hvid baggrund giver kun 2.15:1 kontrast. WCAG kræver mindst 4.5:1.',
          detail_en: 'Orange text (#ff9800) on white background gives only 2.15:1 contrast. WCAG requires at least 4.5:1.',
          severity: 'medium'
        },
        {
          category: 'seo',
          category_da: 'SEO',
          category_en: 'SEO',
          issue: 'Manglende meta-beskrivelser',
          issue_en: 'Missing meta descriptions',
          detail: 'Produktsider har ingen tilpassede meta-beskrivelser. Dette påvirker klikrate i søgeresultater.',
          detail_en: 'Product pages have no custom meta descriptions. This affects click-through rate in search results.',
          severity: 'medium'
        },
        {
          category: 'seo',
          category_da: 'SEO',
          category_en: 'SEO',
          issue: 'Manglende LocalBusiness schema',
          issue_en: 'Missing LocalBusiness schema',
          detail: 'Ingen struktureret data for butikken (adresse, åbningstider, telefon). Vigtigt for lokal SEO.',
          detail_en: 'No structured data for the store (address, hours, phone). Important for local SEO.',
          severity: 'medium'
        },
        {
          category: 'security',
          category_da: 'Sikkerhed',
          category_en: 'Security',
          issue: 'Manglende sikkerhedsheaders',
          issue_en: 'Missing security headers',
          detail: 'HSTS, CSP, X-Frame-Options er ikke konfigureret. Standard sikkerhedspraksis.',
          detail_en: 'HSTS, CSP, X-Frame-Options are not configured. Standard security practice.',
          severity: 'medium'
        },
        {
          category: 'email',
          category_da: 'E-mail',
          category_en: 'Email',
          issue: 'E-mail-autentificering mangler',
          issue_en: 'Email authentication missing',
          detail: 'SPF, DKIM og DMARC er ikke konfigureret. E-mails kan ende i spam.',
          detail_en: 'SPF, DKIM, and DMARC are not configured. Emails may end up in spam.',
          severity: 'high'
        },
        {
          category: 'design',
          category_da: 'Design',
          category_en: 'Design',
          issue: 'Forældet design',
          issue_en: 'Outdated design',
          detail: 'Avada tema fra 2016 med Fusion Builder. Ikke mobil-optimeret. Moderne kunder forventer bedre.',
          detail_en: 'Avada theme from 2016 with Fusion Builder. Not mobile-optimized. Modern customers expect better.',
          severity: 'high'
        },
        {
          category: 'content',
          category_da: 'Indhold',
          category_en: 'Content',
          issue: '20 irrelevante produkter',
          issue_en: '20 irrelevant products',
          detail: 'Kjoler, Hawaii-skjorter og festtøj passer ikke til en hattebutik. Forvirrer kunder.',
          detail_en: 'Dresses, Hawaiian shirts, and party clothing don\'t fit a hat store. Confuses customers.',
          severity: 'medium'
        },
        {
          category: 'analytics',
          category_da: 'Analyse',
          category_en: 'Analytics',
          issue: 'Ingen sporingsværktøjer',
          issue_en: 'No tracking tools',
          detail: 'Ingen Google Analytics eller Facebook Pixel. Svært at måle markedsføring.',
          detail_en: 'No Google Analytics or Facebook Pixel. Difficult to measure marketing.',
          severity: 'low'
        }
      ]
    },

    // Expanded Recommendations (from AUDIT-INDEX.md)
    recommendations: [
      { priority: 'High', item: 'Replace 230 Fusion Builder product sliders during rebuild', details: 'Content stored as shortcodes, requires parsing for migration' },
      { priority: 'High', item: 'Configure email authentication (SPF/DKIM/DMARC)', details: 'Not configured on domain, important for email deliverability' },
      { priority: 'Medium', item: 'Preserve 10 URL redirects during migration', details: 'Managed via Redirection plugin' },
      { priority: 'Medium', item: 'Add security headers (HSTS, CSP, X-Frame-Options)', details: 'Not currently set' },
      { priority: 'Medium', item: 'Fix orange text contrast (2.15:1 to 4.5:1)', details: 'Accessibility improvement' },
      { priority: 'Low', item: 'Consider CDN for performance', details: 'Current hosting does not include CDN' }
    ],

    // Migration Readiness
    migrationReadiness: 'Klar',
    migrationDetails: {
      status: 'Ready - No custom code detected',
      dataToMigrate: [
        '158 products with 206 variations',
        '1,163 orders (HPOS format)',
        '62 customer accounts with billing/shipping data',
        '282 media files (2016-2024)',
        '10 URL redirects'
      ],
      criticalIntegrations: [
        'Reepay payment gateway (LIVE mode)',
        '4 weight-based shipping methods (45/70/200 DKK)',
        'CookieScript GDPR consent'
      ],
      preMigrationSteps: [
        'Decide on new platform/theme approach',
        'Verify Reepay compatibility with new platform',
        'Plan content migration strategy for Fusion Builder shortcodes',
        'Export product data with all attributes and variations',
        'Test payment flow in sandbox before going live'
      ]
    },

    // Audit metadata
    auditDate: 'February 2026',
    yearsActive: 9,
    domain: 'hattemanden.dk',
    market: 'Denmark (DKK)'
  });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  hattemanden.dk Dashboard Server                           ║
╠════════════════════════════════════════════════════════════╣
║  URL: http://localhost:${PORT}                               ║
║  Store: ${process.env.WC_URL || 'Not configured'}
╚════════════════════════════════════════════════════════════╝
  `);

  if (!process.env.WC_URL || !process.env.WC_CONSUMER_KEY) {
    console.log('⚠️  WARNING: WooCommerce credentials not configured!');
    console.log('   Create a .env file with:');
    console.log('   WC_URL=https://hattemanden.dk');
    console.log('   WC_CONSUMER_KEY=ck_xxxxx');
    console.log('   WC_CONSUMER_SECRET=cs_xxxxx\n');
  }

  if (process.env.DASHBOARD_PASSWORD) {
    console.log('🔒 Password protection enabled\n');
  }
});

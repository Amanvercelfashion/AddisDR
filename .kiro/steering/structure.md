# Project Structure

```
AddisNet/
├── server.js              # Express app entry point — middleware, route mounting, static serving
├── package.json
│
├── db/
│   ├── database.js        # JSON DB module: get(), save(), load(), nextId()
│   ├── data.json          # Live database file (created on first run / npm run init-db)
│   └── helpers.js         # Legacy sql.js helpers — unused, do not use
│
├── routes/                # One file per API resource, all use Express Router
│   ├── businesses.js      # GET / (with ?category & ?hood filters), GET /:id
│   ├── featured.js        # GET / — featured items enriched with business_name
│   ├── categories.js      # GET /
│   ├── hoods.js           # GET /
│   ├── products.js        # GET / (with ?business_id), GET /search?q=
│   ├── ratings.js         # POST /, GET /user/:userId/business/:businessId
│   ├── reports.js         # POST /
│   ├── users.js           # POST /signin, GET /:id
│   └── admin.js           # Full CRUD for all resources + report management + file uploads
│
├── scripts/
│   └── init-db.js         # Seeds data.json with sample categories, hoods, businesses, products
│
├── public/                # Served as static files; all frontend lives here
│   ├── index.html         # Single HTML file for the entire SPA
│   ├── app.js             # All frontend JS — state, API calls, rendering, UI logic
│   ├── app-old.js         # Legacy/backup — do not use or reference
│   ├── styles.css         # Main stylesheet
│   ├── business-page.css  # Styles for the business detail slide-in page
│   └── images/            # Static image assets (logos, SVG patterns)
│
└── uploads/               # Runtime image upload directory (auto-created by multer)
```

## Architectural Patterns

### Backend Routes
- Every route file requires `../db/database` and calls `dbModule.get()` to access the in-memory data object
- Mutations always call `dbModule.save()` after modifying data
- IDs are always integers; use `parseInt()` when reading from `req.params` or `req.body`
- Enrichment (joining related data) is done inline by array lookup — e.g. `db.categories.find(c => c.id === b.category_id)`
- Error responses use `res.status(4xx/5xx).json({ error: message })`
- Success responses for mutations return either the created object or `{ success: true }`

### Admin Routes
- All admin CRUD lives in a single `routes/admin.js` file, grouped by resource with section comments
- Image-uploading endpoints use `upload.single('image')` middleware from multer
- If a file is uploaded, `image_url` = `/uploads/<filename>`; otherwise fall back to `req.body.image_url`

### Frontend (`public/app.js`)
- Global state: `businesses`, `featuredProducts`, `categories`, `hoods`, `activeCategory`, `activeHood`, `currentUser`
- All API calls go through thin `async` wrapper functions (`fetchBusinesses`, `submitRating`, etc.) using `fetch()`
- Rendering is done by string interpolation into `innerHTML` — no virtual DOM or templating engine
- Business detail is a slide-in panel (`#bizPage`) toggled with `.open` class, not a separate page
- URL is updated with `history.replaceState` to support shareable links without full navigation

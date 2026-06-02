# Tech Stack

## Runtime & Framework

- **Runtime**: Node.js
- **Server framework**: Express 4.x (`server.js` is the entry point)
- **Frontend**: Vanilla JavaScript (no framework), plain HTML/CSS — single `index.html` SPA

## Key Libraries

| Package | Purpose |
|---|---|
| `express` | HTTP server and routing |
| `multer` | Multipart file uploads (images stored in `/uploads/`) |
| `helmet` | Security headers (CSP disabled intentionally) |
| `cors` | Cross-origin requests |
| `compression` | Gzip response compression |
| `nodemon` | Dev auto-reload (devDependency) |

## Database

- **Storage**: JSON file (`db/data.json`) — no SQL, no native modules
- **Module**: `db/database.js` — exposes `get()`, `save()`, `load()`, `nextId(table)`
- `db.helpers.js` contains legacy sql.js helpers; **not used** by any current route — ignore it
- Data is auto-saved every 10 seconds and on process exit/signals
- IDs are auto-incremented integers tracked in `_counters` inside `data.json`
- Collections: `categories`, `hoods`, `businesses`, `products`, `featured_items`, `ratings`, `reports`, `users`

## Common Commands

```bash
# Install dependencies
npm install

# Seed the database with sample data
npm run init-db

# Start production server (port 3001)
npm start

# Start dev server with auto-reload
npm run dev
```

Server runs on **http://localhost:3001** by default. Override with `PORT` env variable.

## File Uploads

- Uploaded via `multer` in admin routes; stored in `/uploads/` (auto-created)
- Referenced as `/uploads/<filename>` in `image_url` fields
- Accepted types: jpeg, jpg, png, webp — max 5 MB

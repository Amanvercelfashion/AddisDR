# AddisNET

A local business discovery platform for Addis Ababa, Ethiopia.

## Features

- **Business Discovery**: Browse local businesses by category and neighbourhood
- **Featured Products**: Highlighted products/services with direct links to businesses
- **Rating System**: Signed-in users can rate businesses (one rating per user per business)
- **Report System**: Users can report issues with businesses
- **Sign-In**: Simple name + neighbourhood authentication (no passwords)
- **Admin Panel**: Full CRUD for categories, hoods, businesses, and featured items
- **Report Management**: View and manage user reports

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **Frontend**: Vanilla JavaScript
- **File Uploads**: Multer

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Initialize Database

```bash
npm run init-db
```

This creates the database and seeds it with sample data:
- 10 categories
- 11 neighbourhoods
- 12 businesses
- 8 featured products

### 3. Start Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

Server runs on **http://localhost:3001**

## API Endpoints

### Public Endpoints

- `GET /api/businesses` - Get all businesses (optional filters: `?category=X&hood=Y`)
- `GET /api/businesses/:id` - Get single business
- `GET /api/featured` - Get all featured items
- `GET /api/categories` - Get all categories
- `GET /api/hoods` - Get all hoods
- `POST /api/ratings` - Submit a rating (requires user_id)
- `GET /api/ratings/user/:userId/business/:businessId` - Get user's rating
- `POST /api/reports` - Submit a report
- `POST /api/users/signin` - Sign in / create user
- `GET /api/users/:id` - Get user by ID

### Admin Endpoints

All admin endpoints are under `/api/admin`:

**Categories**
- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `PUT /api/admin/categories/:id`
- `DELETE /api/admin/categories/:id`

**Hoods**
- `GET /api/admin/hoods`
- `POST /api/admin/hoods`
- `PUT /api/admin/hoods/:id`
- `DELETE /api/admin/hoods/:id`

**Businesses**
- `GET /api/admin/businesses`
- `POST /api/admin/businesses` (multipart/form-data for image upload)
- `PUT /api/admin/businesses/:id` (multipart/form-data)
- `DELETE /api/admin/businesses/:id`

**Featured Items**
- `GET /api/admin/featured`
- `POST /api/admin/featured` (multipart/form-data for image upload)
- `PUT /api/admin/featured/:id` (multipart/form-data)
- `DELETE /api/admin/featured/:id`

**Reports**
- `GET /api/admin/reports` - Get all reports
- `GET /api/admin/reports/summary` - Get report count per business
- `DELETE /api/admin/reports/:id` - Delete a report

## Database Schema

### categories
- id (PK)
- name (unique)

### hoods
- id (PK)
- name (unique)
- description

### businesses
- id (PK)
- name
- category_id (FK)
- hood_id (FK)
- website_link
- phone_number
- location_link
- image_url
- hook_text
- price_indicator
- rating_avg
- rating_count
- created_at

### featured_items
- id (PK)
- business_id (FK)
- image_url
- title
- hook_text
- exact_price
- location_text
- created_at

### ratings
- id (PK)
- business_id (FK)
- user_id (FK)
- rating (1-5)
- created_at
- UNIQUE(business_id, user_id)

### reports
- id (PK)
- business_id (FK)
- user_name
- reason
- created_at

### users
- id (PK)
- name
- hood_id (FK)
- created_at
- UNIQUE(name, hood_id)

## File Structure

```
addisnet/
├── db/
│   ├── database.js          # Database connection & initialization
│   └── addisnet.db          # SQLite database file (created on first run)
├── routes/
│   ├── businesses.js        # Business endpoints
│   ├── featured.js          # Featured items endpoints
│   ├── categories.js        # Category endpoints
│   ├── hoods.js             # Hood endpoints
│   ├── ratings.js           # Rating endpoints
│   ├── reports.js           # Report endpoints
│   ├── users.js             # User endpoints
│   └── admin.js             # Admin CRUD endpoints
├── scripts/
│   └── init-db.js           # Database seeding script
├── public/
│   ├── index.html           # Frontend HTML
│   ├── styles.css           # Frontend CSS
│   └── app.js               # Frontend JavaScript
├── uploads/                 # Uploaded images (created automatically)
├── server.js                # Express server
├── package.json
└── README.md
```

## Features in Detail

### Sign-In System
- Users sign in with name + neighbourhood
- No passwords required
- Unique constraint on (name, hood_id) prevents duplicates
- User data stored in localStorage
- Display format: "Name from Hood"

### Rating System
- Only signed-in users can rate
- One rating per user per business
- Ratings update business.rating_avg and business.rating_count automatically
- Users can update their existing rating

### Featured Products
- Clicking a featured product scrolls to and highlights the linked business
- Each product shows: image, title, description, price, business name, location

### Report System
- Anyone can report issues
- Reports are NOT displayed publicly
- Admin can view all reports and sort businesses by report count

## License

MIT

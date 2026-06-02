# AddisNET — Product Overview

AddisNET is a local business discovery platform for Addis Ababa, Ethiopia. It helps users find, browse, and engage with local businesses by neighbourhood and category.

## Core Features

- **Business Directory**: Browse and filter businesses by category and neighbourhood (hood)
- **Featured Products Carousel**: Highlighted products/services that link back to their business
- **Product Search**: Full-text search across all products and services listed by businesses
- **Business Detail Page**: Full-screen slide-in page showing business info, products, rating, and actions
- **Rating System**: Signed-in users can rate businesses 1–5 stars (one rating per user per business; updates are allowed)
- **Report System**: Anyone can report a business issue; reports are admin-only and not shown publicly
- **Sign-In**: Passwordless auth — users sign in with name + neighbourhood; uniqueness is enforced on (name, hood_id)
- **Admin Panel**: Full CRUD for categories, hoods, businesses, featured items, and products; report management included

## User Identity

Users are identified by `name + hood_id`. There are no passwords. `display_name` is rendered as "Name from Hood". User data is persisted in browser `localStorage` under the key `addisdr_user`.

## URL Scheme

The app is a single-page application. Business pages are surfaced via `/?business=<slug>` query params. Slugs are derived from business names (lowercase, non-alphanumeric → hyphen). Legacy numeric IDs (`/?business=42`) are also supported.

# FreshKart (Pandhurna) — MERN
React + Bootstrap (client) · Node + Express (server) · MongoDB

## Run locally
1. `cd server && cp .env.example .env` → set MONGO_URI, JWT_SECRET, ADMIN_PASSWORD → `npm install && npm start`
2. `cd client && npm install && npm run dev` → open http://localhost:5173
3. Admin login: ADMIN_PHONE / ADMIN_PASSWORD from .env (created on first start with 6 sample products).

## Before launch
- Set the real WhatsApp number (`PHONE` in client/src/store.jsx) and FSSAI number (App.jsx footer)
- Confirm PINCODES, MIN_ORDER, DELIVERY_CHARGE, FREE_ABOVE in server/.env
- Review the draft policy text in pages.jsx
- Change the default admin password


## Design refresh
- Premium FreshKart supermarket UI using Palette 3 from the supplied reference: `#0a472e`, `#a8b324`, `#f1ffef`, `#0c2201`.
- Added responsive product/category layouts, modern shadows, gradients, glass effects, hover states, product animations and loading skeletons.
- Expanded catalog categories beyond fresh produce: groceries, bakery, snacks, beverages, household, personal care, beauty, electronics, home & kitchen, stationery and toys.
- Added high-quality product photo URLs to the starter catalog. Existing products are preserved; missing starter products are inserted on server startup.
- Existing authentication, cart, checkout, COD orders and admin functionality remain in place.

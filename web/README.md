# GigBit Web Module

Web module for GigBit including public landing pages and admin operations portal, backed by a Node.js + TypeScript API.

## Structure

```txt
web/
  backend/
    api/
      src/
      sql/
      package.json
      tsconfig.json
      .env.example
  database/
  frontend/
    index.html
    landing.html
    admin.html
    assets/
```

## Run API

```bash
cd web/backend/api
npm install
npm run dev
```

## Build API

```bash
cd web/backend/api
npm run build
npm run start
```

## Frontend

Open these in browser or host via static server:
- `web/frontend/landing.html`
- `web/frontend/admin.html`
- `web/frontend/index.html`

## Environment

- Copy `.env.example` to `.env`
- Configure DB, Redis, JWT, and mail variables before running API

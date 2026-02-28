# GigBit Repository Structure

This repository uses a split structure for web and app, with separate frontend/backend/database folders for both.

## Top-level layout

```text
app/
  frontend/
    flutter_app/
  backend/
  database/
    schema.sql

web/
  frontend/
    index.html
    landing.html
    admin.html
  backend/
    api/
  database/
    schema.sql
```

## Folder contract

- `web/frontend/`
  - Static website/admin portal files only.
  - Do not place backend code here.

- `web/backend/api/`
  - Node.js + TypeScript API used by both web and app.
  - Primary backend runtime location.

- `web/database/`
  - Web-side database schema source used by Docker compose init.

- `app/frontend/flutter_app/`
  - Flutter mobile app.

- `app/backend/`
  - Reserved app backend folder (kept separate by structure requirement).
  - Current runtime backend is shared in `web/backend/api/`.

- `app/database/`
  - App-side schema copy.

## Operational references

- Root workspace API scripts target:
  - `web/backend/api`

- Docker compose uses:
  - API context: `web/backend/api`
  - Schema init: `web/database/schema.sql`

- Android run scripts use:
  - `app/frontend/flutter_app`

## Notes

- Keep path updates consistent when moving files.
- Prefer updating references in:
  - `package.json`
  - `docker-compose.yml`
  - `scripts/*.cmd`, `scripts/*.ps1`
  - `web/frontend/*.html`

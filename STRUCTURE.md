# GigBit Repository Structure

This repository is split into `app` and `web` modules with dedicated documentation folders in each.

## Top-level layout

```text
app/
  README.md
  frontend/
    flutter_app/
  backend/
  database/
    schema.sql
  releases/
  docs/
    docx/
    ppt/
    screenshots/

web/
  README.md
  frontend/
    index.html
    landing.html
    admin.html
  backend/
    api/
  database/
    schema.sql
  docs/
    docx/
    ppt/
    screenshots/
```

## Operational References

- API runtime: `web/backend/api`
- Docker schema init: `web/database/schema.sql`
- Android app path: `app/frontend/flutter_app`

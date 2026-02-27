# Web Module (`web/`)

This module contains the web product surfaces and shared backend runtime.

## Structure

```text
web/
|- backend/
|  '- api/
|- database/
|  '- schema.sql
|- frontend/
|  |- landing.html
|  |- index.html
|  '- admin.html
'- docs/
   |- docx/
   |- ppt/
   '- screenshots/
```

## Folder Responsibilities

- `frontend/`: Static web pages and web assets.
- `backend/api/`: Node.js + TypeScript API used by both web and app.
- `database/`: Database schema and DB-related resources.
- `docs/docx`: Web documentation in `.doc`/`.docx`.
- `docs/ppt`: Web presentations in `.ppt`/`.pptx`.
- `docs/screenshots`: Web UI screenshots and admin flow captures.

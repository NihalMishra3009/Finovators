# App Module (`app/`)

This module contains the mobile product layer and app-side artifacts.

## Structure

```text
app/
|- backend/
|- database/
|  '- schema.sql
|- frontend/
|  '- flutter_app/
|- releases/
|  '- GigBit.apk
'- docs/
   |- docx/
   |- ppt/
   '- screenshots/
```

## Folder Responsibilities

- `frontend/flutter_app/`: Flutter source code for the mobile app.
- `backend/`: Reserved app-backend space (runtime API currently in `web/backend/api`).
- `database/`: App-side schema reference.
- `releases/`: APK and build artifacts.
- `docs/docx`: App documentation in `.doc`/`.docx`.
- `docs/ppt`: App presentations in `.ppt`/`.pptx`.
- `docs/screenshots`: App UI screenshots and walkthrough images.

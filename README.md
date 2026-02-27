# GigBit

GigBit is a full-stack fintech platform with two product surfaces:
- `app/`: Flutter mobile app for gig workers
- `web/`: Landing/admin web experience with shared backend API

## Repository Overview

```text
GigBit/
|- app/
|  |- README.md
|  |- backend/
|  |- database/
|  |- frontend/flutter_app/
|  |- releases/
|  '- docs/
|     |- docx/
|     |- ppt/
|     '- screenshots/
|- web/
|  |- README.md
|  |- backend/api/
|  |- database/
|  |- frontend/
|  '- docs/
|     |- docx/
|     |- ppt/
|     '- screenshots/
|- scripts/
|- DEPLOY_FREE.md
|- DEPLOY_NOW.md
|- STRUCTURE.md
'- README.md
```

## Module Guides

- App module guide: `app/README.md`
- Web module guide: `web/README.md`

## Quick Start

1. Install dependencies from repository root:
   - `npm install`
2. Start local infra and services:
   - `scripts\\start-stack.cmd`
3. Run web frontend from `web/frontend`.
4. Run Flutter app from `app/frontend/flutter_app`.

## Key Commands

- `npm run api:dev` - run backend API in development mode.
- `npm run api:build` - build backend API.
- `npm run api:start` - run backend API build output.
- `scripts\\run-android.cmd` - run Android app locally.

## Documentation Storage Convention

Use these folders for project materials:
- `app/docs/docx` and `web/docs/docx` for Word documents.
- `app/docs/ppt` and `web/docs/ppt` for presentations.
- `app/docs/screenshots` and `web/docs/screenshots` for UI captures.

## Deployment References

- `DEPLOY_FREE.md`
- `DEPLOY_NOW.md`

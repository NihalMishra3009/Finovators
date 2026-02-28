# GigBit â€” Gig Worker Payment & Benefits Platform

Stop juggling fragmented tools for gig workers. Run one connected platform for payouts, protection, and approvals.

GigBit is a full-stack fintech platform for gig workers with a Flutter mobile app, web landing/admin portals, and a shared Node.js API backend.

Earn â†’ Sync â†’ Withdraw â†’ Claim â†’ Manage.

---

## Problem

Gig workers and operations teams typically manage critical finance workflows across disconnected systems:

- Manual earning reconciliation from multiple gig platforms  
- Delayed withdrawals and no rollover-based limits  
- Separate channels for loan and insurance requests  
- Poor visibility for approvals and claims history  
- Weak real-time sync between app and admin operations  

Because workflows are split across tools:

- Cash-flow decisions are delayed  
- Trust in payout visibility drops  
- Support and operations overhead increases  
- Financial benefits remain underused  

### Root Cause

Gig worker finance is treated as separate modules instead of one continuous worker-to-ops transaction pipeline.

---

## Solution

GigBit unifies worker finance operations into one integrated system:

- Mobile app for workers (withdrawals, loans, insurance, notifications)  
- Web portals for customer/admin operations  
- Shared backend for consistency across channels  
- PostgreSQL + Redis for transactional reliability and speed  

No fragmented state.  
No duplicate workflows.  
No manual cross-tool reconciliation.

---

## Installation

1. Clone repository  
2. Install root dependencies  
3. Start infrastructure (Postgres + Redis)  
4. Run backend API  
5. Run web frontend and Flutter app

---

## Usage

1. Worker logs in via app  
2. Syncs platforms and views withdrawable balance  
3. Submits withdrawal / loan / insurance requests  
4. Admin reviews via web admin portal  
5. Status updates sync back to app immediately

---

## Commands

GigBit exposes operational commands/scripts through npm and project scripts:

- `npm run api:dev`  
  Runs backend API in development mode.

- `npm run api:build`  
  Builds backend API.

- `npm run api:start`  
  Runs built backend API.

- `scripts\start-stack.cmd`  
  Starts local stack (Docker + API bootstrap flow).

- `scripts\run-android.cmd`  
  Runs Flutter Android app with local API mapping.

---

## Quick Start

1. From project root, run `scripts\start-stack.cmd`  
2. Open `web/frontend/landing.html` and `web/frontend/admin.html`  
3. Run Flutter app from `app/frontend/flutter_app`  
4. Register/login and connect platforms  
5. Validate admin actions and app sync

GigBit automatically supports:

- Multi-platform worker earnings sync  
- Withdrawal limit + rollover logic  
- Loan and insurance claim lifecycles  
- Admin approvals/rejections with status propagation  
- Cross-channel consistency (web + app)

---

## First-Time Setup

On first local setup, ensure:

- Docker Desktop running  
- Flutter SDK + Android tooling installed  
- Node.js/npm installed  
- Environment variables configured in `.env`

---

## Requirements

- Node.js (LTS)  
- npm  
- Flutter SDK  
- Android SDK / Android Studio  
- Docker + Docker Compose  
- PostgreSQL and Redis (containerized in local setup)

---

## Target Users

- Gig workers (delivery partners, drivers, freelancers)  
- Operations/admin teams managing claims and approvals  
- Fintech operators running payout + protection workflows

---

## Core Design Principle

**One Worker Journey = One Unified Financial Operations Pipeline**

All critical user and admin actions must remain synchronized across app, web, backend, and database.

---

## Architecture

GigBit uses a modular service architecture across app, web, and backend layers:

- Worker app UX layer (Flutter)  
- Customer/admin web layer (HTML/CSS/JS)  
- Shared API and business logic (Node.js + TypeScript)  
- Transaction and cache layer (PostgreSQL + Redis)

Each module owns a focused responsibility while sharing a common backend contract.

---

## Tech Stack

- Flutter (Mobile App)  
- HTML/CSS/JavaScript (Web Frontend + Admin Portal)  
- Node.js + TypeScript (Backend API)  
- PostgreSQL (Primary data store)  
- Redis (Caching/queue support)  
- Docker Compose (Local orchestration)

![Flutter](https://img.shields.io/badge/Flutter-Mobile%20App-02569B)
![Node.js](https://img.shields.io/badge/Node.js-Backend-339933)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791)

---

## Folder Structure

Repository layout is split for app and web with separate frontend/backend/database folders:

- `app/frontend/flutter_app`  
- `app/backend`  
- `app/database`  
- `web/frontend`  
- `web/backend/api`  
- `web/database`

Structure is designed to keep worker app and web/admin concerns isolated while sharing backend contracts.

---

## Standardized Data & Flows

GigBit standardizes:

- Platform identity + logo handling  
- Approval status transitions  
- Withdrawal limit/rollover accounting  
- Insurance and loan request payloads  
- Notification-trigger event flow

This keeps app and web behavior aligned on every update.

---

## Feature Coverage

### Mobile App (Worker)

- Dashboard and platform integrations  
- Withdrawals with limit tracking  
- Emergency loan requests and claim history  
- Micro-insurance claims and contribution tracking  
- Push/device notifications

### Web (Landing + Admin)

- Public product landing flow  
- Admin login and guarded operations  
- Platform management (add/edit/enable/disable)  
- Loan/insurance/account-deletion approvals  
- Operational history and commission views

---

## Sync & Automation

GigBit supports real-time or near-real-time sync patterns for:

- Approval results from admin to app  
- Claims and withdrawal history updates  
- Platform changes reflected across channels  
- Backend-driven push notification triggers

---

## Security

- Role-based admin access control in portal workflows  
- OTP-based verification paths (admin/user flows)  
- No hardcoded user credentials in source  
- Environment-driven secrets management

---

## Error Handling

- Centralized backend validation for critical finance operations  
- User-safe error messaging in app/web UI  
- Defensive checks for limits, caps, and eligibility logic  
- Consistent status handling to avoid partial workflow state

---

## Deployment

Recommended deployment setup used in this project:

- Backend/API: Railway  
- Database: Supabase Postgres  
- Web frontend: Vercel  
- App distribution: APK artifact download from web

Use deployment docs in repository root:

- `DEPLOY_FREE.md`  
- `DEPLOY_NOW.md`

---

## Project Status

- App and web working in shared production-like flow  
- Admin + worker lifecycle integration implemented  
- Core fintech operations (withdrawal/loan/insurance) implemented  
- Deployment setup and environment-based configuration active

---

## Authors

- GigBit Team

---

## License

MIT License

# GigBit - Gig Worker Payment & Benefits Platform

GigBit is a full-stack fintech platform for gig workers that unifies payouts, protection, and approvals across mobile and web.

**Journey:** Earn -> Sync -> Withdraw -> Claim -> Manage

## Problem

Gig workers and operations teams often rely on disconnected tools for core finance workflows:

- Earnings reconciliation across multiple platforms
- Delayed withdrawals and poor withdrawable balance visibility
- Separate loan and insurance request channels
- Weak approval/status visibility for workers
- Manual operational overhead for admins

## Solution

GigBit provides one connected financial operations system:

- Worker Mobile App (Flutter): withdrawals, loans, insurance, notifications
- Web Portals: product landing + admin operations
- Shared Backend (Node.js + TypeScript): consistent business logic
- Reliable Data Layer: PostgreSQL + Redis

## Repository Structure

```txt
GigBit1/
  app/
    backend/
    database/
    frontend/
      flutter_app/
    releases/
  web/
    backend/
      api/
    database/
    frontend/
      assets/
  docs/
    screenshots/
    progress-log.md
    architecture.md
  scripts/
  README.md
  LICENSE
```

## Team Contribution Split

### App Team (3 Members)

1. Payouts, wallet, transaction lifecycle
2. Micro-insurance + emergency loan flows
3. Expense tracking + tax assistance workflows

### Web Team (2 Members)

1. Landing and user-facing web experience
2. Admin operations, approvals, and platform management

## Tech Stack

- Flutter (Mobile App)
- HTML/CSS/JavaScript (Web Frontend + Admin Portal)
- Node.js + TypeScript (Backend API)
- PostgreSQL (Primary Database)
- Redis (Cache / Queue support)
- Docker Compose (Local orchestration)

## Setup

1. Clone repository
2. Install dependencies
3. Start infrastructure (PostgreSQL + Redis)
4. Run backend API
5. Run web frontend and Flutter app

### Quick Commands

```bash
# from repo root
npm run api:install
npm run api:dev
```

```bash
# mobile app
cd app/frontend/flutter_app
flutter pub get
flutter run
```

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).

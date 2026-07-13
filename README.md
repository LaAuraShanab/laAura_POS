# La Aura POS

A modern Point of Sale system. Phase 1 MVP: authentication, product management, and sales/checkout.

## Stack

- **Client**: Vite + React + TypeScript, React Router, React Query, React Hook Form, Tailwind CSS v4
- **Server**: Node.js + Express + TypeScript, Prisma ORM, JWT auth (access + refresh rotation)
- **Database**: PostgreSQL

## Prerequisites

- Node.js 20+
- PostgreSQL running locally (create a database, e.g. `la_aura_pos`)

## Setup

```bash
npm install --prefix server
npm install --prefix client

# copy env templates and fill in real values
cp server/.env.example server/.env

npm --prefix server run prisma:migrate
npm --prefix server run prisma:seed
```

## Development

```bash
npm run dev
```

- API: http://localhost:4000
- Web: http://localhost:5173 (proxies `/api` to the server)

Seeded accounts (see console output after seeding):
- `admin@laaura.pos`
- `cashier@laaura.pos`

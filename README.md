# ForRealBank

A modern, scalable fintech platform built with TypeScript, featuring real-time trading, account management, and social features for banking and investment services.

[![CI Pipeline](https://github.com/Wixkun/forRealBank/actions/workflows/ci.yml/badge.svg)](https://github.com/Wixkun/forRealBank/actions/workflows/ci.yml)

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Docker Setup](#docker-setup)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)

## Overview

ForRealBank is a comprehensive fintech solution offering:

- **Account Management** — User accounts with multi-currency support
- **Authentication & Security** — JWT-based auth with bcrypt password hashing
- **Trading & Brokerage** — Real-time market data and trading capabilities
- **Transactions** — Secure payment and fund transfer processing
- **Social Features** — In-app chat, activity feeds, and notifications
- **Monitoring & Analytics** — Prometheus metrics and Grafana dashboards
- **Admin Dashboard** — PgAdmin interface for database management

## Technology Stack

### Backend
- **Framework**: [NestJS](https://nestjs.com) — TypeScript-first Node.js framework
- **Runtime**: Node.js 22+ 
- **Package Manager**: [pnpm](https://pnpm.io) — Fast, disk space efficient package manager

### Frontend
- **Framework**: [Next.js 14+](https://nextjs.org) — React with TypeScript
- **Styling**: TailwindCSS
- **E2E Testing**: Playwright
- **Internationalization**: i18n

### Database & Infrastructure
- **Database**: PostgreSQL 16
- **Database Client**: TypeORM
- **Monitoring**: Prometheus + Grafana
- **Containerization**: Docker & Docker Compose
- **Security**: JWT, bcrypt, UUID generation

### Architecture Pattern
- **Monorepo**: pnpm workspaces with shared packages
- **Clean Architecture**: Domain → Application → Infrastructure layers
- **Package Structure**:
  - `@forreal/domain` — Business logic entities
  - `@forreal/application` — Use cases and services
  - `@forreal/infrastructure/*` — Technical implementations (crypto, DB, JWT, UUID)

## Project Structure

```
forRealBank/
├── documentation/
│   ├──clusterInstallation.md
│   ├──schéma_archi.png
│   ├──tests_cluster.docx
├── apps/
│   ├── api-nest/              # NestJS REST API
│   │   ├── src/
│   │   │   ├── interface/      # Module controllers
│   │   │   ├── metrics/        # Prometheus integration
│   │   │   └── config/         # Configuration
│   │   ├── test/               # E2E tests
│   │   └── Dockerfile
│   │
│   └── web-next/              # Next.js frontend
│       ├── src/
│       │   ├── app/            # Next.js pages & layouts
│       │   ├── components/     # Reusable React components
│       │   ├── features/       # Feature-specific logic
│       │   ├── hooks/          # Custom React hooks
│       │   ├── i18n/           # Internationalization
│       │   └── lib/            # Utilities & helpers
│       ├── e2e/                # Playwright tests
│       └── Dockerfile
│
├── packages/
│   ├── domain/                 # Shared domain models
│   │   └── src/
│   │       ├── accounts/       # Account entities
│   │       ├── brokerage/      # Trading models
│   │       ├── chat/
│   │       ├── feed/
│   │       ├── notifications/
│   │       ├── transactions/
│   │       └── user/
│   │
│   ├── application/            # Business logic layer
│   │   └── src/
│   │       ├── chat/
│   │       ├── feed/
│   │       ├── notifications/
│   │       ├── transactions/
│   │       └── user/
│   │
│   └── infrastructure/         # Technical implementations
│       ├── crypto-bcrypt/      # Password hashing
│       ├── jwt-nest/           # JWT authentication
│       ├── mongodb/            # (Optional) MongoDB adapter
│       ├── typeorm/            # Database ORM
│       └── uuid-node/          # UUID generation
│
├── db/
│   └── init/
│       └── 00-init.sql        # Database schema & initial data
│
├── monitoring/                # Prometheus & Grafana config
│   ├── prometheus.yml
│   └── grafana-datasources.yml
│
├── docker-compose.yml         # Development environment
├── docker-compose.override.yml # Local development overrides
├── docker-stack.*.yml         # Production Docker Swarm configs
└── .github/workflows/
    └── ci.yml                 # GitHub Actions CI/CD pipeline
```

## Getting Started

### Prerequisites

- **Node.js**: v22.13.0 or higher
- **pnpm**: v10.18.0+ (`npm install -g pnpm`)
- **Docker & Docker Compose**: For containerized database
- **Git**: Version control

### Installation

```bash
# Clone the repository
git clone https://github.com/Wixkun/forRealBank.git
cd forRealBank

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env  # (create if needed)

# Initialize database
docker compose up -d

# Build shared packages
pnpm bootstrap
```

## Development

### Running the Application

```bash
# Run API and Web in parallel (locally, no Docker)
pnpm dev:local

# With file watching and hot reload
pnpm dev:local:poll

# Run everything with Docker
docker compose up --build

# Run specific app
pnpm --filter api-nest dev
pnpm --filter web-next dev
```

### Available Scripts

```bash
# Development
pnpm dev              # Run all apps in parallel
pnpm dev:local        # Run API + Web (host mode, no containers)
pnpm dev:local:poll   # With polling for file changes

# Building
pnpm build            # Build all packages and apps
pnpm bootstrap        # Install + build all dependencies

# Code Quality
pnpm lint             # Run ESLint across monorepo
pnpm format           # Format code with Prettier

# Testing
pnpm test             # Run all tests (unit + e2e)
pnpm --filter api-nest test:unit    # Unit tests only
pnpm --filter api-nest test:e2e     # API E2E tests
pnpm --filter web-next test         # Web tests
```

### API Structure

The API follows a modular architecture:

```
/api/accounts        → Account management
/api/auth            → Authentication endpoints
/api/users           → User management
/api/chat            → Real-time chat (WebSocket)
/api/feed            → Activity feeds
/api/market          → Market data & quotes
/api/trading         → Trading operations
/api/transactions    → Transaction history & records
/api/notifications   → Push notifications
/api/metrics         → Prometheus metrics
```

### Frontend Routes

- `/` — Dashboard
- `/auth/login` → Login & Registration
- `/auth/2fa` → Two-factor authentication
- `/accounts` → Account management
- `/transactions` → Transaction history
- `/market` → Market data & charts
- `/trading` → Trading interface
- `/chat` → Messaging
- `/notifications` → Notification center

## Docker Setup

### Quick Start

```bash
# Development environment (with hot reload)
pnpm db:up

# Production environment (with all services)
docker compose up --build

# Custom environment
docker compose -f docker-compose.dev.yml up --build
```

### Services

The Docker Compose stack includes:

| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL | 5432 | Primary database |
| PgAdmin | 8080 | Database management UI |
| API (NestJS) | 3001 | REST API backend |
| Web (Next.js) | 3000 | Frontend application |
| Prometheus | 9090 | Metrics collection |
| Grafana | 3002 | Dashboards & visualization |

### Stopping Services

```bash
# Stop all services (keep volumes)
docker compose stop

# Stop and remove containers (remove volumes)
docker compose down -v
```

## Testing

### Unit Tests

```bash
# API unit tests
pnpm --filter api-nest test:unit

# Web tests
pnpm --filter web-next test
```

### Integration Tests

The CI pipeline runs integration tests using docker-compose to verify:
- Database connectivity
- API responsiveness
- Service communication

```bash
# Run locally
docker compose up -d
pnpm test
```

### E2E Tests (Playwright)

```bash
# API E2E tests
pnpm --filter api-nest test:e2e

# Web E2E tests (Playwright)
pnpm --filter web-next test:e2e

# Run with UI
pnpm --filter web-next test -- --ui
```

## API Documentation

### Authentication Flow

1. **Register** → `POST /api/auth/register`
2. **Login** → `POST /api/auth/login` (returns JWT token)
3. **Include token** → `Authorization: Bearer <token>`

Example request:
```bash
curl -H "Authorization: Bearer ${TOKEN}" \
  http://localhost:3001/api/users/me
```

### Health Check

```bash
curl http://localhost:3001/health
# → { "status": "ok" }
```

### Metrics

```bash
# Prometheus metrics (used by monitoring stack)
curl http://localhost:3001/metrics
```

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`):

1. **Lint & Test** — ESLint, Prettier, unit tests
2. **Security** — Trivy vulnerability scanning
3. **Build Images** — Docker images for API & Web
4. **Integration Tests** — docker-compose health checks
5. **E2E Tests** — Playwright browser tests
6. **Push to Registry** — GHCR (main branch only)

See [CI/CD Documentation](https://github.com/Wixkun/forRealBank/wiki/CI-CD) for details.

## Monitoring

### Prometheus

- Metrics endpoint: `http://localhost:3001/metrics`
- Scrape interval: 30 seconds
- Retention: 7 days

### Grafana

- UI: `http://localhost:3002`
- Pre-configured dashboards for API metrics

## License

This project is proprietary software. All rights reserved © 2024-2026.

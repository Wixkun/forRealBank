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
/api/auth            → Authentication (register, login, 2FA, reset password)
/api/users           → Profile & user administration
/api/management      → Users management (directory, accounts, ban requests)
/api/accounts        → Account summary
/api/beneficiaries   → Transfer beneficiaries
/api/transactions    → Transactions & transfers
/api/trading         → Trading operations (UI en refonte)
/api/chat            → Messaging (REST + WebSocket /api/socket.io)
/api/news            → News feed (REST + SSE /api/news/stream)
/api/notifications   → Notification center
/api/metrics         → Prometheus metrics
```

### Frontend Routes

All pages are locale-prefixed (`/en/...`, `/fr/...`):

- `/` → Landing page
- `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email` → Auth flows
- `/dashboard` → Accounts overview & news feed
- `/dashboard/transfer` → Transfers & beneficiaries
- `/dashboard/messages` → Messaging
- `/dashboard/users` → Users management (staff roles)
- `/dashboard/settings`, `/dashboard/security` → Profile & 2FA
- `/dashboard/trading`, `/dashboard/analytics` → Coming soon
- `/banned` → Banned account notice

## Docker Setup

### Quick Start

```bash
# Development environment (with hot reload)
pnpm db:up

# Full stack (db, api, web, monitoring)
docker compose up --build
```

### Services

The Docker Compose stack includes:

| Service       | Port | Purpose                    |
| ------------- | ---- | -------------------------- |
| PostgreSQL    | 5432 | Primary database           |
| PgAdmin       | 8080 | Database management UI     |
| API (NestJS)  | 3001 | REST API backend           |
| Web (Next.js) | 3000 | Frontend application       |
| Prometheus    | 9090 | Metrics collection         |
| Grafana       | 3002 | Dashboards & visualization |

### Stopping Services

```bash
# Stop all services (keep volumes)
docker compose stop

# Stop and remove containers (remove volumes)
docker compose down -v
```

## Production Swarm

The production target is a 5-node Docker Swarm:

| Role    | Count | Purpose                                           |
| ------- | ----- | ------------------------------------------------- |
| Manager | 3     | Swarm quorum and stateful single-replica services |
| Worker  | 2     | Stateless API and web replicas                    |

Before deploying the stacks, label the manager that owns the local persistent volumes:

```bash
docker node update --label-add storage=db vps-07331c93-vps-ovh-net
docker node update --label-add ingress=traefik vps-07331c93-vps-ovh-net
docker node update --label-add monitoring=true vps-07331c93-vps-ovh-net
```

These labels intentionally pin local-volume services:

| Label             | Services                                                                 | Local volumes                                                                           |
| ----------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `storage=db`      | `forrealbank_db`, `forrealbank_db_backup`                                | `forrealbank_dbdata`, `forrealbank_db_backups`                                          |
| `ingress=traefik` | `proxy_traefik`                                                          | `proxy_traefik_letsencrypt`                                                             |
| `monitoring=true` | `monitoring_prometheus`, `monitoring_alertmanager`, `monitoring_grafana` | `monitoring_prometheus_data`, `monitoring_alertmanager_data`, `monitoring_grafana_data` |

API and web images are deployed with immutable Git SHA tags. The CI pipeline pushes:

```text
ghcr.io/wixkun/forrealbank/api:<git-sha>
ghcr.io/wixkun/forrealbank/web:<git-sha>
```

Third-party runtime images are pinned to version tags instead of `latest`:

```text
prom/prometheus:v2.55.1
grafana/grafana:11.5.2
```

The deploy job exports `IMAGE_TAG=${{ github.sha }}` before running `deploy.sh`. For a manual deploy, set it explicitly:

```bash
export IMAGE_TAG="$(git rev-parse HEAD)"
bash deploy.sh
```

The API is constrained to workers with `max_replicas_per_node: 1`, so the two replicas run as `1 + 1` across the two workers. The web service has three replicas on two workers, so a normal placement is `2 + 1`.

### PostgreSQL Backups

The `forrealbank_db_backup` service runs next to PostgreSQL on the `storage=db` node. It writes custom-format `pg_dump` files to the local Docker volume `forrealbank_db_backups`.

Defaults:

| Variable                  | Default | Meaning                               |
| ------------------------- | ------- | ------------------------------------- |
| `BACKUP_INTERVAL_SECONDS` | `86400` | Run one backup every 24 hours         |
| `BACKUP_RETENTION_DAYS`   | `7`     | Delete backup files older than 7 days |

List backups from the DB storage node:

```bash
docker run --rm -v forrealbank_db_backups:/backups alpine ls -lh /backups
```

Test a restore without touching production data:

```bash
docker run --rm \
  -v forrealbank_db_backups:/backups \
  -v forrealbank_db_restore_test:/var/lib/postgresql/data \
  -e POSTGRES_PASSWORD=restore-test \
  -d --name frb-restore-test postgres:16

docker exec frb-restore-test sh -c 'until pg_isready -U postgres; do sleep 1; done'

docker exec -i frb-restore-test pg_restore \
  -U postgres \
  -d postgres \
  --clean \
  --if-exists \
  /backups/<backup-file>.dump

docker rm -f frb-restore-test
docker volume rm forrealbank_db_restore_test
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

GitHub Actions workflow (`.github/workflows/ci.yml`) is designed as a blocking
pipeline for pull requests and production deployments:

1. **Quality Gates** — install dependencies, check Prettier formatting, lint, run TypeScript checks, run unit tests, and build the monorepo.
2. **Security Scan** — Trivy filesystem scan, SARIF upload, and blocking on critical vulnerabilities.
3. **Docker Build** — build API and web images without pushing.
4. **Integration Tests** — start `db`, `api`, and `web` with Docker Compose, then verify health, metrics, register, and login flows.
5. **Optional E2E Tests** — run Playwright against the Docker Compose stack, publish artifacts, and report failures without blocking production while the UI is still being stabilized.
6. **Push Images** — push immutable Git SHA image tags to GHCR, only on `main`.
7. **Deploy Production** — SSH deploy to the Swarm, only after every required job succeeds on `main`.

PRs should require these GitHub checks before merge:

```text
Quality Gates
Security Scan
Docker Build
Integration Tests
```

Production deploys use repository secrets only for deployment and registry access:

```text
VPS_HOST
VPS_PORT
VPS_USER
VPS_SSH_KEY
GHCR_USERNAME
GHCR_PASSWORD
```

CI test environment variables are non-secret and are defined in the workflow itself.

See [CI/CD Documentation](https://github.com/Wixkun/forRealBank/wiki/CI-CD) for details.

## Git Hooks

Git hooks are versioned in `.githooks/` and installed by:

```bash
pnpm prepare
```

Hook behavior:

| Hook         | Checks                                             |
| ------------ | -------------------------------------------------- |
| `pre-commit` | `pnpm format:check`, `pnpm lint`, `pnpm typecheck` |
| `pre-push`   | `pnpm ci:verify`                                   |

Useful local commands:

```bash
pnpm format
pnpm format:check
pnpm lint
pnpm lint:fix
pnpm typecheck
pnpm test:unit
pnpm test:e2e
pnpm ci:verify
```

## Monitoring

### Prometheus

- Metrics endpoint: `http://localhost:3001/metrics`
- Scrape interval: 30 seconds
- Retention: 7 days

### Grafana

- UI: `http://localhost:3002`
- Pre-configured dashboards for API metrics

### Swarm Observability

The production monitoring stack includes:

| Component     | Purpose                                                                   |
| ------------- | ------------------------------------------------------------------------- |
| Prometheus    | Scrapes API, host, container, and alert metrics                           |
| Grafana       | Dashboards for API, infrastructure, containers, and firing alerts         |
| Alertmanager  | Receives Prometheus alerts; default receiver is intentionally local/no-op |
| node-exporter | Host CPU, memory, disk, and filesystem metrics on every node              |
| cAdvisor      | Container CPU and memory metrics on every node                            |

Prometheus alert rules are defined in `monitoring/prometheus-rules.yml`.

Current base alerts:

| Alert                       | Signal                                  |
| --------------------------- | --------------------------------------- |
| `ForRealBankApiDown`        | API metrics endpoint is unavailable     |
| `MonitoringTargetDown`      | Any Prometheus target is down           |
| `HighHttp5xxRate`           | API 5xx rate is above 5%                |
| `HighHttpLatencyP95`        | API P95 latency is above 1s             |
| `ApplicationErrorsDetected` | Application error counter is increasing |
| `HostHighCpuUsage`          | Host CPU usage is above 85%             |
| `HostHighMemoryUsage`       | Host memory usage is above 85%          |
| `HostDiskSpaceLow`          | Host filesystem usage is above 85%      |
| `ContainerHighCpuUsage`     | Container CPU usage is high             |
| `ContainerHighMemoryUsage`  | Container memory usage is high          |

After deploying, check targets in Prometheus:

```bash
docker service ls
docker service ps monitoring_node_exporter
docker service ps monitoring_cadvisor
docker service ps monitoring_alertmanager
```

Grafana provisions two dashboards from files:

```text
ForRealBank API Monitoring
ForRealBank Infrastructure & Alerts
```

## License

This project is proprietary software. All rights reserved © 2024-2026.

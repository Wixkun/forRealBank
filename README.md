# ForRealBank 🏦

## CI/CD Status

[![CI Pipeline](https://github.com/Wixkun/forRealBank/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Wixkun/forRealBank/actions/workflows/ci.yml)

## Architecture

### Applications
- **API (NestJS)** - Backend API à `apps/api-nest/`
- **Web (Next.js)** - Frontend web à `apps/web-next/`

### Packages Partagés
- **@forreal/domain** - Entités métier et interfaces
- **@forreal/application** - Logique applicative
- **@forreal/infrastructure-*** - Implémentations techniques (JWT, crypto, DB, etc.)

## Prérequis

- Node.js 20+
- pnpm 10+
- Docker & Docker Compose (pour environnement complet)

## Installation

```bash
# Installer les dépendances
pnpm install

# Setup de la base de données (Docker)
pnpm db:up

# Charger le schéma initial
cat db/init/00-init.sql | docker exec -i forrealbank-db psql -U forreal -d forrealbank
```

## Développement

### Local avec API + DB en Docker

```bash
# Terminal 1: Démarrer la DB
pnpm db:up

# Terminal 2: Démarrer l'API
pnpm --filter api-nest dev

# Terminal 3: Démarrer le Web
pnpm --filter web-next dev
```

Accès:
- Web: http://localhost:3000
- API: http://localhost:3001/api
- PgAdmin: http://localhost:8080

### Full Docker

```bash
pnpm docker:dev
```

## Tests

```bash
# Tests unitaires API
pnpm --filter api-nest test

# Tests Web
pnpm --filter web-next test

# e2e tests (Playwright)
pnpm --filter web-next test:e2e

# e2e tests avec UI interactive
pnpm --filter web-next test:e2e:ui

# e2e tests en debug mode
pnpm --filter web-next test:e2e:debug

# Tous les tests
pnpm test
```

### Coverage Thresholds (Quality Gates)

La CI valide les seuils de couverture:
- **API (api-nest)**: minimum 75%
- **Web (web-next)**: minimum 60%

Si un test échoue, la CI échoue et la PR ne peut pas être mergée.

## Build

```bash
# Builder tout le monorepo
pnpm build

# Ou en Docker
docker compose build
```

## Linting & Formatting

```bash
# Lint sur tout le projet
pnpm lint

# Vérifier le formatage
pnpm exec prettier --check .

# Formater automatiquement
pnpm exec prettier --write .
```

## CI/CD Pipeline

La pipeline CI/CD s'exécute sur chaque push et PR:

1. **Lint & Tests** - Linting + tests unitaires avec coverage
   - Upload coverage vers Codecov
   - Validation des seuils (API: 75%, Web: 60%)
2. **Security Scan** - Scan Trivy avec rapport SARIF + VEX
3. **Build Images** - Build des images Docker API et Web
4. **Integration Tests** - Tests d'intégration avec docker-compose
5. **E2E Tests** - Tests end-to-end avec Playwright
   - Multi-browser testing (Chrome, Firefox, Safari)
   - Mobile testing (iPhone 12)
   - Screenshots & videos on failure
6. **Push GHCR** - Push vers GitHub Container Registry (main branch only)

### Artefacts disponibles

Après chaque run CI, consultez l'onglet "Artifacts" pour:
- `test-reports/` - Coverage reports (API + Web)
- `security-reports/` - Trivy SARIF, JSON et VEX files
- `playwright-report/` - E2E test report (HTML)
- `playwright-videos/` - Videos only on failure

### Quality Gates

Les critères suivants doivent être validés:
- ✅ Code linting (ESLint)
- ✅ Format code (Prettier)
- ✅ Unit tests
- ✅ Code coverage (thresholds)
- ✅ Security scan (Trivy)
- ✅ Docker build success
- ✅ Integration tests
- ✅ E2E tests (Playwright)

### Tester la CI avec un intentional break (validation)

Pour vérifier que la pipeline détecte bien les erreurs:

```bash
# 1. Créer une branche de test
git checkout -b test/ci-validation

# 2. Intentionally break un test
# Éditer: apps/api-nest/test/app.e2e-spec.ts
# Remplacer: .expect('Hello World!')
# Par:       .expect('Wrong Output!')

# 3. Committer et pusher
git add .
git commit -m "test: intentionally break e2e test to validate CI"
git push origin test/ci-validation

# 4. Ouvrir une PR et vérifier que la CI échoue ✅
# → La pipeline doit fail au stage "Lint & Test"

# 5. Fixer le test (remettre 'Hello World!')
git add .
git commit -m "test: fix e2e test"
git push

# 6. Vérifier que la CI passe maintenant ✅
# → La pipeline doit réussir jusqu'à "Integration Tests"
```

### Consulter les rapports

- **Test Reports**: GitHub Actions > Artifacts > test-reports
- **Security Reports**: GitHub Actions > Artifacts > security-reports
- **CI Badge**: Affichable sur le README

## 🧪 E2E Testing & Code Quality

### E2E Testing with Playwright

```bash
# Installer les browsers Playwright
pnpm --filter web-next exec playwright install

# Lancer les tests avec UI interactive
pnpm --filter web-next test:e2e:ui

# Ou lancer localement (serveur dev auto-start)
pnpm --filter web-next dev
# -> puis dans un autre terminal:
pnpm --filter web-next test:e2e

# Debug mode
pnpm --filter web-next test:e2e:debug
```

Les tests se trouvent dans `apps/web-next/e2e/` et incluent:
- Multi-browser testing (Chrome, Firefox, Safari)
- Mobile testing (iPhone 12)
- Screenshots & videos on failure
- Responsive design validation

## Contribuer

1. Créer une branche feature: `git checkout -b feature/ma-feature`
2. Committer: `git commit -m "feat: description"`
3. Pusher: `git push origin feature/ma-feature`
4. Ouvrir une PR - la CI s'exécutera automatiquement

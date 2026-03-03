# Docker (dev vs prod)

## Objectif
- **Dev**: Front + back en local, DB en Docker
- **Prod**: tout en Docker

## Pré-requis (dev)
- Copier `env/api.dev.env.example` vers `env/api.dev.env` et ajuster les valeurs (au minimum `JWT_SECRET`).

## Dev (DB Docker, apps locales)

### Option recommandée: 1 commande (API + WEB en local)
```powershell
cd C:\Users\matth\Desktop\forRealBank
pnpm dev:local
```

### Si hot reload instable/lent sur Windows: polling
```powershell
cd C:\Users\matth\Desktop\forRealBank
pnpm dev:local:poll
```

### Si turbopack pose problème: repasser en webpack
```powershell
cd C:\Users\matth\Desktop\forRealBank
pnpm dev:local:poll:webpack
```

### 1) DB + pgAdmin
```powershell
cd C:\Users\matth\Desktop\forRealBank
docker compose -f docker-compose.dev.yml up -d
```

### 2) API Nest en local (charge `env/api.dev.env` via ConfigModule)
```powershell
cd C:\Users\matth\Desktop\forRealBank
pnpm --filter api-nest dev
```

### 3) Next en local
```powershell
cd C:\Users\matth\Desktop\forRealBank
pnpm --filter web-next dev
```

## Prod (tout docker)
```powershell
cd C:\Users\matth\Desktop\forRealBank
docker compose up --build
```

## Notes
- L'API lit d'abord `env/api.dev.env`, puis fallback sur `env/api.env`.
- En dev, `DATABASE_URL` pointe sur `localhost:5432` car Postgres est exposé par Docker.
- En docker, `DATABASE_URL` pointe sur `db:5432`.

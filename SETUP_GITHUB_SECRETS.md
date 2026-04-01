# Setup GitHub Secrets Manually

## Step 1: Go to Repository Settings
1. Sur GitHub, ouvre ton repo
2. Click **Settings** (top right)
3. Left sidebar → **Secrets and variables** → **Actions**

## Step 2: Add Each Secret

Click **New repository secret** et ajoute ces 7 secrets:

| Name | Value |
|------|-------|
| `POSTGRES_USER` | `forreal` |
| `POSTGRES_PASSWORD` | `forreal` |
| `POSTGRES_DB` | `forrealbank` |
| `PGADMIN_EMAIL` | `admin@local.dev` |
| `PGADMIN_PASSWORD` | `adminadmin` |
| `DATABASE_URL` | `postgresql://forreal:forreal@db:5432/forrealbank` |
| `JWT_SECRET` | '9be62396c26310605e25358c7f359380f1c97e09b7b6908c7c28454456e52c00'

### Example for JWT_SECRET:
```bash
# Génère une clé forte
openssl rand -hex 32
# Output: a3f7c9e2d1b8f4a6e9c2d5f8a1b4e7c9d2e5f8a1b4e7c9d2e5f8a1b4e7c9d
```

## Step 3: Verify
Après avoir créé tous les secrets, tu devrais voir 7 items listés sous "Actions secrets".

## Step 4: CI Uses Them
La CI va automatiquement charger ces secrets et créer le `.env` avant de lancer docker-compose.

---

## Production Notes
- Ces secrets sont **chiffrés** par GitHub
- Non visibles dans les logs CI
- Non pushés en git
- Toujours disponibles à la CI pour création du `.env`

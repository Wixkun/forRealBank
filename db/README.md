# Gestion du schéma de base de données

Une **seule** stratégie fait autorité, pour éviter que `00-init.sql` et les
migrations divergent.

## Deux artefacts, un rôle chacun

| Fichier               | Rôle                                                  | Quand                                                                                                     |
| --------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `db/init/00-init.sql` | Schéma **canonique** complet + seeds de démo          | Base **neuve** uniquement (`docker-entrypoint-initdb.d`, exécuté au premier démarrage du volume Postgres) |
| `db/migrations/*.sql` | **Deltas** ordonnés (par nom de fichier), idempotents | Bases **existantes**, via le runner (`scripts/run-db-migrations.mjs`)                                     |

## Règle de contribution

Toute évolution de schéma doit être ajoutée **aux deux endroits** :

1. dans `00-init.sql` (pour que les nouvelles installations soient correctes) ;
2. dans un **nouveau** fichier `db/migrations/AAAAMMJJ_description.sql` (pour que
   les bases déjà déployées convergent).

Les deux emplois utilisent `CREATE TABLE IF NOT EXISTS` /
`ADD COLUMN IF NOT EXISTS`, donc ils restent cohérents par construction : le
snapshot (`init`) et la somme des deltas (`migrations`) décrivent le même schéma.

## Runner

```bash
DATABASE_URL=postgres://user:pass@host:5432/db node scripts/run-db-migrations.mjs
```

Le runner crée `schema_migrations`, applique les migrations non encore
enregistrées dans l'ordre alphabétique, chacune dans sa propre transaction, et
trace celles qui ont réussi. Il est idempotent : le relancer ne réapplique rien.

À appeler au déploiement **avant** de (re)démarrer l'API (cf. `deploy.sh`).

## Transition

Les services de compatibilité au démarrage de l'API
(`AuthSchemaBootstrapService`, `TransfersSchemaBootstrapService`,
`ChatFilesService.onModuleInit`) réalisaient historiquement ces patchs de
schéma au boot. Ils restent sûrs (idempotents) mais ont vocation à être retirés
une fois le runner adopté dans le pipeline de déploiement, afin de n'avoir
qu'un seul mécanisme.

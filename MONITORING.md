# Monitoring - Prometheus & Grafana

## Accès

### Prometheus
- **URL**: http://localhost:9090
- Explore les métriques brutes de l'API

### Grafana
- **URL**: http://localhost:3002
- **User**: admin
- **Password**: admin

### Métriques API
- **URL**: http://localhost:3001/api/metrics
- Endpoint brut Prometheus (format texte)

## Setup initial

L'API expose automatiquement les métriques Prometheus via l'endpoint `/api/metrics`.

Prometheus effectue un scrape toutes les 15s (configurable dans `monitoring/prometheus.yml`).

## Ajouter des dashboards Grafana

1. Accéder à http://localhost:3002
2. Menu > Dashboards > Create Dashboard
3. Ajouter des panneaux avec des requêtes PromQL simples

### Exemples de requêtes PromQL

```
# Taux de requêtes par seconde
rate(http_requests_total[1m])

# Nombre de requêtes HTTP par code statut
http_requests_total

# Latence 95e percentile
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

## Configuration

- **Prometheus Config**: `monitoring/prometheus.yml`
- **Grafana Datasources**: `monitoring/grafana-datasources.yml`
- **Docker Compose**: Voir `docker-compose.yml` (services `prometheus` et `grafana`)

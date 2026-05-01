#!/usr/bin/env bash
set -euo pipefail

cd /opt/forrealbank

echo "Pull latest code..."
git pull origin main
source .env

echo "Login to GHCR..."
echo "${GHCR_PASSWORD}" | docker login ghcr.io -u "${GHCR_USERNAME}" --password-stdin

echo "Ensure shared overlay network exists..."
docker network inspect public >/dev/null 2>&1 || docker network create --driver overlay --attachable public

echo "Deploy app stack..."
docker stack deploy -c docker-stack.app.yml forrealbank

echo "Deploy proxy stack..."
docker stack deploy -c docker-stack.proxy.yml proxy

echo "Deploy monitoring stack..."
docker stack deploy -c docker-stack.monitoring.yml monitoring

echo "Current services:"
docker service ls
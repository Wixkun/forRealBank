#!/usr/bin/env bash
set -euo pipefail

cd /opt/forrealbank

echo "Pull latest code..."
git pull origin main
DEPLOY_IMAGE_TAG="${IMAGE_TAG:-}"
set -a
source .env
set +a
export IMAGE_TAG="${DEPLOY_IMAGE_TAG:-${IMAGE_TAG:-$(git rev-parse HEAD)}}"

echo "Login to GHCR..."
echo "${GHCR_PASSWORD}" | docker login ghcr.io -u "${GHCR_USERNAME}" --password-stdin

echo "Ensure shared overlay network exists..."
docker network inspect public >/dev/null 2>&1 || docker network create --driver overlay --attachable public

echo "Deploy app stack..."
docker stack deploy --with-registry-auth -c docker-stack.app.yml forrealbank

echo "Deploy proxy stack..."
docker stack deploy --with-registry-auth -c docker-stack.proxy.yml proxy

echo "Deploy monitoring stack..."
docker stack deploy --with-registry-auth -c docker-stack.monitoring.yml monitoring

echo "Current services:"
docker service ls
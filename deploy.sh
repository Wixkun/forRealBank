#!/bin/bash

set -e

echo "Démarrage du déploiement..."
echo "Répertoire: $(pwd)"

PROJECT_DIR="/opt/forRealBank"  
REGISTRY="ghcr.io"

cd "$PROJECT_DIR" || { echo "Répertoire $PROJECT_DIR introuvable"; exit 1; }

echo "Mise à jour du code depuis GitHub..."
git pull

echo "Connexion au registre Docker..."
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin "$REGISTRY"

echo "⬇Récupération des dernières images..."
docker compose pull

echo "Redémarrage des services..."
docker compose up -d --no-build

echo "Attente que les services soient prêts..."
sleep 10

echo "Vérification de la santé..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health || echo "000")
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")

if [ "$API_STATUS" = "200" ] && [ "$WEB_STATUS" != "000" ]; then
  echo "Déploiement réussi!"
  echo "  API health: $API_STATUS"
  echo "  Web status: $WEB_STATUS"
  exit 0
else
  echo "Déploiement échoué!"
  echo "  API health: $API_STATUS"
  echo "  Web status: $WEB_STATUS"
  docker compose logs api
  exit 1
fi

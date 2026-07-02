#!/bin/bash
#
# Windows users: use PowerShell instead →  ./deploy.ps1
# This script is for Mac/Linux (or if bash + kubectl already work on your machine).
#
set -e

echo "1. Checking Kubernetes is running..."
if ! kubectl cluster-info >/dev/null 2>&1; then
  echo "Kubernetes is not running."
  echo "On Windows, run this in PowerShell:  ./deploy.ps1"
  echo "On Mac/Linux, start minikube first:  minikube start"
  exit 1
fi

echo "2. Building Docker images..."
docker build -t careroute-backend:latest -f backend/Dockerfile .
docker build -t careroute-frontend:latest ./frontend

echo "3. Deploying to Kubernetes..."
kubectl apply -f k8s/

echo "4. Waiting for app to start..."
kubectl rollout status deployment/careroute-backend
kubectl rollout status deployment/careroute-frontend

echo "5. Done! Your pods:"
kubectl get pods

echo ""
echo "Open the app:"
echo "  minikube service careroute-frontend-svc --url"

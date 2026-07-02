# Run this in PowerShell from the project folder:
#   ./deploy.ps1

$ErrorActionPreference = "Stop"

Write-Host "1. Checking Kubernetes is running..."
kubectl cluster-info
if ($LASTEXITCODE -ne 0) {
  Write-Host "Kubernetes is not running. Start it first:"
  Write-Host "  minikube start --driver=docker"
  exit 1
}

Write-Host "2. Building Docker images..."
docker build -t careroute-backend:latest -f backend/Dockerfile .
docker build -t careroute-frontend:latest ./frontend

Write-Host "3. Deploying to Kubernetes..."
kubectl apply -f k8s/

Write-Host "4. Waiting for app to start..."
kubectl rollout status deployment/careroute-backend
kubectl rollout status deployment/careroute-frontend

Write-Host "5. Done! Your pods:"
kubectl get pods

Write-Host ""
Write-Host "Open the app:"
Write-Host "  minikube service careroute-frontend-svc --url"

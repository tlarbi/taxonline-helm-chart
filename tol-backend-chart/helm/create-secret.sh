#!/bin/bash
# ─── Create TaxOnline Dashboard K8s Secret ────────────────────────────────────
# Run this ONCE before helm install. Values come from your existing K8s infra.
# DO NOT commit this file with real values.

NAMESPACE="taxonline-dashboard"

kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic taxonline-dashboard-secrets \
  --namespace="$NAMESPACE" \
  --from-literal=SECRET_KEY="$(openssl rand -hex 32)" \
  --from-literal=DATABASE_URL="postgresql+asyncpg://taxonline:PASSWORD@postgres-service:5432/taxonline" \
  --from-literal=REDIS_URL="redis://redis-service:6379/0" \
  --from-literal=S3_ENDPOINT="http://minio-service:9000" \
  --from-literal=S3_BUCKET="taxonline-documents" \
  --from-literal=S3_ACCESS_KEY="your-minio-access-key" \
  --from-literal=S3_SECRET_KEY="your-minio-secret-key" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "✓ Secret created in namespace: $NAMESPACE"

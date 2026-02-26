# TaxOnline Dashboard — Secrets Setup
#
# Create this secret BEFORE deploying the Helm chart.
# Never put actual secret values in values.yaml or version control.
#
# Usage:
#   kubectl create secret generic taxonline-dashboard-secrets \
#     --namespace taxonline-dashboard \
#     --from-literal=SECRET_KEY='<generate: openssl rand -hex 32>' \
#     --from-literal=DATABASE_URL='postgresql+asyncpg://taxonline:<password>@postgres:5432/taxonline' \
#     --from-literal=REDIS_URL='redis://redis:6379/0' \
#     --from-literal=S3_ENDPOINT='http://minio:9000' \
#     --from-literal=S3_BUCKET='taxonline-documents' \
#     --from-literal=S3_ACCESS_KEY='<minio-access-key>' \
#     --from-literal=S3_SECRET_KEY='<minio-secret-key>'
#
# Or using a sealed secret / Vault injection (recommended for production).
#
# Required keys:
#   SECRET_KEY          — JWT signing key (random 32-byte hex)
#   DATABASE_URL        — PostgreSQL asyncpg connection string
#   REDIS_URL           — Redis connection string
#   S3_ENDPOINT         — MinIO/S3 endpoint URL
#   S3_BUCKET           — S3 bucket name
#   S3_ACCESS_KEY       — S3 access key
#   S3_SECRET_KEY       — S3 secret key

# ── Example with Vault Agent (if you have Vault deployed) ─────────────────────
#
# Add to backend deployment annotations:
#   vault.hashicorp.com/agent-inject: "true"
#   vault.hashicorp.com/role: "taxonline-dashboard"
#   vault.hashicorp.com/agent-inject-secret-config: "secret/taxonline/dashboard"

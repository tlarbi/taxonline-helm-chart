# This file is a TEMPLATE ONLY.
# DO NOT store real secrets here.
# 
# Option 1 - Create manually:
#   kubectl create secret generic taxonline-dashboard-secrets \
#     --namespace taxonline-dashboard \
#     --from-literal=SECRET_KEY='<jwt-secret>' \
#     --from-literal=DATABASE_URL='postgresql+asyncpg://user:pass@postgres:5432/taxonline' \
#     --from-literal=REDIS_URL='redis://redis:6379/0' \
#     --from-literal=S3_ACCESS_KEY='<minio-access-key>' \
#     --from-literal=S3_SECRET_KEY='<minio-secret-key>' \
#     --from-literal=S3_ENDPOINT='http://minio:9000' \
#     --from-literal=S3_BUCKET='taxonline-documents'
#
# Option 2 - Use Sealed Secrets or Vault Agent Injector.
#
# The secret name must match .Values.backend.secretName in values.yaml

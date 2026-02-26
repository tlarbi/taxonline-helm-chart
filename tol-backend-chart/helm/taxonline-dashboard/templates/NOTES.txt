# TaxOnline Dashboard

Admin dashboard for the TaxOnline RAG system — upload, index, monitor, test, and analyze tax law documents.

## Architecture

```
Frontend (React)  ←→  Ingress  ←→  Backend (FastAPI)
                                        ↓
                               Qdrant · PostgreSQL · OpenSearch · Ollama
```

**Decoupled by design**: Frontend and Backend are independent deployments. The Ingress routes `/api/*` and `/ws/*` to the backend, everything else to the frontend. You can swap the backend for an API Gateway or move the frontend to a CDN without touching the Helm chart logic.

## Modules

| # | Module | Route |
|---|--------|-------|
| 1 | Upload & Indexation | `/upload` |
| 2 | Monitoring | `/monitoring` |
| 3 | Testing | `/testing` |
| 4 | Analytics | `/analytics` |
| 5 | Chunk Management | `/management` |

## Roles

| Role | Permissions |
|------|-------------|
| `admin` | All operations + user management |
| `editor` | Upload, edit chunks, manage test cases |
| `viewer` | Read-only access to all modules |

## Deployment

### Prerequisites
- Kubernetes cluster with Qdrant, PostgreSQL, OpenSearch, Ollama already running
- Helm 3.x

### Quick start

```bash
# 1. Build and push images
docker build -t your-registry/taxonline-dashboard-backend:1.0.0 ./backend
docker build -t your-registry/taxonline-dashboard-frontend:1.0.0 ./frontend
docker push your-registry/taxonline-dashboard-backend:1.0.0
docker push your-registry/taxonline-dashboard-frontend:1.0.0

# 2. Configure values
cp helm/taxonline-dashboard/values.yaml values.production.yaml
# Edit values.production.yaml:
#   - global.imageRegistry
#   - backend.{qdrant,postgresql,openSearch,ollama} hosts
#   - secrets.{jwtSecretKey,postgresPassword,s3AccessKey,s3SecretKey}
#   - ingress.host

# 3. Deploy
helm upgrade --install taxonline ./helm/taxonline-dashboard \
  -f values.production.yaml \
  --namespace taxonline-dashboard \
  --create-namespace

# 4. Create first admin user (one-time)
kubectl exec -it -n taxonline-dashboard deploy/taxonline-backend -- \
  python -c "
import asyncio
from app.core.database import AsyncSessionLocal, init_db
from app.models.user import User, UserRole
from app.core.auth import get_password_hash

async def create_admin():
    await init_db()
    async with AsyncSessionLocal() as db:
        user = User(username='admin', email='admin@taxonline.dz',
                    hashed_password=get_password_hash('CHANGE_ME'),
                    role=UserRole.admin, full_name='Administrator')
        db.add(user)
        await db.commit()
        print('Admin created')
asyncio.run(create_admin())
"
```

### Separate environments

```bash
# Staging - deploy only backend (frontend on CDN)
helm upgrade --install taxonline-staging ./helm/taxonline-dashboard \
  -f values.staging.yaml \
  --set frontend.enabled=false \
  --set ingress.host=staging-dashboard.taxonline.dz

# Production - full stack
helm upgrade --install taxonline-prod ./helm/taxonline-dashboard \
  -f values.production.yaml \
  --namespace taxonline-prod
```

### Migrating backend to API Gateway

The frontend reads its API URL from `window.__TAXONLINE_CONFIG__.apiUrl` (injected via ConfigMap). To point the frontend at an external API Gateway:

```yaml
# values.yaml
frontend:
  config:
    apiUrl: "https://api-gw.taxonline.dz/dashboard"

# Disable backend deployment, keep only frontend
backend:
  enabled: false
ingress:
  annotations:
    # Remove websocket annotation if using API GW
```

## Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env   # fill in your values
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev   # proxies /api to localhost:8000
```

## Pipeline: Bronze → Silver → Gold

1. **Bronze**: PDF text extraction (pypdf)  
2. **Silver**: Chunking (800 words, 100 overlap) + metadata enrichment  
3. **Gold**: Ollama embeddings → Qdrant upsert  

On failure: automatic rollback deletes indexed vectors.  
Real-time progress streamed via WebSocket to the frontend.

## Alertes (seuils par défaut)

| Condition | Seuil |
|-----------|-------|
| Score moyen retrieval | < 0.015 |
| Error rate | > 5% |
| Qdrant health | != ok |

## Roadmap

- [ ] Phase 1: Backend Core + Auth (Semaine 1-2)
- [ ] Phase 2: Frontend Upload + Pipeline WS (Semaine 3)
- [ ] Phase 3: Monitoring (Semaine 4)
- [ ] Phase 4: Testing & Analytics (Semaine 5-6)
- [ ] Phase 5: Management + Polish (Semaine 7-8)

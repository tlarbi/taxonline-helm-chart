REGISTRY ?= harbor.internal.dz/taxonline
TAG ?= 1.0.0
NS ?= taxonline-dashboard
RELEASE ?= taxonline

.PHONY: build push deploy dev-backend dev-frontend

build:
	docker build -t $(REGISTRY)/dashboard-backend:$(TAG) ./backend
	docker build -t $(REGISTRY)/dashboard-frontend:$(TAG) ./frontend

push:
	docker push $(REGISTRY)/dashboard-backend:$(TAG)
	docker push $(REGISTRY)/dashboard-frontend:$(TAG)

deploy:
	helm upgrade --install $(RELEASE) ./helm/taxonline-dashboard \
		-f values.production.yaml \
		--namespace $(NS) \
		--create-namespace \
		--set backend.image.tag=$(TAG) \
		--set frontend.image.tag=$(TAG)

deploy-dry:
	helm upgrade --install $(RELEASE) ./helm/taxonline-dashboard \
		-f values.production.yaml \
		--namespace $(NS) \
		--dry-run --debug

lint:
	helm lint ./helm/taxonline-dashboard

rollback:
	helm rollback $(RELEASE) -n $(NS)

status:
	helm status $(RELEASE) -n $(NS)

dev-backend:
	cd backend && uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

create-admin:
	kubectl exec -it -n $(NS) deploy/$(RELEASE)-backend -- \
		python -c "import asyncio; exec(open('/dev/stdin').read())" < scripts/create_admin.py

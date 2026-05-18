# Coffee Analytics SRE

Endterm implementation for a distributed coffee analytics ordering system. The project follows clean architecture boundaries inside the services and includes the required SRE deliverables: 6+ microservices, Docker Compose/Swarm, Kubernetes manifests, Terraform, Ansible, Prometheus/Grafana monitoring, SLIs/SLOs, incident response, postmortem, automation, capacity planning, and a light coffee-shop operations frontend.

## Services

| Service | Port | Responsibility |
| --- | ---: | --- |
| API Gateway | 8080 | Public backend API, workflow composition, routing |
| Auth Service | 3001 | Login and token simulation |
| Catalog Service | 3002 | Coffee menu and inventory |
| Order Service | 3003 | Claim orders, process orders, list orders |
| Payment Service | 3004 | Payment simulation |
| Notification Service | 3005 | Notification audit log |
| Profile Service | 3006 | Customer coffee preferences |
| Analytics Service | 3007 | Revenue, status, item, and SLO analytics |
| Frontend | 5173 | Coffee-brown light operations dashboard |

## Quick Start

```bash
npm test
npm run start:frontend
docker compose up --build
```

Then call the gateway:

```bash
curl http://localhost:8080/health
curl http://localhost:8080/api/catalog/coffees
curl -X POST http://localhost:8080/api/orders/claim-process \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"u-100\",\"items\":[{\"coffeeId\":\"espresso\",\"quantity\":2}],\"paymentMethod\":\"card\"}"
curl "http://localhost:8080/api/orders?userId=u-100"
curl http://localhost:8080/api/admin/analytics/summary -H "x-admin-key: admin123"
```

Frontend pages:

```bash
npm run start:frontend
```

Open:

- `http://localhost:5173` for the public menu
- `http://localhost:5173/checkout.html` for checkout
- `http://localhost:5173/orders.html` for user order status
- `http://localhost:5173/admin.html` for admin catalog, orders, and analytics

Default admin key for the demo is `admin123`.

## Required Endterm Mapping

- 6+ microservices: gateway, auth, catalog, orders, payments, notifications, profiles, analytics.
- Docker setup: `Dockerfile`, `docker-compose.yml`, and Docker Swarm deploy command support.
- Kubernetes: manifests in `k8s/` with deployments, services, config, and HPA examples.
- Terraform: VM/network-style provisioning templates in `terraform/`.
- Ansible: automated installation and deployment playbook in `ansible/`.
- Monitoring: Prometheus config, alert rules, Grafana dashboard JSON in `monitoring/`.
- SLI/SLO: documented in `docs/sli-slo.md`.
- Incident response: simulated Order Service database/config failure in `docs/incident-response.md` and `docs/postmortem.md`.
- Capacity planning: `docs/capacity-planning.md`.
- Frontend: Corretto-inspired coffee operations dashboard in `frontend/`.

## Architecture

```text
Client / Demo Script
        |
   API Gateway
        |
 +------+------+------+---------+-------------+----------+-----------+
 | Auth | Catalog | Orders | Payments | Notifications | Profiles | Analytics |
 +------+------+------+---------+-------------+----------+-----------+
        |
 PostgreSQL-ready adapters / in-memory demo stores
        |
 Prometheus metrics -> Grafana dashboards
```

Each service exposes:

- `GET /health`
- `GET /metrics`
- domain-specific API routes

## Swarm Deployment

Uses a dedicated `docker-compose.swarm.yml` with overlay networking, placement constraints, update/rollback policies, and healthchecks on every service.

```bash
docker swarm init
docker stack deploy -c docker-compose.swarm.yml coffee
docker stack ps coffee
docker service ls
```

To remove the stack:
```bash
docker stack rm coffee
```

## Kubernetes Deployment

```bash
kubectl apply -f k8s/
```

## Notes

The runtime uses lightweight file-based repositories in `data/` so orders, catalog edits, and analytics events survive local service restarts without external package installation. Docker Compose also includes PostgreSQL and Redis as production-supporting components.

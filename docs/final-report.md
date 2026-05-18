# Coffee Analytics SRE Endterm Report

## Project Title

Full SRE implementation for a distributed Coffee Analytics microservices system with a Corretto-inspired frontend.

## Abstract

This project implements a coffee ordering and analytics platform using a light coffee-shop frontend, independent microservices, clean architecture boundaries, container orchestration, infrastructure automation, monitoring, incident response, and capacity planning. The system allows users to claim coffee orders, process payments, send notifications, list orders, and analyze completed order revenue.

## Implemented Microservices

| Service | Purpose |
| --- | --- |
| API Gateway | Public backend API and workflow orchestration |
| Auth Service | Login and token simulation |
| Catalog Service | Coffee menu, pricing, quote generation |
| Order Service | Claim order, process order, list order history |
| Payment Service | Payment approval/failure simulation |
| Notification Service | Notification delivery audit |
| Profile Service | User profile and coffee preference data |
| Analytics Service | Order, revenue, status, item, and SLO analytics |
| Frontend | Coffee-brown light dashboard for order and analytics workflows |

## Backend Flow

1. Client requests coffee catalog through the API Gateway.
2. Client claims an order with `POST /api/orders/claim`.
3. Client processes an order with `POST /api/orders/{id}/process`, or uses `POST /api/orders/claim-process`.
4. Order Service requests a Catalog quote.
5. Payment Service approves or rejects payment.
6. Notification Service records a completion notification.
7. Analytics Service receives an `ORDER_COMPLETED` event.
8. Client can view all orders and analytics through the gateway.

## SRE Criteria Coverage

| Criterion | Implementation |
| --- | --- |
| 6+ microservices | 8 backend services in `src/services/` |
| Docker environment | `Dockerfile`, `docker-compose.yml` |
| Docker Swarm | `docker stack deploy -c docker-compose.yml coffee` |
| Kubernetes | `k8s/namespace.yaml`, `k8s/configmap.yaml`, `k8s/services.yaml`, `k8s/hpa.yaml` |
| Terraform | `terraform/main.tf`, `terraform/variables.tf` |
| Ansible | `ansible/deploy.yml`, `ansible/inventory.ini` |
| Prometheus | `monitoring/prometheus.yml`, service `/metrics` endpoints |
| Grafana | `monitoring/grafana-dashboard.json` |
| Alerts | `monitoring/alerts.yml` |
| SLIs/SLOs | `docs/sli-slo.md` |
| Incident response | `docs/incident-response.md` |
| Postmortem | `docs/postmortem.md` |
| Capacity planning | `docs/capacity-planning.md` |
| Demo evidence | `docs/demo-evidence.md` |
| Frontend | `frontend/server.js`, `frontend/static/` |

## Verification Results

Unit test:

```text
tests 1
pass 1
fail 0
```

Live smoke workflow:

```json
{
  "gateway": "UP",
  "coffees": 4,
  "orderStatus": "COMPLETED",
  "totalRevenue": 5,
  "totalOrders": 1
}
```

## Conclusion

The system satisfies the endterm requirements with a complete backend and a suitable coffee-shop operations frontend. It demonstrates a complete SRE lifecycle: microservices implementation, containerization, orchestration, monitoring, alerting, incident handling, automation, and capacity planning.

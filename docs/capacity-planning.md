# Capacity Planning

## Findings

- Order and Payment services are the critical revenue path.
- Order processing performs multiple network calls and should scale earlier than read-only services.
- PostgreSQL is the likely bottleneck once persistent adapters are enabled.
- Analytics can be scaled separately because event ingestion and summary reads are independent.

## Initial Sizing

| Component | Replicas | CPU | Memory |
| --- | ---: | ---: | ---: |
| API Gateway | 2 | 0.5 | 256Mi |
| Order Service | 3-8 | 1.0 | 512Mi |
| Payment Service | 2 | 0.5 | 256Mi |
| Catalog Service | 2 | 0.5 | 256Mi |
| Analytics Service | 2 | 0.5 | 256Mi |
| PostgreSQL | 1 managed primary | 2.0 | 4Gi |

## Scaling Strategy

- Use Kubernetes HPA for Order Service at 65% CPU.
- Increase Order Service replicas during known peak coffee hours.
- Add read replicas or managed database scaling when write latency exceeds the 200ms SLO.
- Keep Payment Service isolated so payment failures do not exhaust gateway capacity.

## Load Test Plan

1. Generate traffic against `/api/orders/claim-process`.
2. Track p95 latency, 5xx rate, and completion throughput.
3. Increase Order Service replicas when p95 approaches 200ms.
4. Promote database scaling when service CPU is healthy but latency remains high.

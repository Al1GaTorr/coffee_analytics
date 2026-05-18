# SLI/SLO Design

## SLIs

| SLI | Measurement |
| --- | --- |
| Availability | `up == 1` and successful `/health` responses |
| Latency | P95 from `http_request_duration_p95_ms` |
| Error rate | 5xx responses divided by total requests |
| Request success rate | 2xx/3xx responses divided by total requests |
| Service uptime | `service_uptime_seconds` exported by every backend service |

## SLOs

| SLO | Target |
| --- | --- |
| Availability | >= 99% |
| P95 latency | <= 200 ms |
| Error rate | <= 1% |
| Request success rate | >= 99% |

## Error Budget

For a 30-day month, 99% availability allows about 7.2 hours of unavailability. The Order and Payment services consume the error budget fastest because they are on the revenue path.

## PromQL Queries

### Availability SLO — всех сервисов должны быть UP
```promql
up
```
Target: все значения = 1 (100% сервисов живы)

### Availability SLO — процент UP за последние 30 дней
```promql
avg_over_time(up[30d]) * 100
```
Target: >= 99%

### Latency SLO — P95 latency по каждому сервису
```promql
http_request_duration_p95_ms
```
Target: <= 200 ms для всех сервисов

### Error Rate SLO — доля 5xx запросов за последние 5 минут
```promql
sum(rate(http_requests_total{status=~"5.."}[5m]))
  / clamp_min(sum(rate(http_requests_total[5m])), 1)
  * 100
```
Target: <= 1%

### Request Success Rate SLO — доля успешных запросов (2xx/3xx)
```promql
sum(rate(http_requests_total{status=~"[23].."}[5m]))
  / clamp_min(sum(rate(http_requests_total[5m])), 1)
  * 100
```
Target: >= 99%

### Error Budget Burn Rate — скорость сжигания бюджета
```promql
sum(rate(http_requests_total{status=~"5.."}[1h]))
  / clamp_min(sum(rate(http_requests_total[1h])), 1)
  / 0.01
```
Target: < 1.0 (горит быстрее нормы если > 1)

## Alerting

Prometheus alert rules are in `monitoring/alerts.yml`:

- `HighErrorRate` — error rate > 1% в течение 2 минут
- `HighLatencyP95` — P95 latency > 200ms в течение 2 минут
- `ServiceDown` — `up == 0` в течение 1 минуты

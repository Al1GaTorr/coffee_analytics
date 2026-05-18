# Incident Simulation: Order Service Failure

## Scenario

The Order Service fails because an upstream configuration is wrong. Example:

```bash
ORDER_URL=http://wrong-order-service:3003
```

or the Order Service receives a broken catalog/payment URL:

```bash
PAYMENT_URL=http://wrong-payment-service:3004
```

## Impact

- New coffee orders cannot be processed.
- Existing claimed orders may stay in `CLAIMED` or move to `FAILED`.
- Analytics receives fewer `ORDER_COMPLETED` events.
- Revenue path is degraded, while catalog/profile reads can continue.

## Detection

- Prometheus `ServiceDown` or `HighErrorRate` alert.
- Gateway requests to `/api/orders/claim-process` return 5xx/502.
- Order Service logs show upstream request failures.

## Response Steps

1. Check service health:
   ```bash
   curl http://localhost:8080/health
   curl http://localhost:3003/health
   ```
2. Inspect Order Service logs:
   ```bash
   docker compose logs order-service
   ```
3. Validate environment variables:
   ```bash
   docker compose config
   ```
4. Fix the incorrect service URL.
5. Restart the affected service:
   ```bash
   docker compose up -d order-service
   ```
6. Re-run the order workflow and confirm analytics recovery.

## Recovery Criteria

- `/api/orders/claim-process` returns `201`.
- `/api/orders` includes completed orders.
- `/api/analytics/summary` shows completed order and revenue updates.
- Prometheus alerts return to normal.

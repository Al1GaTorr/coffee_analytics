# Demo Evidence Checklist

Use these commands to collect screenshots or terminal evidence for the final PDF submission.

```bash
npm test
docker compose up --build -d
curl http://localhost:5173
curl http://localhost:8080/health
curl http://localhost:8080/api/catalog/coffees
curl -X POST http://localhost:8080/api/orders/claim-process \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"u-100\",\"items\":[{\"coffeeId\":\"espresso\",\"quantity\":2}],\"paymentMethod\":\"card\"}"
curl http://localhost:8080/api/orders
curl http://localhost:8080/api/analytics/summary
curl http://localhost:3003/metrics
```

Grafana: `http://localhost:3000`  
Prometheus: `http://localhost:9090`
Frontend: `http://localhost:5173`

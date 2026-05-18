import { createService, HttpError, json } from '../../shared/http.js';
import { FileRepository } from '../../shared/fileRepository.js';
import { MetricsRegistry } from '../../shared/metrics.js';

const events = new FileRepository(process.env.ANALYTICS_DB_PATH || './data/analytics-events.json', []);

function summarize() {
  const latestOrders = new Map();
  for (const event of events.list()) {
    if (event.order?.id) latestOrders.set(event.order.id, event.order);
  }
  const orders = [...latestOrders.values()];
  const revenueOrders = orders.filter((order) => order.status !== 'CANCELLED' && order.status !== 'FAILED');
  const revenue = revenueOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const byStatus = orders.reduce((acc, order) => ({ ...acc, [order.status]: (acc[order.status] || 0) + 1 }), {});
  const topCoffees = {};
  for (const order of revenueOrders) {
    for (const item of order.items || []) topCoffees[item.name] = (topCoffees[item.name] || 0) + item.quantity;
  }
  return {
    totalOrders: orders.length,
    totalRevenue: Number(revenue.toFixed(2)),
    averageOrderValue: orders.length ? Number((revenue / orders.length).toFixed(2)) : 0,
    byStatus,
    topCoffees,
    slo: {
      availabilityTarget: '>= 99%',
      latencyTargetMs: '<= 200',
      errorRateTarget: '<= 1%'
    }
  };
}

const metrics = new MetricsRegistry('analytics-service');
const app = createService({
  name: 'analytics-service',
  metrics,
  routes: [
    { method: 'POST', pattern: /^\/events$/, handler: async ({ body }) => {
      if (!body.type) throw new HttpError(400, 'event type is required');
      const event = events.save({ id: body.id || `${body.type}-${Date.now()}`, ...body, receivedAt: new Date().toISOString() });
      return json(202, { event });
    } },
    { method: 'GET', pattern: /^\/summary$/, handler: async () => json(200, { analytics: summarize() }) },
    { method: 'GET', pattern: /^\/events$/, handler: async () => json(200, { events: events.list() }) }
  ]
});

app.listen(Number(process.env.PORT || 3007), () => console.log('analytics-service listening'));

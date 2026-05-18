import { createService, json, requestJson } from '../../shared/http.js';
import { MetricsRegistry } from '../../shared/metrics.js';

const services = {
  auth: process.env.AUTH_URL || 'http://localhost:3001',
  catalog: process.env.CATALOG_URL || 'http://localhost:3002',
  orders: process.env.ORDER_URL || 'http://localhost:3003',
  payments: process.env.PAYMENT_URL || 'http://localhost:3004',
  notifications: process.env.NOTIFICATION_URL || 'http://localhost:3005',
  profiles: process.env.PROFILE_URL || 'http://localhost:3006',
  analytics: process.env.ANALYTICS_URL || 'http://localhost:3007'
};

const adminKey = process.env.ADMIN_KEY || 'admin123';

function assertAdmin(req) {
  if (req.headers['x-admin-key'] !== adminKey) {
    throw Object.assign(new Error('Admin access required'), { statusCode: 403 });
  }
}

function proxy(service, path, method = 'GET', body = undefined, headers = {}) {
  return requestJson(services[service], path, { method, body, headers });
}

const routes = [
  { method: 'POST', pattern: /^\/api\/auth\/login$/, handler: async ({ body }) => json(200, await proxy('auth', '/login', 'POST', body)) },
  { method: 'GET', pattern: /^\/api\/catalog\/coffees$/, handler: async () => json(200, await proxy('catalog', '/coffees')) },
  { method: 'POST', pattern: /^\/api\/admin\/catalog\/coffees$/, handler: async ({ req, body }) => {
    assertAdmin(req);
    return json(201, await proxy('catalog', '/coffees', 'POST', body));
  } },
  { method: 'PUT', pattern: /^\/api\/admin\/catalog\/coffees\/(?<id>[^/]+)$/, handler: async ({ req, body }) => {
    assertAdmin(req);
    return json(200, await proxy('catalog', `/coffees/${req.params.id}`, 'PUT', body));
  } },
  { method: 'DELETE', pattern: /^\/api\/admin\/catalog\/coffees\/(?<id>[^/]+)$/, handler: async ({ req }) => {
    assertAdmin(req);
    return json(200, await proxy('catalog', `/coffees/${req.params.id}`, 'DELETE'));
  } },
  { method: 'GET', pattern: /^\/api\/profiles$/, handler: async () => json(200, await proxy('profiles', '/profiles')) },
  { method: 'GET', pattern: /^\/api\/admin\/orders$/, handler: async ({ req, url }) => {
    assertAdmin(req);
    const params = new URLSearchParams();
    if (url.searchParams.get('activeOnly')) params.set('activeOnly', url.searchParams.get('activeOnly'));
    return json(200, await proxy('orders', `/orders${params.toString() ? `?${params}` : ''}`));
  } },
  { method: 'GET', pattern: /^\/api\/orders$/, handler: async ({ url }) => {
    const params = new URLSearchParams();
    const userId = url.searchParams.get('userId');
    if (!userId) throw Object.assign(new Error('userId is required'), { statusCode: 400 });
    params.set('userId', userId);
    return json(200, await proxy('orders', `/orders${params.toString() ? `?${params}` : ''}`));
  } },
  { method: 'GET', pattern: /^\/api\/orders\/(?<id>[^/]+)$/, handler: async ({ req }) => json(200, await proxy('orders', `/orders/${req.params.id}`)) },
  { method: 'POST', pattern: /^\/api\/orders\/claim$/, handler: async ({ body }) => json(201, await proxy('orders', '/orders', 'POST', body)) },
  { method: 'POST', pattern: /^\/api\/orders\/(?<id>[^/]+)\/process$/, handler: async ({ req, body }) => {
    return json(200, await proxy('orders', `/orders/${req.params.id}/process`, 'POST', body));
  } },
  { method: 'POST', pattern: /^\/api\/orders\/claim-process$/, handler: async ({ body }) => {
    const claimed = await proxy('orders', '/orders', 'POST', body);
    const processed = await proxy('orders', `/orders/${claimed.order.id}/process`, 'POST', { paymentMethod: body.paymentMethod });
    return json(201, { claimed: claimed.order, processed: processed.order });
  } },
  { method: 'PATCH', pattern: /^\/api\/admin\/orders\/(?<id>[^/]+)\/status$/, handler: async ({ req, body }) => {
    assertAdmin(req);
    return json(200, await proxy('orders', `/orders/${req.params.id}/status`, 'PATCH', body));
  } },
  { method: 'GET', pattern: /^\/api\/admin\/analytics\/summary$/, handler: async ({ req }) => {
    assertAdmin(req);
    return json(200, await proxy('analytics', '/summary'));
  } },
  { method: 'GET', pattern: /^\/api\/notifications$/, handler: async () => json(200, await proxy('notifications', '/notifications')) }
];

const app = createService({
  name: 'api-gateway',
  metrics: new MetricsRegistry('api-gateway'),
  routes
});

app.listen(Number(process.env.PORT || 8080), () => console.log('api-gateway listening'));

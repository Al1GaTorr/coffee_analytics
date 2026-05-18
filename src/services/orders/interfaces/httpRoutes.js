import { json } from '../../../shared/http.js';

export function orderRoutes(useCases) {
  return [
    { method: 'POST', pattern: /^\/orders$/, handler: async ({ body }) => json(201, { order: await useCases.claim(body) }) },
    { method: 'POST', pattern: /^\/orders\/(?<id>[^/]+)\/process$/, handler: async ({ req, body }) => {
      return json(200, { order: await useCases.process({ orderId: req.params.id, paymentMethod: body.paymentMethod }) });
    } },
    { method: 'PATCH', pattern: /^\/orders\/(?<id>[^/]+)\/status$/, handler: async ({ req, body }) => {
      return json(200, { order: await useCases.updateStatus({ orderId: req.params.id, status: body.status }) });
    } },
    { method: 'GET', pattern: /^\/orders$/, handler: async ({ url }) => json(200, {
      orders: useCases.list({
        userId: url.searchParams.get('userId'),
        activeOnly: url.searchParams.get('activeOnly') === 'true'
      })
    }) },
    { method: 'GET', pattern: /^\/orders\/(?<id>[^/]+)$/, handler: async ({ req }) => json(200, { order: useCases.get(req.params.id) }) }
  ];
}

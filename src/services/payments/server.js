import { createService, HttpError, json } from '../../shared/http.js';
import { InMemoryRepository } from '../../shared/inMemoryRepository.js';
import { newId } from '../../shared/id.js';
import { MetricsRegistry } from '../../shared/metrics.js';

const payments = new InMemoryRepository();

const metrics = new MetricsRegistry('payment-service');
const app = createService({
  name: 'payment-service',
  metrics,
  routes: [
    { method: 'POST', pattern: /^\/payments\/process$/, handler: async ({ body }) => {
      if (!body.orderId) throw new HttpError(400, 'orderId is required');
      if (Number(body.amount) <= 0) throw new HttpError(400, 'amount must be greater than zero');
      const payment = payments.save({
        id: newId('pay'),
        orderId: body.orderId,
        amount: Number(body.amount),
        method: body.paymentMethod || 'card',
        status: process.env.PAYMENT_FORCE_FAILURE === 'true' ? 'FAILED' : 'APPROVED',
        processedAt: new Date().toISOString()
      });
      if (payment.status === 'FAILED') throw new HttpError(402, 'Payment declined by simulation', { payment });
      return json(201, { payment });
    } },
    { method: 'GET', pattern: /^\/payments$/, handler: async () => json(200, { payments: payments.list() }) }
  ]
});

app.listen(Number(process.env.PORT || 3004), () => console.log('payment-service listening'));

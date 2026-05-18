import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryRepository } from '../src/shared/inMemoryRepository.js';
import { OrderUseCases } from '../src/services/orders/application/orderUseCases.js';

test('claims and processes a coffee order through clean-architecture use cases', async () => {
  const sentNotifications = [];
  const analyticsEvents = [];
  const useCases = new OrderUseCases({
    orderRepository: new InMemoryRepository(),
    catalogClient: {
      quote: async () => ({
        items: [{ coffeeId: 'espresso', name: 'Espresso', quantity: 2, unitPrice: 2.5, lineTotal: 5 }],
        total: 5,
        currency: 'USD'
      })
    },
    paymentClient: { process: async () => ({ payment: { id: 'pay-test', status: 'APPROVED' } }) },
    notificationClient: { send: async (message) => sentNotifications.push(message) },
    analyticsClient: { ingest: async (event) => analyticsEvents.push(event) }
  });

  const claimed = await useCases.claim({ userId: 'u-100', items: [{ coffeeId: 'espresso', quantity: 2 }] });
  const processed = await useCases.process({ orderId: claimed.id, paymentMethod: 'card' });

  assert.equal(claimed.status, 'CLAIMED');
  assert.equal(processed.status, 'PROCESSING');
  assert.equal(processed.total, 5);
  assert.equal(sentNotifications.length, 1);
  assert.equal(analyticsEvents[0].type, 'ORDER_PROCESSING');
});

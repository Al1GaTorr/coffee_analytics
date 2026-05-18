import { createService, json } from '../../shared/http.js';
import { InMemoryRepository } from '../../shared/inMemoryRepository.js';
import { newId } from '../../shared/id.js';
import { MetricsRegistry } from '../../shared/metrics.js';

const notifications = new InMemoryRepository();

const metrics = new MetricsRegistry('notification-service');
const app = createService({
  name: 'notification-service',
  metrics,
  routes: [
    { method: 'POST', pattern: /^\/notifications$/, handler: async ({ body }) => {
      const notification = notifications.save({
        id: newId('ntf'),
        userId: body.userId,
        channel: body.channel || 'email',
        message: body.message || 'Coffee order update',
        status: 'SENT',
        sentAt: new Date().toISOString()
      });
      return json(201, { notification });
    } },
    { method: 'GET', pattern: /^\/notifications$/, handler: async () => json(200, { notifications: notifications.list() }) }
  ]
});

app.listen(Number(process.env.PORT || 3005), () => console.log('notification-service listening'));

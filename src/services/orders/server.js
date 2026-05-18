import { createService } from '../../shared/http.js';
import { FileRepository } from '../../shared/fileRepository.js';
import { MetricsRegistry } from '../../shared/metrics.js';
import { OrderUseCases } from './application/orderUseCases.js';
import { AnalyticsClient, CatalogClient, NotificationClient, PaymentClient } from './infrastructure/clients.js';
import { orderRoutes } from './interfaces/httpRoutes.js';

const useCases = new OrderUseCases({
  orderRepository: new FileRepository(process.env.ORDERS_DB_PATH || './data/orders.json', []),
  catalogClient: new CatalogClient(process.env.CATALOG_URL || 'http://localhost:3002'),
  paymentClient: new PaymentClient(process.env.PAYMENT_URL || 'http://localhost:3004'),
  notificationClient: new NotificationClient(process.env.NOTIFICATION_URL || 'http://localhost:3005'),
  analyticsClient: new AnalyticsClient(process.env.ANALYTICS_URL || 'http://localhost:3007')
});

const app = createService({
  name: 'order-service',
  metrics: new MetricsRegistry('order-service'),
  routes: orderRoutes(useCases)
});

app.listen(Number(process.env.PORT || 3003), () => console.log('order-service listening'));

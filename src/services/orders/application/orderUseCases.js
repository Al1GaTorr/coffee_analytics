import { HttpError } from '../../../shared/http.js';
import { claimOrder, OrderStatus, transitionOrder } from '../domain/order.js';

export class OrderUseCases {
  constructor({ orderRepository, catalogClient, paymentClient, notificationClient, analyticsClient }) {
    this.orderRepository = orderRepository;
    this.catalogClient = catalogClient;
    this.paymentClient = paymentClient;
    this.notificationClient = notificationClient;
    this.analyticsClient = analyticsClient;
  }

  async claim({ userId, items }) {
    const quote = await this.catalogClient.quote(items);
    const order = this.orderRepository.save(claimOrder({ userId, quote }));
    return order;
  }

  async process({ orderId, paymentMethod = 'card' }) {
    const order = this.orderRepository.findById(orderId);
    if (!order) throw new HttpError(404, 'Order not found');
    if (![OrderStatus.CLAIMED, OrderStatus.FAILED].includes(order.status)) {
      throw new HttpError(409, `Order cannot be processed from status ${order.status}`);
    }

    try {
      const payment = await this.paymentClient.process({
        orderId: order.id,
        amount: order.total,
        paymentMethod
      });
      let next = transitionOrder(order, OrderStatus.PAID, `Payment approved: ${payment.payment.id}`);
      next = transitionOrder(next, OrderStatus.PROCESSING, 'Coffee preparation started');
      this.orderRepository.save(next);
      await this.notificationClient.send({
        userId: next.userId,
        message: `Your coffee order ${next.id} is being prepared.`
      });
      await this.analyticsClient.ingest({ type: 'ORDER_PROCESSING', order: next });
      return next;
    } catch (error) {
      const failed = this.orderRepository.save(transitionOrder(order, OrderStatus.FAILED, error.message));
      throw new HttpError(error.statusCode || 502, 'Order processing failed', { order: failed, cause: error.message });
    }
  }

  list(filters = {}) {
    return this.orderRepository.list().filter((order) => {
      if (filters.userId && order.userId !== filters.userId) return false;
      if (filters.activeOnly && ['COMPLETED', 'CANCELLED', 'FAILED'].includes(order.status)) return false;
      return true;
    });
  }

  get(orderId) {
    const order = this.orderRepository.findById(orderId);
    if (!order) throw new HttpError(404, 'Order not found');
    return order;
  }

  async updateStatus({ orderId, status }) {
    const order = this.get(orderId);
    const allowed = [OrderStatus.PROCESSING, OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.FAILED];
    if (!allowed.includes(status)) throw new HttpError(400, 'Unsupported order status');
    const next = this.orderRepository.save(transitionOrder(order, status, `Admin changed status to ${status}`));
    await this.analyticsClient.ingest({ type: 'ORDER_STATUS_CHANGED', order: next });
    return next;
  }
}

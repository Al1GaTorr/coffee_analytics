import { HttpError } from '../../../shared/http.js';
import { newId } from '../../../shared/id.js';

export const OrderStatus = Object.freeze({
  CLAIMED: 'CLAIMED',
  PAID: 'PAID',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED'
});

export function claimOrder({ userId, quote }) {
  if (!userId) throw new HttpError(400, 'userId is required');
  if (!quote || !Array.isArray(quote.items)) throw new HttpError(400, 'quote is required');
  const now = new Date().toISOString();
  return {
    id: newId('ord'),
    userId,
    items: quote.items,
    total: quote.total,
    currency: quote.currency,
    status: OrderStatus.CLAIMED,
    timeline: [{ status: OrderStatus.CLAIMED, at: now, message: 'Order claimed by backend workflow' }],
    createdAt: now,
    updatedAt: now
  };
}

export function transitionOrder(order, status, message) {
  const at = new Date().toISOString();
  return {
    ...order,
    status,
    updatedAt: at,
    timeline: [...order.timeline, { status, at, message }]
  };
}

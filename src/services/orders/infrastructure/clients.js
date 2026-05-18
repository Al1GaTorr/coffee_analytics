import { requestJson } from '../../../shared/http.js';

export class CatalogClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  quote(items) {
    return requestJson(this.baseUrl, '/quotes', { method: 'POST', body: { items } });
  }
}

export class PaymentClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  process(payload) {
    return requestJson(this.baseUrl, '/payments/process', { method: 'POST', body: payload });
  }
}

export class NotificationClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  send(payload) {
    return requestJson(this.baseUrl, '/notifications', { method: 'POST', body: payload });
  }
}

export class AnalyticsClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  ingest(payload) {
    return requestJson(this.baseUrl, '/events', { method: 'POST', body: payload });
  }
}

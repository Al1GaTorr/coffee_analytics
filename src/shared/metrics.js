export class MetricsRegistry {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.startedAt = Date.now();
    this.requests = new Map();
    this.latencies = [];
  }

  record(method, path, statusCode, durationMs) {
    const key = `${method}:${path}:${statusCode}`;
    this.requests.set(key, (this.requests.get(key) || 0) + 1);
    this.latencies.push(durationMs);
    if (this.latencies.length > 500) this.latencies.shift();
  }

  render() {
    const lines = [
      '# HELP service_uptime_seconds Service uptime in seconds',
      '# TYPE service_uptime_seconds gauge',
      `service_uptime_seconds{service="${this.serviceName}"} ${Math.floor((Date.now() - this.startedAt) / 1000)}`,
      '# HELP http_requests_total Total HTTP requests',
      '# TYPE http_requests_total counter'
    ];
    for (const [key, count] of this.requests.entries()) {
      const [method, path, status] = key.split(':');
      lines.push(`http_requests_total{service="${this.serviceName}",method="${method}",path="${path}",status="${status}"} ${count}`);
    }
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const p95 = sorted.length ? sorted[Math.floor(sorted.length * 0.95)] : 0;
    lines.push('# HELP http_request_duration_p95_ms Rolling p95 request duration');
    lines.push('# TYPE http_request_duration_p95_ms gauge');
    lines.push(`http_request_duration_p95_ms{service="${this.serviceName}"} ${p95.toFixed(2)}`);
    return `${lines.join('\n')}\n`;
  }
}

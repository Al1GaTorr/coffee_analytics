import http from 'node:http';
import { URL } from 'node:url';

export class HttpError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function json(statusCode, body) {
  return { statusCode, body };
}

export async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'Invalid JSON body');
  }
}

export function createService({ name, routes, metrics }) {
  return http.createServer(async (req, res) => {
    const startedAt = performance.now();
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const route = routes.find((candidate) => {
      if (candidate.method !== req.method) return false;
      const match = url.pathname.match(candidate.pattern);
      if (!match) return false;
      req.params = match.groups || {};
      return true;
    });

    try {
      if (url.pathname === '/health' && req.method === 'GET') {
        return send(res, 200, { service: name, status: 'UP', checkedAt: new Date().toISOString() });
      }
      if (url.pathname === '/metrics' && req.method === 'GET') {
        const text = metrics.render();
        res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4' });
        return res.end(text);
      }
      if (!route) throw new HttpError(404, `Route not found: ${req.method} ${url.pathname}`);
      const result = await route.handler({ req, url, body: await readJson(req) });
      metrics.record(req.method, url.pathname, result.statusCode || 200, performance.now() - startedAt);
      return send(res, result.statusCode || 200, result.body ?? result);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      metrics.record(req.method, url.pathname, statusCode, performance.now() - startedAt);
      return send(res, statusCode, {
        error: error.message || 'Internal server error',
        details: error.details,
        service: name
      });
    }
  });
}

export function send(res, statusCode, body) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body, null, 2));
}

export async function requestJson(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method || 'GET',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) throw new HttpError(response.status, payload.error || 'Upstream request failed', payload);
  return payload;
}

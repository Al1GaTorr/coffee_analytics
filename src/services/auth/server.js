import { createService, HttpError, json } from '../../shared/http.js';
import { InMemoryRepository } from '../../shared/inMemoryRepository.js';
import { MetricsRegistry } from '../../shared/metrics.js';

const users = new InMemoryRepository([
  { id: 'alice', username: 'alice', email: 'alice@example.com', password: 'coffee123', role: 'user', displayName: 'Alice' },
  { id: 'bob', username: 'bob', email: 'bob@example.com', password: 'coffee123', role: 'user', displayName: 'Bob' },
  { id: 'admin', username: 'admin', email: 'admin@example.com', password: 'admin123', role: 'admin', displayName: 'Admin' }
]);

const metrics = new MetricsRegistry('auth-service');
const app = createService({
  name: 'auth-service',
  metrics,
  routes: [
    { method: 'POST', pattern: /^\/login$/, handler: async ({ body }) => {
      const query = body.email || body.username || '';
      const user = users.list().find(
        (candidate) => candidate.username === query || candidate.email === query
      );
      if (!user || user.password !== body.password) throw new HttpError(401, 'Invalid credentials');
      return json(200, {
        token: Buffer.from(`${user.id}:${user.role}`).toString('base64url'),
        user: { id: user.id, username: user.username, email: user.email, role: user.role, displayName: user.displayName }
      });
    } },
    { method: 'GET', pattern: /^\/users$/, handler: async () => json(200, {
      users: users.list().map(({ password, ...user }) => user)
    }) }
  ]
});

app.listen(Number(process.env.PORT || 3001), () => console.log('auth-service listening'));

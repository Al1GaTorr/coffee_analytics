import { createService, HttpError, json } from '../../shared/http.js';
import { InMemoryRepository } from '../../shared/inMemoryRepository.js';
import { MetricsRegistry } from '../../shared/metrics.js';

const profiles = new InMemoryRepository([
  { id: 'u-100', name: 'Aruzhan', loyaltyTier: 'gold', favoriteRoast: 'dark' },
  { id: 'u-200', name: 'Manager Demo', loyaltyTier: 'platinum', favoriteRoast: 'medium' }
]);

const metrics = new MetricsRegistry('profile-service');
const app = createService({
  name: 'profile-service',
  metrics,
  routes: [
    { method: 'GET', pattern: /^\/profiles$/, handler: async () => json(200, { profiles: profiles.list() }) },
    { method: 'GET', pattern: /^\/profiles\/(?<id>[^/]+)$/, handler: async ({ req }) => {
      const profile = profiles.findById(req.params.id);
      if (!profile) throw new HttpError(404, 'Profile not found');
      return json(200, { profile });
    } },
    { method: 'PUT', pattern: /^\/profiles\/(?<id>[^/]+)$/, handler: async ({ req, body }) => {
      const profile = profiles.update(req.params.id, body);
      if (!profile) throw new HttpError(404, 'Profile not found');
      return json(200, { profile });
    } }
  ]
});

app.listen(Number(process.env.PORT || 3006), () => console.log('profile-service listening'));

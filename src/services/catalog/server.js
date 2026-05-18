import { createService, HttpError, json } from '../../shared/http.js';
import { FileRepository } from '../../shared/fileRepository.js';
import { MetricsRegistry } from '../../shared/metrics.js';
import { newId } from '../../shared/id.js';

const seedItems = [
  { id: 'espresso', name: 'Espresso', price: 2.0, category: 'Coffee', roast: 'dark', description: 'Single espresso shot', stock: 150 },
  { id: 'americano', name: 'Americano', price: 5.0, category: 'Coffee', roast: 'medium', description: 'Hot water and espresso', stock: 120 },
  { id: 'doppio', name: 'Doppio', price: 4.0, category: 'Coffee', roast: 'dark', description: 'Double espresso', stock: 110 },
  { id: 'cappuccino', name: 'Cappuccino', price: 6.0, category: 'Coffee', roast: 'medium', description: 'Whipped milk and espresso', stock: 100 },
  { id: 'latte', name: 'Latte', price: 6.0, category: 'Coffee', roast: 'medium', description: 'Milk and espresso', stock: 100 },
  { id: 'macchiato', name: 'Espresso Macchiato', price: 4.0, category: 'Coffee', roast: 'dark', description: 'Espresso with milk foam', stock: 90 },
  { id: 'iced-americano', name: 'Iced Americano', price: 6.0, category: 'Ice Coffee', roast: 'medium', description: 'Espresso, cold water, ice', stock: 80 },
  { id: 'cold-brew', name: 'Cold Brew', price: 6.5, category: 'Ice Coffee', roast: 'medium', description: 'Slow brewed cold coffee', stock: 80 },
  { id: 'frappe', name: 'Frappe', price: 7.0, category: 'Ice Coffee', roast: 'medium', description: 'Chocolate syrup, ice cream, espresso', stock: 70 },
  { id: 'iced-caramel-macchiato', name: 'Iced Caramel Macchiato', price: 7.0, category: 'Ice Coffee', roast: 'medium', description: 'Caramel syrup, cold milk, espresso', stock: 70 },
  { id: 'cheesecake', name: 'Cheesecake', price: 5.5, category: 'Dessert', roast: 'sweet', description: 'Classic vanilla cheesecake slice', stock: 45 },
  { id: 'tiramisu', name: 'Tiramisu', price: 6.5, category: 'Dessert', roast: 'sweet', description: 'Coffee cream and cocoa dessert', stock: 40 },
  { id: 'brownie', name: 'Chocolate Brownie', price: 4.5, category: 'Dessert', roast: 'sweet', description: 'Dense chocolate brownie', stock: 55 },
  { id: 'croissant', name: 'Butter Croissant', price: 3.5, category: 'Dessert', roast: 'buttery', description: 'Fresh layered pastry', stock: 60 }
];

const coffees = new FileRepository(process.env.CATALOG_DB_PATH || './data/catalog.json', seedItems);

function quoteItems(items) {
  if (!Array.isArray(items) || items.length === 0) throw new HttpError(400, 'At least one item is required');
  let total = 0;
  const quotedItems = items.map((item) => {
    const coffee = coffees.findById(item.coffeeId);
    if (!coffee) throw new HttpError(404, `Coffee not found: ${item.coffeeId}`);
    const quantity = Number(item.quantity || 1);
    if (quantity <= 0) throw new HttpError(400, 'Quantity must be greater than zero');
    if (coffee.stock < quantity) throw new HttpError(409, `Insufficient stock for ${coffee.name}`);
    const lineTotal = Number((coffee.price * quantity).toFixed(2));
    total += lineTotal;
    return {
      coffeeId: coffee.id,
      name: coffee.name,
      category: coffee.category,
      quantity,
      unitPrice: coffee.price,
      lineTotal
    };
  });
  return { items: quotedItems, total: Number(total.toFixed(2)), currency: 'USD' };
}

const metrics = new MetricsRegistry('catalog-service');
const app = createService({
  name: 'catalog-service',
  metrics,
  routes: [
    { method: 'GET', pattern: /^\/coffees$/, handler: async () => json(200, { coffees: coffees.list() }) },
    { method: 'GET', pattern: /^\/coffees\/(?<id>[^/]+)$/, handler: async ({ req }) => {
      const coffee = coffees.findById(req.params.id);
      if (!coffee) throw new HttpError(404, 'Coffee not found');
      return json(200, { coffee });
    } },
    { method: 'POST', pattern: /^\/coffees$/, handler: async ({ body }) => {
      if (!body.name) throw new HttpError(400, 'name is required');
      if (Number(body.price) <= 0) throw new HttpError(400, 'price must be greater than zero');
      const id = body.id || newId('item');
      const coffee = coffees.save({
        id,
        name: body.name,
        price: Number(body.price),
        category: body.category || 'Coffee',
        roast: body.roast || 'medium',
        description: body.description || '',
        stock: Number(body.stock ?? 100),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return json(201, { coffee });
    } },
    { method: 'PUT', pattern: /^\/coffees\/(?<id>[^/]+)$/, handler: async ({ req, body }) => {
      const patch = { ...body };
      if (patch.price !== undefined) patch.price = Number(patch.price);
      if (patch.stock !== undefined) patch.stock = Number(patch.stock);
      const coffee = coffees.update(req.params.id, patch);
      if (!coffee) throw new HttpError(404, 'Coffee not found');
      return json(200, { coffee });
    } },
    { method: 'DELETE', pattern: /^\/coffees\/(?<id>[^/]+)$/, handler: async ({ req }) => {
      if (!coffees.delete(req.params.id)) throw new HttpError(404, 'Coffee not found');
      return json(200, { deleted: true });
    } },
    { method: 'POST', pattern: /^\/quotes$/, handler: async ({ body }) => json(200, quoteItems(body.items)) }
  ]
});

app.listen(Number(process.env.PORT || 3002), () => console.log('catalog-service listening'));

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const categoryOrder = ['Coffee', 'Ice Coffee', 'Dessert'];

const itemImages = {
  espresso: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?auto=format&fit=crop&w=900&q=80',
  americano: 'https://images.unsplash.com/photo-1497636577773-f1231844b336?auto=format&fit=crop&w=900&q=80',
  doppio: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80',
  cappuccino: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=900&q=80',
  latte: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=80',
  macchiato: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=900&q=80',
  'iced-americano': 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=900&q=80',
  'cold-brew': 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=900&q=80',
  frappe: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=900&q=80',
  'iced-caramel-macchiato': 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=900&q=80',
  cheesecake: 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?auto=format&fit=crop&w=900&q=80',
  tiramisu: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=900&q=80',
  brownie: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80',
  croissant: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=80'
};

// ─── Session helpers ──────────────────────────────────────────────────────────
function getSession() {
  return JSON.parse(localStorage.getItem('correttoSession') || 'null');
}
function requireAuth(role) {
  const session = getSession();
  if (!session) { window.location.href = '/login.html'; return null; }
  if (role && session.role !== role) { window.location.href = '/login.html'; return null; }
  return session;
}
function getUsername() {
  const session = getSession();
  return session ? (session.username || session.user?.username || 'guest') : 'guest';
}
function getUserId() {
  const session = getSession();
  return session ? session.user.id : 'guest';
}
function logout() {
  localStorage.removeItem('correttoSession');
  window.location.href = '/login.html';
}

// ─── Nav: inject user info and logout ────────────────────────────────────────
function setupNav() {
  const session = getSession();
  const nav = document.querySelector('.topbar nav');
  if (!nav) return;

  // Remove admin link for non-admins
  const adminLink = nav.querySelector('a[href="/admin.html"]');
  if (adminLink && session?.role !== 'admin') adminLink.remove();

  // User info + logout
  const userSpan = document.createElement('span');
  userSpan.className = 'nav-user';
  userSpan.innerHTML = session
    ? `<span class="nav-username">👤 ${session.username || session.user?.username || 'user'}</span><button class="button-link" id="logoutBtn">Sign out</button>`
    : `<a href="/login.html">Sign in</a>`;
  nav.appendChild(userSpan);
  document.getElementById('logoutBtn')?.addEventListener('click', logout);
}

// ─── API ──────────────────────────────────────────────────────────────────────
async function api(path, options = {}) {
  const session = getSession();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (session?.token) headers['Authorization'] = `Bearer ${session.token}`;
  const response = await fetch(path, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Request failed');
  return payload;
}

function groupByCategory(items) {
  return items.reduce((groups, item) => {
    const category = item.category || 'Coffee';
    groups[category] = groups[category] || [];
    groups[category].push(item);
    return groups;
  }, {});
}

function setMessage(id, text) {
  const node = document.querySelector(id);
  if (node) node.textContent = text;
}
function renderIcons() { window.renderIcons?.(); }

// ─── Menu page ────────────────────────────────────────────────────────────────
async function loadMenuPage() {
  const grid = document.querySelector('#menuGrid');
  if (!grid) return;
  requireAuth();
  const { coffees } = await api('/api/catalog/coffees');
  const grouped = groupByCategory(coffees);
  grid.innerHTML = categoryOrder.map((category) => `
    <section class="menu-category">
      <div class="menu-category-title">
        <span data-icon="${category === 'Dessert' ? 'receipt' : 'coffee'}"></span>
        <h2>${category}</h2>
      </div>
      <div class="catalog-list">
        ${(grouped[category] || []).map((item) => `
          <article class="coffee-card">
            <img src="${itemImages[item.id] || itemImages.espresso}" alt="${item.name}" />
            <div>
              <p class="eyebrow">${item.category}</p>
              <h3>${item.name}</h3>
              <p>${item.description}</p>
              <strong>${money.format(item.price)}</strong>
            </div>
          </article>
        `).join('')}
      </div>
    </section>
  `).join('');
  renderIcons();
}

// ─── Checkout page ────────────────────────────────────────────────────────────
async function loadCheckoutPage() {
  const form = document.querySelector('#checkoutForm');
  if (!form) return;
  const session = requireAuth('user');
  if (!session) return;

  const username = getUsername();
  const userId = getUserId();

  // Show username instead of raw ID
  const userIdInput = document.querySelector('#userId');
  const userDisplay = document.querySelector('#userDisplay');
  if (userIdInput) { userIdInput.value = userId; userIdInput.type = 'hidden'; }
  if (userDisplay) userDisplay.textContent = `Ordering as: ${username}`;

  const { coffees } = await api('/api/catalog/coffees');
  const grouped = groupByCategory(coffees);
  document.querySelector('#checkoutItems').innerHTML = categoryOrder.map((category) => `
    <section class="order-menu-group">
      <h3>${category}</h3>
      ${(grouped[category] || []).map((item) => `
        <label class="menu-line">
          <span>
            <strong>${item.name}</strong>
            <small>${money.format(item.price)} — ${item.description}</small>
          </span>
          <input type="number" min="0" max="20" value="0" data-quantity-for="${item.id}" aria-label="${item.name} quantity" />
        </label>
      `).join('')}
    </section>
  `).join('');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const items = coffees
      .map((item) => ({ coffeeId: item.id, quantity: Number(document.querySelector(`[data-quantity-for="${item.id}"]`).value || 0) }))
      .filter((item) => item.quantity > 0);
    if (!items.length) return setMessage('#checkoutMessage', 'Choose at least one menu item.');

    setMessage('#checkoutMessage', 'Saving order...');
    const result = await api('/api/orders/claim-process', {
      method: 'POST',
      body: { userId, paymentMethod: document.querySelector('#paymentMethod').value, items }
    });
    localStorage.setItem('lastOrderId', result.processed.id);
    setMessage('#checkoutMessage', `Order ${result.processed.id} confirmed. Status: ${result.processed.status}.`);
    setTimeout(() => {
      window.location.href = `/orders.html?userId=${encodeURIComponent(userId)}`;
    }, 700);
  });
}

// ─── Orders page ──────────────────────────────────────────────────────────────
async function loadOrdersPage() {
  const list = document.querySelector('#ordersList');
  if (!list) return;
  const session = requireAuth('user');
  if (!session) return;

  const userId = getUserId();
  const username = getUsername();

  // Show username not raw id
  const display = document.querySelector('#ordersUserDisplay');
  if (display) display.textContent = `Orders for: ${username}`;

  async function refresh() {
    const { orders } = await api(`/api/orders?userId=${encodeURIComponent(userId)}`);
    list.innerHTML = orders.length
      ? orders.map((o) => renderOrderCard(o)).join('')
      : '<p class="empty">No orders yet. Go order something!</p>';
  }
  await refresh();
  setInterval(refresh, 5000);
}

function renderOrderCard(order, admin = false) {
  return `
    <article class="order-card">
      <div>
        <p class="eyebrow">${order.status}</p>
        <h3>${order.id}</h3>
        <small class="order-user">👤 ${order.userId}</small>
      </div>
      <p>${order.items.map((item) => `${item.quantity} × ${item.name}`).join(', ')}</p>
      <strong>${money.format(order.total)}</strong>
      ${admin ? `
        <select data-status-for="${order.id}">
          ${['PROCESSING', 'COMPLETED', 'CANCELLED', 'FAILED'].map((status) => `<option value="${status}" ${order.status === status ? 'selected' : ''}>${status}</option>`).join('')}
        </select>
        <button class="button secondary" type="button" data-update-order="${order.id}">Update</button>
      ` : ''}
    </article>
  `;
}

// ─── Admin page ───────────────────────────────────────────────────────────────
async function loadAdminPage() {
  const adminRoot = document.querySelector('#adminRoot');
  if (!adminRoot) return;
  const session = requireAuth('admin');
  if (!session) return;

  const headers = () => ({ 'x-admin-key': 'admin123' });

  async function refreshAdmin() {
    const [catalog, orders, analytics] = await Promise.all([
      api('/api/catalog/coffees'),
      api('/api/admin/orders?activeOnly=true', { headers: headers() }),
      api('/api/admin/analytics/summary', { headers: headers() })
    ]);
    renderAdminCatalog(catalog.coffees, headers);
    renderAdminOrders(orders.orders, headers);
    renderAdminAnalytics(analytics.analytics);
    renderIcons();
  }

  document.querySelector('#itemForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    body.price = Number(body.price);
    body.stock = Number(body.stock || 100);
    try {
      await api('/api/admin/catalog/coffees', { method: 'POST', headers: headers(), body });
      event.currentTarget.reset();
      await refreshAdmin();
    } catch (error) {
      setMessage('#adminMessage', error.message);
    }
  });

  try {
    await refreshAdmin();
    setMessage('#adminMessage', 'Admin panel loaded.');
  } catch (err) {
    setMessage('#adminMessage', err.message);
  }
}

function renderAdminCatalog(items, headers) {
  const list = document.querySelector('#adminCatalog');
  if (!list) return;
  list.innerHTML = items.map((item) => `
    <article class="admin-row">
      <input value="${item.name}" data-field="name" data-item="${item.id}" aria-label="${item.name} name" />
      <input value="${item.category}" data-field="category" data-item="${item.id}" aria-label="${item.name} category" />
      <input type="number" step="0.01" value="${item.price}" data-field="price" data-item="${item.id}" aria-label="${item.name} price" />
      <input value="${item.description}" data-field="description" data-item="${item.id}" aria-label="${item.name} description" />
      <button class="button secondary" type="button" data-save-item="${item.id}">Save</button>
      <button class="button danger" type="button" data-delete-item="${item.id}">Delete</button>
    </article>
  `).join('');

  list.querySelectorAll('[data-save-item]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.dataset.saveItem;
      const fields = [...list.querySelectorAll(`[data-item="${id}"]`)];
      const body = Object.fromEntries(fields.map((field) => [field.dataset.field, field.type === 'number' ? Number(field.value) : field.value]));
      await api(`/api/admin/catalog/coffees/${id}`, { method: 'PUT', headers: headers(), body });
      setMessage('#adminMessage', 'Item updated.');
    });
  });

  list.querySelectorAll('[data-delete-item]').forEach((button) => {
    button.addEventListener('click', async () => {
      await api(`/api/admin/catalog/coffees/${button.dataset.deleteItem}`, { method: 'DELETE', headers: headers() });
      button.closest('.admin-row').remove();
      setMessage('#adminMessage', 'Item deleted.');
    });
  });
}

function renderAdminOrders(orders, headers) {
  const list = document.querySelector('#adminOrders');
  if (!list) return;
  list.innerHTML = orders.length
    ? orders.map((order) => renderOrderCard(order, true)).join('')
    : '<p class="empty">No active orders.</p>';
  list.querySelectorAll('[data-update-order]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.dataset.updateOrder;
      const status = list.querySelector(`[data-status-for="${id}"]`).value;
      await api(`/api/admin/orders/${id}/status`, { method: 'PATCH', headers: headers(), body: { status } });
      setMessage('#adminMessage', 'Order status updated.');
    });
  });
}

function renderAdminAnalytics(analytics) {
  // Stats strip
  const strip = document.querySelector('#adminAnalytics');
  if (strip) {
    strip.innerHTML = `
      <article><span data-icon="receipt"></span><p>Total Orders</p><strong>${analytics.totalOrders}</strong></article>
      <article><span data-icon="coins"></span><p>Revenue</p><strong>${money.format(analytics.totalRevenue)}</strong></article>
      <article><span data-icon="trending-up"></span><p>Avg Order</p><strong>${money.format(analytics.averageOrderValue)}</strong></article>
      <article><span data-icon="activity"></span><p>SLO Target</p><strong>${analytics.slo.latencyTargetMs} ms</strong></article>
    `;
  }

  // Top selling product
  const topSection = document.querySelector('#adminTopProduct');
  if (topSection && analytics.topCoffees && Object.keys(analytics.topCoffees).length) {
    const sorted = Object.entries(analytics.topCoffees).sort((a, b) => b[1] - a[1]);
    const [topName, topQty] = sorted[0];
    topSection.innerHTML = `
      <div class="top-product-card">
        <div class="top-product-crown">🏆</div>
        <div class="top-product-info">
          <p class="eyebrow">Best Seller</p>
          <h3>${topName}</h3>
          <p>${topQty} units sold</p>
        </div>
      </div>
      <div class="top-product-list">
        ${sorted.slice(0, 6).map(([name, qty], i) => `
          <div class="top-product-row">
            <span class="rank">#${i + 1}</span>
            <span class="name">${name}</span>
            <div class="bar-wrap"><div class="bar" style="width:${Math.round((qty / sorted[0][1]) * 100)}%"></div></div>
            <span class="qty">${qty}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Orders by status chart (simple bar chart via SVG)
  const chartSection = document.querySelector('#adminSalesChart');
  if (chartSection && analytics.byStatus) {
    renderStatusChart(chartSection, analytics.byStatus, analytics.totalOrders);
  }

  renderIcons();
}

function renderStatusChart(container, byStatus, total) {
  const statuses = ['PROCESSING', 'COMPLETED', 'CANCELLED', 'FAILED'];
  const colors = { PROCESSING: '#b4865f', COMPLETED: '#5b8a52', CANCELLED: '#999', FAILED: '#c0392b' };
  const data = statuses.map(s => ({ status: s, count: byStatus[s] || 0, color: colors[s] })).filter(d => d.count > 0);
  const max = Math.max(...data.map(d => d.count), 1);

  container.innerHTML = `
    <div class="chart-title">
      <p class="eyebrow">Order Breakdown</p>
      <h3>Orders by Status</h3>
    </div>
    <div class="bar-chart">
      ${data.map(d => `
        <div class="bar-chart-item">
          <div class="bar-chart-bar-wrap">
            <div class="bar-chart-bar" style="height:${Math.round((d.count / max) * 140)}px; background:${d.color};" title="${d.count}">
              <span class="bar-chart-val">${d.count}</span>
            </div>
          </div>
          <div class="bar-chart-label">${d.status}</div>
        </div>
      `).join('')}
    </div>
    <div class="chart-title" style="margin-top:2rem;">
      <p class="eyebrow">Revenue Over Time (mock)</p>
      <h3>Sales Trend</h3>
    </div>
    ${renderLineChart(total)}
  `;
}

function renderLineChart(totalOrders) {
  // Generate a plausible mock trend based on total orders
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const base = Math.max(1, Math.round(totalOrders / 7));
  const pts = days.map((d, i) => ({
    day: d,
    val: Math.max(0, base + Math.round(Math.sin(i * 1.2) * base * 0.6 + (Math.random() * base * 0.3)))
  }));
  const max = Math.max(...pts.map(p => p.val), 1);
  const W = 360, H = 120, pad = 20;
  const x = (i) => pad + (i / (pts.length - 1)) * (W - pad * 2);
  const y = (v) => H - pad - (v / max) * (H - pad * 2);
  const points = pts.map((p, i) => `${x(i)},${y(p.val)}`).join(' ');
  const areaPoints = `${x(0)},${H - pad} ${points} ${x(pts.length - 1)},${H - pad}`;

  return `
    <div class="line-chart-wrap">
      <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="line-chart-svg">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#b4865f" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#b4865f" stop-opacity="0.02"/>
          </linearGradient>
        </defs>
        <polygon points="${areaPoints}" fill="url(#areaGrad)" />
        <polyline points="${points}" fill="none" stroke="#b4865f" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
        ${pts.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.val)}" r="4" fill="#5b3522" />`).join('')}
        ${pts.map((p, i) => `<text x="${x(i)}" y="${H - 4}" text-anchor="middle" font-size="10" fill="#81746a">${p.day}</text>`).join('')}
      </svg>
    </div>
  `;
}

// ─── Init ─────────────────────────────────────────────────────────────────────
setupNav();
loadMenuPage().catch((error) => setMessage('#pageMessage', error.message));
loadCheckoutPage().catch((error) => setMessage('#checkoutMessage', error.message));
loadOrdersPage().catch((error) => setMessage('#ordersMessage', error.message));
loadAdminPage().catch((error) => setMessage('#adminMessage', error.message));

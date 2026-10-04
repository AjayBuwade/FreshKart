import { useState, useEffect } from 'react';

import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  IndianRupee,
  Wallet,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  Printer,
  Boxes,
  ChevronRight,
  Users,
  BarChart3,
  Settings as SettingsIcon,
  Search,
  RefreshCw,
  Save,
  Minus,
  UserCircle
} from 'lucide-react';

import { api, useApp } from './store.jsx';

/* =========================================================
   DASHBOARD
========================================================= */

function Dash() {
  const [s, setS] = useState(null);
  const [err, setErr] = useState('');

  const load = () => {
    setErr('');
    api('/admin/stats')
      .then(setS)
      .catch((e) => setErr(e.message));
  };

  useEffect(() => {
    load();
  }, []);

  if (!s) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <span>{err || 'Loading dashboard...'}</span>
      </div>
    );
  }

  const Card = ({ icon: Icon, title, value, description, type = '' }) => (
    <div className="admin-stat-card">
      <div className={`admin-stat-icon ${type}`}>
        <Icon size={21} strokeWidth={2} />
      </div>
      <div className="admin-stat-content">
        <span className="admin-stat-title">{title}</span>
        <strong className="admin-stat-value">{value}</strong>
        <small className="admin-stat-description">{description}</small>
      </div>
    </div>
  );

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">FreshKart Management</span>
          <h1>Dashboard</h1>
          <p>Monitor today's store activity and performance.</p>
        </div>
        <div className="admin-live-badge">
          <span></span>
          Store Live
        </div>
      </div>

      <div className="admin-stats-grid">
        <Card
          icon={ShoppingCart}
          title="Orders today"
          value={s.today.orders}
          description="Orders received today"
          type="orders"
        />
        <Card
          icon={IndianRupee}
          title="Sales today"
          value={`₹${s.today.sales}`}
          description="Today's total sales"
          type="sales"
        />
        <Card
          icon={Wallet}
          title="Cash to collect"
          value={`₹${s.cashToCollect}`}
          description="Pending cash collection"
          type="cash"
        />
        <Card
          icon={AlertTriangle}
          title="Low-stock items"
          value={s.low.length}
          description="Products needing attention"
          type="stock"
        />
      </div>

      <div className="admin-content-grid">
        <section className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h2>
                <TrendingUp size={19} />
                Top Products
              </h2>
              <p>Best selling products</p>
            </div>
            <div className="admin-panel-icon">
              <TrendingUp size={18} />
            </div>
          </div>

          <div className="admin-product-list">
            {s.top.length === 0 ? (
              <div className="admin-empty">No sales data available.</div>
            ) : (
              s.top.map((t, index) => (
                <div className="admin-product-row" key={t._id}>
                  <div className="admin-product-rank">{index + 1}</div>
                  <div className="admin-product-info">
                    <strong>{t._id}</strong>
                    <span>{t.qty} units sold</span>
                  </div>
                  <ChevronRight size={17} />
                </div>
              ))
            )}
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h2>
                <AlertTriangle size={19} />
                Low Stock
              </h2>
              <p>5 or fewer units remaining</p>
            </div>
            <div className="admin-panel-icon warning">
              <AlertTriangle size={18} />
            </div>
          </div>

          <div className="admin-product-list">
            {s.low.length === 0 ? (
              <div className="admin-empty">
                <CheckCircle2 size={28} />
                <span>All products have healthy stock.</span>
              </div>
            ) : (
              s.low.map((p) => (
                <div className="admin-product-row" key={p._id}>
                  <div className="admin-stock-icon">
                    <Boxes size={17} />
                  </div>
                  <div className="admin-product-info">
                    <strong>{p.name}</strong>
                    <span className="stock-warning-text">
                      Only {p.stock} left
                    </span>
                  </div>
                  <AlertTriangle size={17} className="stock-warning-icon" />
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/* =========================================================
   PRODUCTS
========================================================= */

const blank = {
  name: '',
  category: 'Vegetables',
  price: '',
  unit: 'kg',
  stock: '',
  image: '',
  active: true
};

function Prods() {
  const { cfg } = useApp();
  const [list, setList] = useState([]);
  const [f, setF] = useState(blank);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () =>
    api('/admin/products').then(setList).catch((e) => setErr(e.message));

  useEffect(() => {
    load();
  }, []);

  const set = (key) => (e) => {
    setF({
      ...f,
      [key]:
        e.target.type === 'checkbox' ? e.target.checked : e.target.value
    });
  };

  const save = async (e) => {
    e.preventDefault();
    setErr('');
    setSaving(true);

    try {
      await api('/admin/products' + (f._id ? '/' + f._id : ''), {
        method: f._id ? 'PUT' : 'POST',
        body: {
          ...f,
          price: Number(f.price),
          stock: Number(f.stock)
        }
      });

      setF(blank);
      await load();
    } catch (x) {
      setErr(x.message);
    } finally {
      setSaving(false);
    }
  };

  const patch = (p, body) =>
    api('/admin/products/' + p._id, {
      method: 'PUT',
      body
    }).then(load);

  return (
    <div className="admin-products">
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">Store Management</span>
          <h1>Products</h1>
          <p>Add, edit and manage your FreshKart products.</p>
        </div>
        <div className="admin-header-count">
          <Package size={18} />
          {list.length} Products
        </div>
      </div>

      <form onSubmit={save} className="admin-product-form">
        <div className="admin-form-heading">
          <div className="admin-form-icon">
            {f._id ? <Pencil size={19} /> : <Plus size={20} />}
          </div>
          <div>
            <h2>{f._id ? 'Edit Product' : 'Add New Product'}</h2>
            <p>
              {f._id
                ? 'Update product information'
                : 'Create a new product for your store'}
            </p>
          </div>
        </div>

        <div className="admin-form-grid">
          <div className="admin-field admin-field-large">
            <label>Product name</label>
            <input
              type="text"
              placeholder="e.g. Fresh Tomatoes"
              required
              value={f.name}
              onChange={set('name')}
            />
          </div>

          <div className="admin-field">
            <label>Category</label>
            <select value={f.category} onChange={set('category')}>
              {(cfg.categories || []).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="admin-field">
            <label>Price</label>
            <input
              type="number"
              min="0"
              placeholder="₹"
              required
              value={f.price}
              onChange={set('price')}
            />
          </div>

          <div className="admin-field">
            <label>Unit</label>
            <select value={f.unit} onChange={set('unit')}>
              {['kg', 'g', 'dozen', 'piece', 'litre', 'ml', 'pack', 'bottle', 'set', 'box', '5 kg'].map(
                (u) => (
                  <option key={u}>{u}</option>
                )
              )}
            </select>
          </div>

          <div className="admin-field">
            <label>Stock</label>
            <input
              type="number"
              min="0"
              placeholder="Available quantity"
              required
              value={f.stock}
              onChange={set('stock')}
            />
          </div>

          <div className="admin-field admin-field-large">
            <label>Image URL</label>
            <input
              type="text"
              placeholder="https://..."
              value={f.image || ''}
              onChange={set('image')}
            />
          </div>
        </div>

        <div className="admin-form-actions">
          {err && <div className="admin-form-error">{err}</div>}

          <div className="admin-form-buttons">
            {f._id && (
              <button
                type="button"
                className="admin-btn secondary"
                onClick={() => {
                  setF(blank);
                  setErr('');
                }}
              >
                <X size={17} />
                Cancel
              </button>
            )}

            <button className="admin-btn primary" disabled={saving}>
              {saving ? (
                'Saving...'
              ) : (
                <>
                  {f._id ? <Pencil size={17} /> : <Plus size={18} />}
                  {f._id ? 'Save Changes' : 'Add Product'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <section className="admin-table-panel">
        <div className="admin-table-header">
          <div>
            <h2>Product Inventory</h2>
            <p>Manage prices, stock and visibility.</p>
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>PRICE</th>
                <th>STOCK</th>
                <th>STATUS</th>
                <th className="text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div className="admin-table-product">
                      <div className="admin-table-image">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Package size={20} />
                        )}
                      </div>
                      <div>
                        <strong>{p.name}</strong>
                        <span>{p.category}</span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <input
                      className="admin-inline-input"
                      type="number"
                      defaultValue={p.price}
                      onBlur={(e) =>
                        +e.target.value !== p.price &&
                        patch(p, { price: +e.target.value })
                      }
                    />
                  </td>

                  <td>
                    <input
                      className="admin-inline-input"
                      type="number"
                      min="0"
                      defaultValue={p.stock}
                      onBlur={(e) =>
                        +e.target.value !== p.stock &&
                        patch(p, { stock: +e.target.value })
                      }
                    />
                  </td>

                  <td>
                    <label className="admin-switch">
                      <input
                        type="checkbox"
                        checked={p.active}
                        onChange={(e) =>
                          patch(p, { active: e.target.checked })
                        }
                      />
                      <span></span>
                      <small>{p.active ? 'Visible' : 'Hidden'}</small>
                    </label>
                  </td>

                  <td>
                    <div className="admin-table-actions">
                      <button
                        className="admin-icon-btn edit"
                        title="Edit"
                        onClick={() => {
                          setF({
                            ...p,
                            price: p.price,
                            stock: p.stock
                          });
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        className="admin-icon-btn delete"
                        title="Delete"
                        onClick={async () => {
                          if (!confirm(`Delete ${p.name}?`)) return;
                          try {
                            await api('/admin/products/' + p._id, {
                              method: 'DELETE'
                            });
                            await load();
                          } catch (e) {
                            setErr(e.message);
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   ORDERS
========================================================= */

const ST = [
  'Placed',
  'Confirmed',
  'Out for Delivery',
  'Delivered',
  'Cancelled'
];

function slip(o) {
  const w = window.open('');
  if (!w) return;

  const pre = w.document.createElement('pre');

  pre.textContent =
    `FreshKart — Order #${o._id.slice(-6).toUpperCase()}\n` +
    `${o.user?.name || ''} ${o.phone}\n` +
    `${o.address?.line || ''}, ${o.address?.pincode || ''}\n` +
    `Slot: ${o.slot}\n\n` +
    `${o.items
      .map(
        (i) =>
          `${i.name} x ${i.qty} ${i.unit} ₹${i.price * i.qty}`
      )
      .join('\n')}\n\n` +
    `Delivery: ₹${o.deliveryCharge}\n` +
    `COLLECT CASH: ₹${o.total}\n` +
    `Note: ${o.note || '-'}`;

  w.document.body.append(pre);
  w.print();
}

function Orders() {
  const [list, setList] = useState([]);
  const [st, setSt] = useState('');
  const [err, setErr] = useState('');

  const load = () =>
    api(
      '/admin/orders' +
        (st ? '?status=' + encodeURIComponent(st) : '')
    )
      .then(setList)
      .catch((e) => setErr(e.message));

  useEffect(() => {
    load();
  }, [st]);

  const upd = (o, body) =>
    api('/admin/orders/' + o._id, {
      method: 'PATCH',
      body
    })
      .then(load)
      .catch((e) => setErr(e.message));

  return (
    <div className="admin-orders">
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">Order Management</span>
          <h1>Orders</h1>
          <p>Track and manage customer orders.</p>
        </div>
        <div className="admin-header-count">
          <ShoppingCart size={18} />
          {list.length} Orders
        </div>
      </div>

      <div className="admin-order-toolbar">
        <div>
          <label>Filter orders</label>
          <select value={st} onChange={(e) => setSt(e.target.value)}>
            <option value="">All orders</option>
            {ST.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {err && <div className="admin-form-error order-error">{err}</div>}

      <div className="admin-order-list">
        {list.length === 0 ? (
          <div className="admin-empty orders-empty">
            <ShoppingCart size={34} />
            <strong>No orders found</strong>
            <span>Orders matching this filter will appear here.</span>
          </div>
        ) : (
          list.map((o) => (
            <div key={o._id} className="admin-order-card">
              <div className="admin-order-main">
                <div className="admin-order-id">
                  <span>ORDER</span>
                  <strong>#{o._id.slice(-6).toUpperCase()}</strong>
                </div>

                <div className="admin-order-customer">
                  <strong>{o.user?.name || 'Customer'}</strong>
                  <span>{o.phone}</span>
                  <span>
                    {o.address?.line}, {o.address?.pincode}
                  </span>
                </div>

                <div className="admin-order-total">
                  <span>Total</span>
                  <strong>₹{o.total}</strong>
                </div>
              </div>

              <div className="admin-order-items">
                <div className="admin-order-item-heading">
                  <Package size={16} />
                  Items
                </div>
                <p>
                  {o.items
                    .map((i) => `${i.name} × ${i.qty}`)
                    .join(', ')}
                </p>
                <small>Delivery slot: {o.slot}</small>
              </div>

              <div className="admin-order-actions">
                <select
                  value={o.status}
                  onChange={(e) =>
                    upd(o, { status: e.target.value })
                  }
                  className="admin-status-select"
                >
                  {ST.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>

                <label className="admin-cash-check">
                  <input
                    type="checkbox"
                    checked={!!o.cashCollected}
                    onChange={(e) =>
                      upd(o, {
                        cashCollected: e.target.checked
                      })
                    }
                  />
                  <span>Cash collected</span>
                </label>

                <button
                  className="admin-btn secondary small"
                  onClick={() => slip(o)}
                >
                  <Printer size={16} />
                  Print Slip
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* =========================================================
   CUSTOMERS
========================================================= */

function Customers() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    setErr('');

    try {
      const data = await api(
        '/admin/customers' +
          (q.trim()
            ? `?q=${encodeURIComponent(q.trim())}`
            : '')
      );
      setList(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="admin-section-page">
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">Customer Management</span>
          <h1>Customers</h1>
          <p>View registered customers and their purchase activity.</p>
        </div>
        <div className="admin-header-count">
          <Users size={18} />
          {list.length} Customers
        </div>
      </div>

      <div className="admin-panel" style={{ marginBottom: 18 }}>
        <div
          style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            alignItems: 'center'
          }}
        >
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <Search
              size={17}
              style={{
                position: 'absolute',
                left: 13,
                top: '50%',
                transform: 'translateY(-50%)',
                opacity: 0.55
              }}
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') load();
              }}
              placeholder="Search by name, phone or email"
              style={{
                width: '100%',
                padding: '11px 14px 11px 40px',
                border: '1px solid #d8e6d2',
                borderRadius: 12,
                outline: 'none'
              }}
            />
          </div>

          <button className="admin-btn primary" onClick={load}>
            <Search size={16} />
            Search
          </button>

          <button className="admin-btn secondary" onClick={() => { setQ(''); setTimeout(load, 0); }}>
            <RefreshCw size={16} />
            Reset
          </button>
        </div>
      </div>

      {err && <div className="admin-form-error">{err}</div>}

      <section className="admin-table-panel">
        <div className="admin-table-wrapper">
          {loading ? (
            <div className="admin-loading">
              <div className="admin-spinner"></div>
              <span>Loading customers...</span>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>CUSTOMER</th>
                  <th>PHONE</th>
                  <th>EMAIL</th>
                  <th>ORDERS</th>
                  <th>SPENT</th>
                  <th>JOINED</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <div className="admin-table-product">
                        <div className="admin-table-image">
                          <UserCircle size={21} />
                        </div>
                        <div>
                          <strong>{c.name || 'Customer'}</strong>
                          <span>{c.role || 'customer'}</span>
                        </div>
                      </div>
                    </td>
                    <td>{c.phone || '—'}</td>
                    <td>{c.email || '—'}</td>
                    <td>{c.orders || 0}</td>
                    <td>₹{Number(c.spent || 0).toFixed(0)}</td>
                    <td>
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleDateString('en-IN')
                        : '—'}
                    </td>
                  </tr>
                ))}

                {!list.length && (
                  <tr>
                    <td colSpan="6">
                      <div className="admin-empty">
                        No customers found.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   INVENTORY
========================================================= */

function Inventory() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      setList(await api('/admin/inventory'));
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStock = async (p, next) => {
    const value = Math.max(0, Number(next) || 0);
    setSavingId(p._id);

    try {
      const updated = await api('/admin/inventory/' + p._id, {
        method: 'PATCH',
        body: { stock: value }
      });

      setList((old) =>
        old.map((x) => (x._id === p._id ? updated : x))
      );
    } catch (e) {
      setErr(e.message);
    } finally {
      setSavingId('');
    }
  };

  const filtered = list.filter((p) => {
    const term = q.trim().toLowerCase();
    if (!term) return true;
    return (
      p.name?.toLowerCase().includes(term) ||
      p.category?.toLowerCase().includes(term)
    );
  });

  const low = list.filter((p) => p.stock <= 5).length;
  const out = list.filter((p) => p.stock <= 0).length;

  return (
    <div className="admin-section-page">
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">Stock Management</span>
          <h1>Inventory</h1>
          <p>Monitor stock and quickly update product quantities.</p>
        </div>
        <button className="admin-btn secondary" onClick={load}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div
        className="admin-stats-grid"
        style={{ marginBottom: 18 }}
      >
        <div className="admin-stat-card">
          <div className="admin-stat-icon orders">
            <Boxes size={21} />
          </div>
          <div className="admin-stat-content">
            <span className="admin-stat-title">Total products</span>
            <strong className="admin-stat-value">{list.length}</strong>
            <small className="admin-stat-description">Inventory items</small>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon stock">
            <AlertTriangle size={21} />
          </div>
          <div className="admin-stat-content">
            <span className="admin-stat-title">Low stock</span>
            <strong className="admin-stat-value">{low}</strong>
            <small className="admin-stat-description">5 or fewer units</small>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon cash">
            <Package size={21} />
          </div>
          <div className="admin-stat-content">
            <span className="admin-stat-title">Out of stock</span>
            <strong className="admin-stat-value">{out}</strong>
            <small className="admin-stat-description">Needs restocking</small>
          </div>
        </div>
      </div>

      {err && <div className="admin-form-error">{err}</div>}

      <section className="admin-table-panel">
        <div className="admin-table-header">
          <div>
            <h2>Stock Control</h2>
            <p>Use + and − or enter an exact quantity.</p>
          </div>

          <div style={{ minWidth: 240 }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products..."
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d8e6d2',
                borderRadius: 10
              }}
            />
          </div>
        </div>

        <div className="admin-table-wrapper">
          {loading ? (
            <div className="admin-loading">
              <div className="admin-spinner"></div>
              <span>Loading inventory...</span>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>PRODUCT</th>
                  <th>CATEGORY</th>
                  <th>STOCK</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div className="admin-table-product">
                        <div className="admin-table-image">
                          {p.image ? (
                            <img src={p.image} alt={p.name} />
                          ) : (
                            <Package size={20} />
                          )}
                        </div>
                        <div>
                          <strong>{p.name}</strong>
                          <span>₹{p.price} / {p.unit}</span>
                        </div>
                      </div>
                    </td>
                    <td>{p.category}</td>
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 7
                        }}
                      >
                        <button
                          className="admin-icon-btn edit"
                          disabled={savingId === p._id || p.stock <= 0}
                          onClick={() =>
                            updateStock(p, p.stock - 1)
                          }
                        >
                          <Minus size={15} />
                        </button>

                        <input
                          className="admin-inline-input"
                          type="number"
                          min="0"
                          value={p.stock}
                          onChange={(e) =>
                            setList((old) =>
                              old.map((x) =>
                                x._id === p._id
                                  ? { ...x, stock: e.target.value }
                                  : x
                              )
                            )
                          }
                          onBlur={(e) =>
                            updateStock(p, e.target.value)
                          }
                          style={{ width: 70 }}
                        />

                        <button
                          className="admin-icon-btn edit"
                          disabled={savingId === p._id}
                          onClick={() =>
                            updateStock(p, Number(p.stock) + 1)
                          }
                        >
                          <Plus size={15} />
                        </button>
                      </div>
                    </td>
                    <td>
                      {p.stock <= 0 ? (
                        <span className="stock-warning-text">Out of stock</span>
                      ) : p.stock <= 5 ? (
                        <span className="stock-warning-text">
                          Only {p.stock} left
                        </span>
                      ) : (
                        <span style={{ color: '#0A472E', fontWeight: 700 }}>
                          In stock
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {!filtered.length && (
                  <tr>
                    <td colSpan="4">
                      <div className="admin-empty">
                        No inventory items found.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   REPORTS
========================================================= */

function Reports() {
  const [r, setR] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      setR(await api('/admin/reports'));
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading && !r) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <span>Loading reports...</span>
      </div>
    );
  }

  if (err && !r) {
    return <div className="admin-form-error">{err}</div>;
  }

  const summary = r?.summary || {
    orders: 0,
    sales: 0,
    avgOrder: 0
  };

  return (
    <div className="admin-section-page">
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">Business Analytics</span>
          <h1>Reports</h1>
          <p>Review the last 7 days of FreshKart performance.</p>
        </div>

        <button className="admin-btn secondary" onClick={load}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {err && <div className="admin-form-error">{err}</div>}

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon orders">
            <ShoppingCart size={21} />
          </div>
          <div className="admin-stat-content">
            <span className="admin-stat-title">7-day orders</span>
            <strong className="admin-stat-value">{summary.orders}</strong>
            <small className="admin-stat-description">Completed/active orders</small>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon sales">
            <IndianRupee size={21} />
          </div>
          <div className="admin-stat-content">
            <span className="admin-stat-title">7-day sales</span>
            <strong className="admin-stat-value">
              ₹{Number(summary.sales || 0).toFixed(0)}
            </strong>
            <small className="admin-stat-description">Total order value</small>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon cash">
            <Wallet size={21} />
          </div>
          <div className="admin-stat-content">
            <span className="admin-stat-title">Average order</span>
            <strong className="admin-stat-value">
              ₹{Number(summary.avgOrder || 0).toFixed(0)}
            </strong>
            <small className="admin-stat-description">Average basket value</small>
          </div>
        </div>
      </div>

      <div className="admin-content-grid">
        <section className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h2>
                <BarChart3 size={19} />
                Daily Sales
              </h2>
              <p>Last 7 days</p>
            </div>
          </div>

          <div className="admin-product-list">
            {(r?.daily || []).map((d) => (
              <div className="admin-product-row" key={d._id}>
                <div className="admin-product-info">
                  <strong>{d._id}</strong>
                  <span>{d.orders} orders</span>
                </div>
                <strong>₹{Number(d.sales || 0).toFixed(0)}</strong>
              </div>
            ))}

            {!r?.daily?.length && (
              <div className="admin-empty">No sales data available.</div>
            )}
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h2>
                <TrendingUp size={19} />
                Best Products
              </h2>
              <p>Top 10 by quantity sold</p>
            </div>
          </div>

          <div className="admin-product-list">
            {(r?.topProducts || []).map((p, index) => (
              <div className="admin-product-row" key={p._id}>
                <div className="admin-product-rank">{index + 1}</div>
                <div className="admin-product-info">
                  <strong>{p._id}</strong>
                  <span>{p.qty} units sold</span>
                </div>
                <strong>₹{Number(p.sales || 0).toFixed(0)}</strong>
              </div>
            ))}

            {!r?.topProducts?.length && (
              <div className="admin-empty">No product sales data.</div>
            )}
          </div>
        </section>
      </div>

      <section className="admin-table-panel" style={{ marginTop: 18 }}>
        <div className="admin-table-header">
          <div>
            <h2>Order Status Summary</h2>
            <p>All order statuses</p>
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>STATUS</th>
                <th>ORDERS</th>
              </tr>
            </thead>
            <tbody>
              {(r?.statuses || []).map((x) => (
                <tr key={x._id}>
                  <td>{x._id}</td>
                  <td>{x.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   SETTINGS
========================================================= */

function Settings() {
  const [form, setForm] = useState({
    storeName: '',
    storePhone: '',
    minOrder: 150,
    deliveryCharge: 30,
    freeAbove: 500,
    pincodes: [],
    slots: []
  });

  const [pincodeText, setPincodeText] = useState('');
  const [slotText, setSlotText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    setErr('');

    try {
      const s = await api('/admin/settings');

      setForm({
        storeName: s.storeName || 'FreshKart',
        storePhone: s.storePhone || '',
        minOrder: s.minOrder ?? 150,
        deliveryCharge: s.deliveryCharge ?? 30,
        freeAbove: s.freeAbove ?? 500,
        pincodes: s.pincodes || [],
        slots: s.slots || []
      });
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    setMessage('');

    try {
      await api('/admin/settings', {
        method: 'PUT',
        body: {
          ...form,
          minOrder: Number(form.minOrder),
          deliveryCharge: Number(form.deliveryCharge),
          freeAbove: Number(form.freeAbove)
        }
      });

      setMessage('Settings saved successfully.');
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const addPincode = () => {
    const value = pincodeText.trim();
    if (!value) return;

    if (!form.pincodes.includes(value)) {
      setForm({
        ...form,
        pincodes: [...form.pincodes, value]
      });
    }

    setPincodeText('');
  };

  const addSlot = () => {
    const value = slotText.trim();
    if (!value) return;

    if (!form.slots.includes(value)) {
      setForm({
        ...form,
        slots: [...form.slots, value]
      });
    }

    setSlotText('');
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <span>Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="admin-section-page">
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">Store Configuration</span>
          <h1>Settings</h1>
          <p>Manage store information, delivery charges and service areas.</p>
        </div>
      </div>

      {err && <div className="admin-form-error">{err}</div>}
      {message && (
        <div
          style={{
            padding: '12px 14px',
            marginBottom: 16,
            borderRadius: 10,
            background: '#eaf7ea',
            color: '#0A472E',
            fontWeight: 700
          }}
        >
          <CheckCircle2 size={17} style={{ verticalAlign: 'middle', marginRight: 7 }} />
          {message}
        </div>
      )}

      <form onSubmit={save} className="admin-product-form">
        <div className="admin-form-heading">
          <div className="admin-form-icon">
            <SettingsIcon size={20} />
          </div>
          <div>
            <h2>Store Settings</h2>
            <p>These values are used by checkout and delivery configuration.</p>
          </div>
        </div>

        <div className="admin-form-grid">
          <div className="admin-field admin-field-large">
            <label>Store name</label>
            <input
              value={form.storeName}
              onChange={(e) =>
                setForm({ ...form, storeName: e.target.value })
              }
              required
            />
          </div>

          <div className="admin-field">
            <label>Store phone</label>
            <input
              value={form.storePhone}
              onChange={(e) =>
                setForm({ ...form, storePhone: e.target.value })
              }
              placeholder="10-digit phone"
            />
          </div>

          <div className="admin-field">
            <label>Minimum order ₹</label>
            <input
              type="number"
              min="0"
              value={form.minOrder}
              onChange={(e) =>
                setForm({ ...form, minOrder: e.target.value })
              }
            />
          </div>

          <div className="admin-field">
            <label>Delivery charge ₹</label>
            <input
              type="number"
              min="0"
              value={form.deliveryCharge}
              onChange={(e) =>
                setForm({
                  ...form,
                  deliveryCharge: e.target.value
                })
              }
            />
          </div>

          <div className="admin-field">
            <label>Free delivery above ₹</label>
            <input
              type="number"
              min="0"
              value={form.freeAbove}
              onChange={(e) =>
                setForm({
                  ...form,
                  freeAbove: e.target.value
                })
              }
            />
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
            gap: 18,
            marginTop: 20
          }}
        >
          <div className="admin-panel">
            <h3 style={{ marginTop: 0 }}>Delivery pincodes</h3>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={pincodeText}
                onChange={(e) => setPincodeText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addPincode();
                  }
                }}
                placeholder="e.g. 480334"
                style={{
                  flex: 1,
                  padding: 10,
                  border: '1px solid #d8e6d2',
                  borderRadius: 9
                }}
              />
              <button
                type="button"
                className="admin-btn primary"
                onClick={addPincode}
              >
                <Plus size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {form.pincodes.map((p) => (
                <span
                  key={p}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '7px 9px',
                    borderRadius: 20,
                    background: '#f1ffef',
                    color: '#0A472E',
                    fontWeight: 700
                  }}
                >
                  {p}
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        pincodes: form.pincodes.filter((x) => x !== p)
                      })
                    }
                    style={{
                      border: 0,
                      background: 'transparent',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="admin-panel">
            <h3 style={{ marginTop: 0 }}>Delivery slots</h3>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={slotText}
                onChange={(e) => setSlotText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSlot();
                  }
                }}
                placeholder="e.g. 8-10 AM"
                style={{
                  flex: 1,
                  padding: 10,
                  border: '1px solid #d8e6d2',
                  borderRadius: 9
                }}
              />
              <button
                type="button"
                className="admin-btn primary"
                onClick={addSlot}
              >
                <Plus size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {form.slots.map((slot) => (
                <span
                  key={slot}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '7px 9px',
                    borderRadius: 20,
                    background: '#f1ffef',
                    color: '#0A472E',
                    fontWeight: 700
                  }}
                >
                  {slot}
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        slots: form.slots.filter((x) => x !== slot)
                      })
                    }
                    style={{
                      border: 0,
                      background: 'transparent',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="admin-form-actions">
          <div className="admin-form-buttons">
            <button
              type="button"
              className="admin-btn secondary"
              onClick={load}
              disabled={saving}
            >
              <RefreshCw size={16} />
              Reset
            </button>

            <button
              className="admin-btn primary"
              disabled={saving}
            >
              <Save size={17} />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

/* =========================================================
   ADMIN APP
========================================================= */

export default function Admin() {
  const { logout } = useApp();
  const [tab, setTab] = useState('dash');

  const tabs = [
    { key: 'dash', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'prod', label: 'Products', icon: Package },
    { key: 'ord', label: 'Orders', icon: ShoppingCart },
    { key: 'customers', label: 'Customers', icon: Users },
    { key: 'inventory', label: 'Inventory', icon: Boxes },
    { key: 'reports', label: 'Reports', icon: BarChart3 },
    { key: 'settings', label: 'Settings', icon: SettingsIcon }
  ];

  const renderPage = () => {
    if (tab === 'dash') return <Dash />;
    if (tab === 'prod') return <Prods />;
    if (tab === 'ord') return <Orders />;
    if (tab === 'customers') return <Customers />;
    if (tab === 'inventory') return <Inventory />;
    if (tab === 'reports') return <Reports />;
    if (tab === 'settings') return <Settings />;
    return <Dash />;
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <div className="admin-logo">FK</div>
          <div>
            <strong>FreshKart</strong>
            <span>Admin Panel</span>
          </div>
        </div>

        <div className="admin-sidebar-label">MANAGEMENT</div>

        <nav className="admin-nav">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={
                'admin-nav-item ' +
                (tab === key ? 'active' : '')
              }
              onClick={() => setTab(key)}
            >
              <Icon size={18} />
              <span>{label}</span>

              {tab === key && (
                <ChevronRight
                  size={16}
                  className="admin-nav-arrow"
                />
              )}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-status">
            <span></span>
            System operational
          </div>

          <button
            type="button"
            className="admin-nav-item"
            onClick={logout}
            style={{ marginTop: 10 }}
          >
            <X size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">{renderPage()}</main>
    </div>
  );
}

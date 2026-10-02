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
  ChevronRight
} from 'lucide-react';

import { api, useApp } from './store.jsx';

/* =========================================================
   DASHBOARD
========================================================= */

function Dash() {
  const [s, setS] = useState(null);

  useEffect(() => {
    api('/admin/stats').then(setS);
  }, []);

  if (!s) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <span>Loading dashboard...</span>
      </div>
    );
  }

  const Card = ({
    icon: Icon,
    title,
    value,
    description,
    type = ''
  }) => (
    <div className="admin-stat-card">
      <div className={`admin-stat-icon ${type}`}>
        <Icon size={21} strokeWidth={2} />
      </div>

      <div className="admin-stat-content">
        <span className="admin-stat-title">
          {title}
        </span>

        <strong className="admin-stat-value">
          {value}
        </strong>

        <small className="admin-stat-description">
          {description}
        </small>
      </div>
    </div>
  );

  return (
    <div className="admin-dashboard">

      {/* PAGE HEADER */}
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">
            FreshKart Management
          </span>

          <h1>
            Dashboard
          </h1>

          <p>
            Monitor today's store activity and performance.
          </p>
        </div>

        <div className="admin-live-badge">
          <span></span>
          Store Live
        </div>
      </div>

      {/* STATS */}
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

      {/* CONTENT GRID */}
      <div className="admin-content-grid">

        {/* TOP PRODUCTS */}
        <section className="admin-panel">

          <div className="admin-panel-header">
            <div>
              <h2>
                <TrendingUp size={19} />
                Top Products
              </h2>

              <p>
                Best selling products
              </p>
            </div>

            <div className="admin-panel-icon">
              <TrendingUp size={18} />
            </div>
          </div>

          <div className="admin-product-list">

            {s.top.length === 0 ? (
              <div className="admin-empty">
                No sales data available.
              </div>
            ) : (
              s.top.map((t, index) => (
                <div
                  className="admin-product-row"
                  key={t._id}
                >
                  <div className="admin-product-rank">
                    {index + 1}
                  </div>

                  <div className="admin-product-info">
                    <strong>
                      {t._id}
                    </strong>

                    <span>
                      {t.qty} units sold
                    </span>
                  </div>

                  <ChevronRight size={17} />
                </div>
              ))
            )}

          </div>

        </section>

        {/* LOW STOCK */}
        <section className="admin-panel">

          <div className="admin-panel-header">
            <div>
              <h2>
                <AlertTriangle size={19} />
                Low Stock
              </h2>

              <p>
                5 or fewer units remaining
              </p>
            </div>

            <div className="admin-panel-icon warning">
              <AlertTriangle size={18} />
            </div>
          </div>

          <div className="admin-product-list">

            {s.low.length === 0 ? (
              <div className="admin-empty">
                <CheckCircle2 size={28} />
                <span>
                  All products have healthy stock.
                </span>
              </div>
            ) : (
              s.low.map((p) => (
                <div
                  className="admin-product-row"
                  key={p._id}
                >
                  <div className="admin-stock-icon">
                    <Boxes size={17} />
                  </div>

                  <div className="admin-product-info">
                    <strong>
                      {p.name}
                    </strong>

                    <span className="stock-warning-text">
                      Only {p.stock} left
                    </span>
                  </div>

                  <AlertTriangle
                    size={17}
                    className="stock-warning-icon"
                  />
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
    api('/admin/products').then(setList);

  useEffect(() => {
    load();
  }, []);

  const set = (key) => (e) => {
    setF({
      ...f,
      [key]:
        e.target.type === 'checkbox'
          ? e.target.checked
          : e.target.value
    });
  };

  const save = async (e) => {
    e.preventDefault();

    setErr('');
    setSaving(true);

    try {
      await api(
        '/admin/products' +
          (f._id ? '/' + f._id : ''),
        {
          method: f._id ? 'PUT' : 'POST',
          body: f
        }
      );

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

      {/* HEADER */}
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">
            Store Management
          </span>

          <h1>
            Products
          </h1>

          <p>
            Add, edit and manage your FreshKart products.
          </p>
        </div>

        <div className="admin-header-count">
          <Package size={18} />
          {list.length} Products
        </div>
      </div>

      {/* FORM */}
      <form
        onSubmit={save}
        className="admin-product-form"
      >
        <div className="admin-form-heading">
          <div className="admin-form-icon">
            {f._id ? (
              <Pencil size={19} />
            ) : (
              <Plus size={20} />
            )}
          </div>

          <div>
            <h2>
              {f._id
                ? 'Edit Product'
                : 'Add New Product'}
            </h2>

            <p>
              {f._id
                ? 'Update product information'
                : 'Create a new product for your store'}
            </p>
          </div>
        </div>

        <div className="admin-form-grid">

          <div className="admin-field admin-field-large">
            <label>
              Product name
            </label>

            <input
              type="text"
              placeholder="e.g. Fresh Tomatoes"
              required
              value={f.name}
              onChange={set('name')}
            />
          </div>

          <div className="admin-field">
            <label>
              Category
            </label>

            <select
              value={f.category}
              onChange={set('category')}
            >
              {cfg.categories.map((c) => (
                <option key={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-field">
            <label>
              Price
            </label>

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
            <label>
              Unit
            </label>

            <select
              value={f.unit}
              onChange={set('unit')}
            >
              {[
                'kg',
                'g',
                'dozen',
                'piece',
                'litre',
                'ml',
                'pack',
                'bottle',
                'set',
                'box',
                '5 kg'
              ].map((u) => (
                <option key={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-field">
            <label>
              Stock
            </label>

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
            <label>
              Image URL
            </label>

            <input
              type="text"
              placeholder="https://..."
              value={f.image || ''}
              onChange={set('image')}
            />
          </div>

        </div>

        <div className="admin-form-actions">

          {err && (
            <div className="admin-form-error">
              {err}
            </div>
          )}

          <div className="admin-form-buttons">

            {f._id && (
              <button
                type="button"
                className="admin-btn secondary"
                onClick={() => setF(blank)}
              >
                <X size={17} />
                Cancel
              </button>
            )}

            <button
              className="admin-btn primary"
              disabled={saving}
            >
              {saving ? (
                'Saving...'
              ) : (
                <>
                  {f._id ? (
                    <Pencil size={17} />
                  ) : (
                    <Plus size={18} />
                  )}

                  {f._id
                    ? 'Save Changes'
                    : 'Add Product'}
                </>
              )}
            </button>

          </div>
        </div>
      </form>

      {/* PRODUCT TABLE */}
      <section className="admin-table-panel">

        <div className="admin-table-header">
          <div>
            <h2>
              Product Inventory
            </h2>

            <p>
              Manage prices, stock and visibility.
            </p>
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
                <th className="text-right">
                  ACTIONS
                </th>
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
                              e.currentTarget.style.display =
                                'none';
                            }}
                          />
                        ) : (
                          <Package size={20} />
                        )}

                      </div>

                      <div>
                        <strong>
                          {p.name}
                        </strong>

                        <span>
                          {p.category}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <input
                      className="admin-inline-input"
                      type="number"
                      defaultValue={p.price}
                      onBlur={(e) =>
                        +e.target.value !==
                          p.price &&
                        patch(p, {
                          price:
                            +e.target.value
                        })
                      }
                    />
                  </td>

                  <td>
                    <input
                      className="admin-inline-input"
                      type="number"
                      defaultValue={p.stock}
                      onBlur={(e) =>
                        +e.target.value !==
                          p.stock &&
                        patch(p, {
                          stock:
                            +e.target.value
                        })
                      }
                    />
                  </td>

                  <td>
                    <label className="admin-switch">

                      <input
                        type="checkbox"
                        checked={p.active}
                        onChange={(e) =>
                          patch(p, {
                            active:
                              e.target.checked
                          })
                        }
                      />

                      <span></span>

                      <small>
                        {p.active
                          ? 'Visible'
                          : 'Hidden'}
                      </small>

                    </label>
                  </td>

                  <td>
                    <div className="admin-table-actions">

                      <button
                        className="admin-icon-btn edit"
                        title="Edit"
                        onClick={() => {
                          setF(p);
                          window.scrollTo({
                            top: 0,
                            behavior: 'smooth'
                          });
                        }}
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        className="admin-icon-btn delete"
                        title="Delete"
                        onClick={() =>
                          confirm(
                            'Delete ' +
                              p.name +
                              '?'
                          ) &&
                          api(
                            '/admin/products/' +
                              p._id,
                            {
                              method: 'DELETE'
                            }
                          ).then(load)
                        }
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

  const pre = w.document.createElement('pre');

  pre.textContent =
    `FreshKart — Order #${o._id
      .slice(-6)
      .toUpperCase()}\n` +
    `${o.user?.name || ''} ${o.phone}\n` +
    `${o.address.line}, ${o.address.pincode}\n` +
    `Slot: ${o.slot}\n\n` +
    `${o.items
      .map(
        (i) =>
          `${i.name}  x ${i.qty} ${i.unit}  ₹${
            i.price * i.qty
          }`
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
        (st
          ? '?status=' +
            encodeURIComponent(st)
          : '')
    ).then(setList);

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

      {/* HEADER */}
      <div className="admin-page-header">

        <div>
          <span className="admin-eyebrow">
            Order Management
          </span>

          <h1>
            Orders
          </h1>

          <p>
            Track and manage customer orders.
          </p>
        </div>

        <div className="admin-header-count">
          <ShoppingCart size={18} />
          {list.length} Orders
        </div>

      </div>

      {/* FILTER */}
      <div className="admin-order-toolbar">

        <div>
          <label>
            Filter orders
          </label>

          <select
            value={st}
            onChange={(e) =>
              setSt(e.target.value)
            }
          >
            <option value="">
              All orders
            </option>

            {ST.map((s) => (
              <option key={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

      </div>

      {err && (
        <div className="admin-form-error order-error">
          {err}
        </div>
      )}

      {/* ORDERS */}
      <div className="admin-order-list">

        {list.length === 0 ? (
          <div className="admin-empty orders-empty">
            <ShoppingCart size={34} />
            <strong>
              No orders found
            </strong>
            <span>
              Orders matching this filter will appear here.
            </span>
          </div>
        ) : (
          list.map((o) => (
            <div
              key={o._id}
              className="admin-order-card"
            >

              <div className="admin-order-main">

                <div className="admin-order-id">
                  <span>
                    ORDER
                  </span>

                  <strong>
                    #
                    {o._id
                      .slice(-6)
                      .toUpperCase()}
                  </strong>
                </div>

                <div className="admin-order-customer">
                  <strong>
                    {o.user?.name}
                  </strong>

                  <span>
                    {o.phone}
                  </span>

                  <span>
                    {o.address.line},{' '}
                    {o.address.pincode}
                  </span>
                </div>

                <div className="admin-order-total">
                  <span>
                    Total
                  </span>

                  <strong>
                    ₹{o.total}
                  </strong>
                </div>

              </div>

              <div className="admin-order-items">

                <div className="admin-order-item-heading">
                  <Package size={16} />
                  Items
                </div>

                <p>
                  {o.items
                    .map(
                      (i) =>
                        `${i.name} × ${i.qty}`
                    )
                    .join(', ')}
                </p>

                <small>
                  Delivery slot: {o.slot}
                </small>

              </div>

              <div className="admin-order-actions">

                <select
                  value={o.status}
                  onChange={(e) =>
                    upd(o, {
                      status:
                        e.target.value
                    })
                  }
                  className="admin-status-select"
                >
                  {ST.map((s) => (
                    <option key={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <label className="admin-cash-check">

                  <input
                    type="checkbox"
                    checked={o.cashCollected}
                    onChange={(e) =>
                      upd(o, {
                        cashCollected:
                          e.target.checked
                      })
                    }
                  />

                  <span>
                    Cash collected
                  </span>

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
   ADMIN APP
========================================================= */

export default function Admin() {
  const [tab, setTab] = useState('dash');

  const tabs = [
    {
      key: 'dash',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      key: 'prod',
      label: 'Products',
      icon: Package
    },
    {
      key: 'ord',
      label: 'Orders',
      icon: ShoppingCart
    }
  ];

  return (
    <div className="admin-shell">

      {/* SIDEBAR */}
      <aside className="admin-sidebar">

        <div className="admin-sidebar-brand">

          <div className="admin-logo">
            FK
          </div>

          <div>
            <strong>
              FreshKart
            </strong>

            <span>
              Admin Panel
            </span>
          </div>

        </div>

        <div className="admin-sidebar-label">
          MANAGEMENT
        </div>

        <nav className="admin-nav">

          {tabs.map(
            ({
              key,
              label,
              icon: Icon
            }) => (
              <button
                key={key}
                className={
                  'admin-nav-item ' +
                  (tab === key
                    ? 'active'
                    : '')
                }
                onClick={() =>
                  setTab(key)
                }
              >
                <Icon size={18} />

                <span>
                  {label}
                </span>

                {tab === key && (
                  <ChevronRight
                    size={16}
                    className="admin-nav-arrow"
                  />
                )}
              </button>
            )
          )}

        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-status">
            <span></span>
            System operational
          </div>
        </div>

      </aside>

      {/* MAIN */}
      <main className="admin-main">

        {tab === 'dash' && <Dash />}

        {tab === 'prod' && <Prods />}

        {tab === 'ord' && <Orders />}

      </main>

    </div>
  );
}
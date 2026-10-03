import {
  Routes,
  Route,
  Link,
  Navigate
} from 'react-router-dom';

import { useEffect } from 'react';

import { useApp } from './store.jsx';

import {
  Home,
  Auth,
  Cart,
  Checkout,
  MyOrders,
  Profile,
  Page
} from './pages.jsx';

import Admin from './Admin.jsx';
import Navbar from './components/Navbar.jsx';

const Guard = ({ role, children }) => {
  const { user, ready } = useApp();

  if (!ready) {
    return (
      <div className="app-loading">
        <div className="loading-orb"></div>
        <span>Loading FreshKart…</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" />;
  }

  return children;
};

export default function App() {

  const { cart, total, user } = useApp();

  useEffect(() => {
    document.documentElement.classList.add(
      'fk-app-ready'
    );

    return () => {
      document.documentElement.classList.remove(
        'fk-app-ready'
      );
    };
  }, []);

  const n = cart.reduce(
    (sum, item) => sum + (item.qty || 0),
    0
  );

  const isAdmin = user?.role === 'admin';

  return (
    <>
      {/* Customer Navbar - hidden for Admin */}
      {!isAdmin && <Navbar />}

      <Routes>
        {/* Customer Routes */}
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Auth />} />

        <Route path="/cart" element={<Cart />} />

        <Route
          path="/checkout"
          element={
            <Guard>
              <Checkout />
            </Guard>
          }
        />

        <Route
          path="/orders"
          element={
            <Guard>
              <MyOrders />
            </Guard>
          }
        />

        <Route
          path="/profile"
          element={
            <Guard>
              <Profile />
            </Guard>
          }
        />

        {/* Admin Route */}
        <Route
          path="/admin"
          element={
            <Guard role="admin">
              <Admin />
            </Guard>
          }
        />

        {/* Product / Other Pages */}
        <Route
          path="/p/:slug"
          element={<Page />}
        />
      </Routes>

      {/* Customer Cart Bar - hidden for Admin */}
      {!isAdmin && n > 0 && (
        <Link
          to="/cart"
          className="cartbar btn btn-cta rounded-0 py-3"
        >
          View cart ({n} items) · ₹{total.toFixed(0)}
          <span>→</span>
        </Link>
      )}
    </>
  );
}


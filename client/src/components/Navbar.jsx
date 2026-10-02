import { useEffect, useState } from 'react';
import {
  Link,
  useLocation,
  useNavigate
} from 'react-router-dom';

import {
  Search,
  ShoppingCart,
  User,
  Package,
  Heart,
  LogOut,
  Menu,
  X,
  ChevronRight,
  LayoutDashboard,
  Home,
  Layers,
  UtensilsCrossed,
  Settings,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

import { useApp } from '../store.jsx';

export default function Navbar() {
  const {
    user,
    logout,
    cart,
    wishlist
  } = useApp();

  const navigate = useNavigate();
  const location = useLocation();

  const [q, setQ] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  const cartCount = cart.reduce(
    (sum, item) => sum + (item.qty || 0),
    0
  );

  const wishlistCount = wishlist.length;

  /*
   * Add/remove a class on body so the desktop sidebar
   * can create proper space for the main website content.
   */
  useEffect(() => {
    document.body.classList.add('fk-has-sidebar');

    if (sidebarCollapsed) {
      document.body.classList.add(
        'fk-sidebar-collapsed'
      );
    } else {
      document.body.classList.remove(
        'fk-sidebar-collapsed'
      );
    }

    return () => {
      document.body.classList.remove(
        'fk-has-sidebar'
      );

      document.body.classList.remove(
        'fk-sidebar-collapsed'
      );
    };
  }, [sidebarCollapsed]);

  const search = (e) => {
    e.preventDefault();

    if (!q.trim()) return;

    setMobileOpen(false);

    navigate(
      `/?q=${encodeURIComponent(q.trim())}`
    );
  };

  const go = (path) => {
    setMobileOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/');
  };

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }

    return location.pathname === path;
  };

  return (
    <>
      {/* =====================================================
          TOP STRIP
      ===================================================== */}

      <div className="top-strip">
        <div className="container top-strip-inner">

          <span>
            Fresh prices • Trusted essentials •
            Delivered across Pandhurna
          </span>

          <span className="top-strip-right">
            Cash on Delivery available
          </span>

        </div>
      </div>


      {/* =====================================================
          MAIN NAVBAR
      ===================================================== */}

      <nav className="fk-nav fk-main-navbar sticky-top">

        <div className="container fk-navbar-inner">

          {/* BRAND */}

          <Link
            className="fk-brand"
            to="/"
            onClick={() =>
              setMobileOpen(false)
            }
          >
            <span className="brand-mark">
              FK
            </span>

            <span className="fk-brand-text">
              <strong>Fresh</strong>Kart
              <small>MARKET</small>
            </span>
          </Link>


          {/* DESKTOP SEARCH */}

          <form
            className="fk-search"
            onSubmit={search}
          >
            <Search
              size={19}
              strokeWidth={2}
              aria-hidden="true"
            />

            <input
              aria-label="Search products"
              placeholder="Search groceries, electronics, household items..."
              value={q}
              onChange={(e) =>
                setQ(e.target.value)
              }
            />

            {q && (
              <button
                type="button"
                className="fk-search-clear"
                onClick={() => setQ('')}
                aria-label="Clear search"
              >
                <X size={17} />
              </button>
            )}

            <button
              type="submit"
              className="fk-search-submit"
            >
              Search
            </button>
          </form>


          {/* DESKTOP ACTIONS */}

          <div className="fk-nav-actions">

            <Link
              className="fk-nav-item"
              to="/p/about"
            >
              About
            </Link>

            <Link
              className="fk-nav-item"
              to="/p/contact"
            >
              Contact
            </Link>

            <Link
              className="fk-nav-icon"
              to="/cart"
              aria-label="Shopping cart"
            >
              <ShoppingCart size={21} />

              {cartCount > 0 && (
                <span className="fk-nav-badge">
                  {cartCount}
                </span>
              )}
            </Link>

            {user && (
              <Link
                className="fk-nav-profile"
                to="/profile"
              >
                <span className="fk-profile-avatar">
                  {user.name
                    ?.charAt(0)
                    ?.toUpperCase() || 'U'}
                </span>

                <span className="fk-profile-name">
                  {user.name?.split(' ')[0] ||
                    'Account'}
                </span>
              </Link>
            )}

            {!user && (
              <Link
                className="fk-login-btn"
                to="/login"
              >
                Login
              </Link>
            )}

            {user?.role === 'admin' && (
              <Link
                className="fk-nav-item"
                to="/admin"
              >
                Admin
              </Link>
            )}

          </div>


          {/* MOBILE TOGGLE */}

          <button
            type="button"
            className="fk-mobile-toggle"
            onClick={() =>
              setMobileOpen(!mobileOpen)
            }
            aria-label={
              mobileOpen
                ? 'Close navigation'
                : 'Open navigation'
            }
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X size={24} />
            ) : (
              <Menu size={24} />
            )}
          </button>

        </div>


        {/* ===================================================
            MOBILE MENU
        =================================================== */}

        <div
          className={`fk-mobile-menu ${
            mobileOpen ? 'open' : ''
          }`}
        >
          <div className="container">

            {/* MOBILE SEARCH */}

            <form
              className="fk-mobile-search"
              onSubmit={search}
            >
              <Search size={18} />

              <input
                placeholder="Search products..."
                value={q}
                onChange={(e) =>
                  setQ(e.target.value)
                }
              />

              <button type="submit">
                Search
              </button>
            </form>


            {/* USER CARD */}

            {user ? (
              <div className="fk-mobile-user">

                <div className="fk-mobile-user-info">

                  <span className="fk-mobile-avatar">
                    {user.name
                      ?.charAt(0)
                      ?.toUpperCase() || 'U'}
                  </span>

                  <div>
                    <strong>
                      {user.name}
                    </strong>

                    <small>
                      {user.phone}
                    </small>
                  </div>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    go('/profile')
                  }
                >
                  Profile
                  <ChevronRight size={17} />
                </button>

              </div>
            ) : (
              <button
                type="button"
                className="fk-mobile-login"
                onClick={() =>
                  go('/login')
                }
              >
                <User size={19} />

                Login / Create account

                <ChevronRight size={17} />
              </button>
            )}


            {/* MOBILE LINKS */}

            <div className="fk-mobile-links">

              <button
                type="button"
                onClick={() =>
                  go('/')
                }
              >
                <span>
                  <Home size={19} />
                  Home
                </span>

                <ChevronRight size={17} />
              </button>


              <button
                type="button"
                onClick={() =>
                  go('/')
                }
              >
                <span>
                  <LayoutDashboard size={19} />
                  Dashboard
                </span>

                <ChevronRight size={17} />
              </button>


              <button
                type="button"
                onClick={() =>
                  go('/cart')
                }
              >
                <span>
                  <ShoppingCart size={19} />

                  Cart

                  {cartCount > 0 && (
                    <b className="fk-mobile-count">
                      {cartCount}
                    </b>
                  )}
                </span>

                <ChevronRight size={17} />
              </button>


              {user && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      go('/orders')
                    }
                  >
                    <span>
                      <Package size={19} />
                      My Orders
                    </span>

                    <ChevronRight size={17} />
                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      go('/profile')
                    }
                  >
                    <span>
                      <User size={19} />
                      My Profile
                    </span>

                    <ChevronRight size={17} />
                  </button>
                </>
              )}


              <button
                type="button"
                onClick={() =>
                  go('/p/about')
                }
              >
                <span>
                  <Heart size={19} />
                  About FreshKart
                </span>

                <ChevronRight size={17} />
              </button>


              <button
                type="button"
                onClick={() =>
                  go('/p/services')
                }
              >
                <span>
                  <UtensilsCrossed size={19} />
                  Services
                </span>

                <ChevronRight size={17} />
              </button>


              <button
                type="button"
                onClick={() =>
                  go('/p/categories')
                }
              >
                <span>
                  <Layers size={19} />
                  Categories
                </span>

                <ChevronRight size={17} />
              </button>


              <button
                type="button"
                onClick={() =>
                  go('/p/contact')
                }
              >
                <span>
                  <Package size={19} />
                  Contact
                </span>

                <ChevronRight size={17} />
              </button>


              <button
                type="button"
                onClick={() =>
                  go('/p/settings')
                }
              >
                <span>
                  <Settings size={19} />
                  Settings
                </span>

                <ChevronRight size={17} />
              </button>


              <button
                type="button"
                onClick={() =>
                  go('/p/help')
                }
              >
                <span>
                  <HelpCircle size={19} />
                  Help & Support
                </span>

                <ChevronRight size={17} />
              </button>


              {user?.role === 'admin' && (
                <button
                  type="button"
                  onClick={() =>
                    go('/admin')
                  }
                >
                  <span>
                    <User size={19} />
                    Admin Dashboard
                  </span>

                  <ChevronRight size={17} />
                </button>
              )}

            </div>


            {/* MOBILE LOGOUT */}

            {user && (
              <button
                type="button"
                className="fk-mobile-logout"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                Logout
              </button>
            )}

          </div>
        </div>

      </nav>


      {/* =====================================================
          DESKTOP LEFT SIDEBAR
      ===================================================== */}

      <aside
        className={`fk-customer-sidebar ${
          sidebarCollapsed
            ? 'collapsed'
            : ''
        }`}
      >

        {/* SIDEBAR HEADER */}

        <div className="fk-sidebar-header">

          {!sidebarCollapsed && (
            <div className="fk-sidebar-heading">
              <span>
                MENU
              </span>

              <strong>
                Quick Navigation
              </strong>
            </div>
          )}

          <button
            type="button"
            className="fk-sidebar-collapse"
            onClick={() =>
              setSidebarCollapsed(
                !sidebarCollapsed
              )
            }
            aria-label={
              sidebarCollapsed
                ? 'Expand sidebar'
                : 'Collapse sidebar'
            }
            title={
              sidebarCollapsed
                ? 'Expand sidebar'
                : 'Collapse sidebar'
            }
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>

        </div>


        {/* SIDEBAR NAVIGATION */}

        <nav className="fk-sidebar-nav">

          {/* DASHBOARD */}

          <button
            type="button"
            className={
              'fk-sidebar-link ' +
              (isActive('/')
                ? 'active'
                : '')
            }
            onClick={() =>
              go('/')
            }
            title={
              sidebarCollapsed
                ? 'Dashboard'
                : ''
            }
          >
            <LayoutDashboard size={19} />

            {!sidebarCollapsed && (
              <span>
                Dashboard
              </span>
            )}

            {!sidebarCollapsed &&
              isActive('/') && (
                <ChevronRight
                  size={16}
                  className="fk-sidebar-arrow"
                />
              )}
          </button>


          {/* HOME */}

          <button
            type="button"
            className={
              'fk-sidebar-link ' +
              (isActive('/')
                ? 'active-secondary'
                : '')
            }
            onClick={() =>
              go('/')
            }
            title={
              sidebarCollapsed
                ? 'Home'
                : ''
            }
          >
            <Home size={19} />

            {!sidebarCollapsed && (
              <span>
                Home
              </span>
            )}
          </button>


          {/* PROFILE */}

          {user && (
            <button
              type="button"
              className={
                'fk-sidebar-link ' +
                (isActive('/profile')
                  ? 'active'
                  : '')
              }
              onClick={() =>
                go('/profile')
              }
              title={
                sidebarCollapsed
                  ? 'Profile'
                  : ''
              }
            >
              <User size={19} />

              {!sidebarCollapsed && (
                <span>
                  Profile
                </span>
              )}

              {!sidebarCollapsed &&
                isActive('/profile') && (
                  <ChevronRight
                    size={16}
                    className="fk-sidebar-arrow"
                  />
                )}
            </button>
          )}


          {/* CATEGORIES */}

          <button
            type="button"
            className={
              'fk-sidebar-link ' +
              (location.pathname ===
                '/p/categories'
                ? 'active'
                : '')
            }
            onClick={() =>
              go('/p/categories')
            }
            title={
              sidebarCollapsed
                ? 'Categories'
                : ''
            }
          >
            <Layers size={19} />

            {!sidebarCollapsed && (
              <span>
                Categories
              </span>
            )}

            {!sidebarCollapsed &&
              location.pathname ===
                '/p/categories' && (
                <ChevronRight
                  size={16}
                  className="fk-sidebar-arrow"
                />
              )}
          </button>


          {/* SERVICES */}

          <button
            type="button"
            className={
              'fk-sidebar-link ' +
              (location.pathname ===
                '/p/services'
                ? 'active'
                : '')
            }
            onClick={() =>
              go('/p/services')
            }
            title={
              sidebarCollapsed
                ? 'Services'
                : ''
            }
          >
            <UtensilsCrossed size={19} />

            {!sidebarCollapsed && (
              <span>
                Services
              </span>
            )}

            {!sidebarCollapsed &&
              location.pathname ===
                '/p/services' && (
                <ChevronRight
                  size={16}
                  className="fk-sidebar-arrow"
                />
              )}
          </button>


          {/* SETTINGS */}

          <button
            type="button"
            className={
              'fk-sidebar-link ' +
              (location.pathname ===
                '/p/settings'
                ? 'active'
                : '')
            }
            onClick={() =>
              go('/p/settings')
            }
            title={
              sidebarCollapsed
                ? 'Settings'
                : ''
            }
          >
            <Settings size={19} />

            {!sidebarCollapsed && (
              <span>
                Settings
              </span>
            )}

            {!sidebarCollapsed &&
              location.pathname ===
                '/p/settings' && (
                <ChevronRight
                  size={16}
                  className="fk-sidebar-arrow"
                />
              )}
          </button>


          {/* HELP & SUPPORT */}

          <button
            type="button"
            className={
              'fk-sidebar-link ' +
              (location.pathname ===
                '/p/help'
                ? 'active'
                : '')
            }
            onClick={() =>
              go('/p/help')
            }
            title={
              sidebarCollapsed
                ? 'Help & Support'
                : ''
            }
          >
            <HelpCircle size={19} />

            {!sidebarCollapsed && (
              <span>
                Help & Support
              </span>
            )}

            {!sidebarCollapsed &&
              location.pathname ===
                '/p/help' && (
                <ChevronRight
                  size={16}
                  className="fk-sidebar-arrow"
                />
              )}
          </button>

        </nav>


        {/* SIDEBAR FOOTER */}

        <div className="fk-sidebar-footer">

          {user ? (
            <>
              {!sidebarCollapsed && (
                <div className="fk-sidebar-user">

                  <span className="fk-sidebar-avatar">
                    {user.name
                      ?.charAt(0)
                      ?.toUpperCase() || 'U'}
                  </span>

                  <div>
                    <strong>
                      {user.name
                        ?.split(' ')[0] ||
                        'User'}
                    </strong>

                    <small>
                      Customer
                    </small>
                  </div>

                </div>
              )}

              <button
                type="button"
                className="fk-sidebar-logout"
                onClick={handleLogout}
                title={
                  sidebarCollapsed
                    ? 'Logout'
                    : ''
                }
              >
                <LogOut size={18} />

                {!sidebarCollapsed && (
                  <span>
                    Logout
                  </span>
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="fk-sidebar-login"
              onClick={() =>
                go('/login')
              }
              title={
                sidebarCollapsed
                  ? 'Login'
                  : ''
              }
            >
              <User size={18} />

              {!sidebarCollapsed && (
                <span>
                  Login / Sign Up
                </span>
              )}
            </button>
          )}

        </div>

      </aside>
    </>
  );
}
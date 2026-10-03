import { useState, useEffect } from 'react';
import {
  Link,
  useNavigate,
  useSearchParams,
  useParams
} from 'react-router-dom';

import {
  ShoppingBasket,
  Wheat,
  Soup,
  Leaf,
  Apple,
  Milk,
  Croissant,
  Cookie,
  CupSoda,
  SprayCan,
  Droplets,
  Sparkles,
  Baby,
  PawPrint,
  Smartphone,
  Home as HomeIcon,
  BookOpen,
  Gamepad2,
  Snowflake,
  ShoppingBag,
  User,
Mail,
Phone,
Package,
Heart,
ShoppingCart,
LogOut,
Save,
Pencil,
ShieldCheck,
  Settings,
  HelpCircle,
  Headphones,
  SlidersHorizontal,
  Bell,
  MapPin,
  ChevronRight
} from 'lucide-react';

import { api, useApp, PHONE, EMOJI } from './store.jsx';

const CATEGORY_ICONS = {
  Groceries: ShoppingBasket,
  Grains: Wheat,
  Spices: Soup,
  Vegetables: Leaf,
  Fruits: Apple,
  Dairy: Milk,
  Bakery: Croissant,
  Snacks: Cookie,
  Beverages: CupSoda,
  Household: SprayCan,
  PersonalCare: Droplets,
  Beauty: Sparkles,
  'Baby Care': Baby,
  'Pet Care': PawPrint,
  Electronics: Smartphone,
  'Home & Kitchen': HomeIcon,
  Stationery: BookOpen,
  Toys: Gamepad2,
  'Frozen Foods': Snowflake
};

function Stepper({p}){
  const {cart,add}=useApp(),q=cart.find(i=>i._id===p._id)?.qty||0;
  return q?<div className="quantity-control"><button aria-label="Decrease quantity" onClick={()=>add(p,-1)}>−</button><span>{q}</span><button aria-label="Increase quantity" disabled={q>=p.stock} onClick={()=>add(p,1)}>+</button></div>
    :<button className="btn btn-add" disabled={p.stock<=0} onClick={()=>add(p,1)}><span>+</span> Add</button>
}

function ProductCard({ p, index }) {
  const { isWishlisted, toggleWishlist } = useApp();

  const FallbackIcon =
    CATEGORY_ICONS[p.category] || ShoppingBag;

  const wishlistActive = isWishlisted(p);

  return (
    <article
      className="product-card"
      style={{
        '--delay': `${Math.min(index, 8) * 45}ms`
      }}
    >
      <div className="product-media">

        {p.stock <= 5 && p.stock > 0 && (
          <span className="offer-badge">
            Few left
          </span>
        )}

        <button
          type="button"
          className={`wishlist ${wishlistActive ? 'active' : ''}`}
          aria-label={
            wishlistActive
              ? `Remove ${p.name} from wishlist`
              : `Save ${p.name} to wishlist`
          }
          aria-pressed={wishlistActive}
          onClick={() => toggleWishlist(p)}
        >
          {wishlistActive ? '♥' : '♡'}
        </button>

        {p.image ? (
          <img
            src={p.image}
            alt={p.name}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';

              const fallback =
                e.currentTarget.nextElementSibling;

              if (fallback) {
                fallback.style.display = 'flex';
              }
            }}
          />
        ) : null}

        <div
          className="image-fallback"
          style={{
            display: p.image ? 'none' : 'flex'
          }}
          aria-hidden="true"
        >
          <FallbackIcon
            size={64}
            strokeWidth={1.4}
          />
        </div>
      </div>

      <div className="product-body">

        <div className="product-category">
          {p.category}
        </div>

        <h3>
          {p.name}
        </h3>

        <div className="product-rating">
          <span>✓</span>
          <span>FreshKart quality pick</span>
        </div>

        <div className="price-row">
          <strong>
            ₹{p.price}
          </strong>

          <small>
            / {p.unit}
          </small>
        </div>

        <div className="stock-row">
          <span className="stock-dot"></span>

          {p.stock <= 0
            ? 'Out of stock'
            : p.stock <= 5
              ? `Only ${p.stock} left`
              : 'In stock'}
        </div>

        <div className="product-action">
          <Stepper p={p} />
        </div>

      </div>
    </article>
  );
}

export function Home(){
  const {cfg}=useApp(),[sp,setSp]=useSearchParams(),[items,setItems]=useState([]),[sort,setSort]=useState(''),[loading,setLoading]=useState(true);
  const cat=sp.get('cat')||'',q=sp.get('q')||'';
  useEffect(()=>{setLoading(true);api(`/products?category=${encodeURIComponent(cat)}&q=${encodeURIComponent(q)}&sort=${sort}`).then(setItems).catch(()=>setItems([])).finally(()=>setLoading(false))},[cat,q,sort]);

  const categories=['',...cfg.categories];
  const choose=c=>setSp(c?{cat:c}:{});

  return <>
    <section className="hero">
      <div className="hero-glow hero-glow-one"></div><div className="hero-glow hero-glow-two"></div>
      <div className="container position-relative">
        <div className="hero-content">
          <span className="eyebrow">EVERYDAY VALUE • PANDHURNA</span>
          <h1>Your everyday supermarket,<br/><span>made wonderfully simple.</span></h1>
          <p>Fresh food, daily groceries, home essentials and more — carefully selected and delivered to your doorstep.</p>
          <div className="hero-actions"><a href="#shop" className="btn btn-cta btn-lg">Start shopping <span>→</span></a><a href={`https://wa.me/${PHONE}`} className="btn btn-hero-outline btn-lg">Order on WhatsApp</a></div>
          <div className="hero-trust"><span>✓ Quality checked</span><span>✓ Easy ordering</span><span>✓ Cash on delivery</span></div>
        </div>
        <div className="hero-showcase" aria-hidden="true">
          <div className="floating-card floating-card-main"><div className="showcase-icon">🛒</div><b>Everything you need</b><small>One FreshKart basket</small></div>
          <div className="floating-card floating-card-small"><span>★</span><b>Fresh picks</b><small>Every day</small></div>
        </div>
      </div>
    </section>

    <div className="container">
      <section className="category-section" aria-label="Shop by category">
        <div className="section-heading"><div><span className="section-kicker">EXPLORE</span><h2>Shop by category</h2></div><span className="category-hint">Everything in one place</span></div>
<div className="category-grid">
  {categories.map((c) => {
    const Icon = c
      ? CATEGORY_ICONS[c] || ShoppingBag
      : ShoppingBasket;

    return (
      <button
        key={c || 'all'}
        type="button"
        className={`category-card ${cat === c ? 'active' : ''}`}
        onClick={() => choose(c)}
      >
        <span className="category-icon-wrap">
          <Icon
            className="category-icon"
            size={28}
            strokeWidth={1.8}
            aria-hidden="true"
          />
        </span>

        <span className="category-name">
          {c || 'All products'}
        </span>

        <small>
          {c ? 'Explore collection' : 'View everything'}
        </small>

        <span className="category-arrow" aria-hidden="true">
          →
        </span>
      </button>
    );
  })}
</div>
      </section>

      <section className="shop-section" id="shop">
        <div className="shop-toolbar">
          <div><span className="section-kicker">FRESH FINDS</span><h2>{q?`Results for “${q}”`:cat||'Popular picks'}</h2></div>
          <div className="toolbar-actions"><span className="result-count">{loading?'Loading…':`${items.length} products`}</span><select className="sort-select" value={sort} onChange={e=>setSort(e.target.value)}><option value="">Sort: featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></div>
        </div>
        {q&&<button className="clear-search" onClick={()=>setSp({})}>Clear search ×</button>}
        {loading?<div className="product-grid">{Array.from({length:8}).map((_,i)=><div className="skeleton-card" key={i}><div className="skeleton-media"></div><div className="skeleton-line wide"></div><div className="skeleton-line"></div><div className="skeleton-line short"></div></div>)}</div>
          :!items.length?<div className="empty-state"><div>🛍️</div><h3>No products found</h3><p>Try another category or search term.</p><button className="btn btn-primary" onClick={()=>setSp({})}>Browse all products</button></div>
          :<div className="product-grid">{items.map((p,i)=><ProductCard key={p._id} p={p} index={i}/>)}</div>}
      </section>
    </div>
  </>;
}

export function Auth() {
  const { login } = useApp();
  const nav = useNavigate();

  const [reg, setReg] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [resetStep, setResetStep] = useState(false);

  const [f, setF] = useState({});
  const [show, setShow] = useState(false);

  const [remember, setRemember] = useState(true);

  const [err, setErr] = useState('');
  const [success, setSuccess] = useState('');

  const set = k => e =>
    setF({
      ...f,
      [k]: e.target.value
    });

  const loginUser = async e => {
    e.preventDefault();

    setErr('');
    setSuccess('');

    try {
      const d = await api('/auth/login', {
        method: 'POST',
        body: {
          id: f.id,
          password: f.password
        }
      });

      login(d, remember);

      nav(
        d.user.role === 'admin'
          ? '/admin'
          : '/'
      );

    } catch (x) {
      setErr(x.message);
    }
  };

  const registerUser = async e => {
    e.preventDefault();

    setErr('');
    setSuccess('');

    try {
      const d = await api('/auth/register', {
        method: 'POST',
        body: f
      });

      login(d, true);

      nav(
        d.user.role === 'admin'
          ? '/admin'
          : '/'
      );

    } catch (x) {
      setErr(x.message);
    }
  };

  const forgotPassword = async e => {
    e.preventDefault();

    setErr('');
    setSuccess('');

    try {
      const d = await api(
        '/auth/forgot-password',
        {
          method: 'POST',
          body: {
            id: f.id
          }
        }
      );

      setSuccess(
        `${d.message} Demo reset code: ${d.demoCode}`
      );

      setResetStep(true);

    } catch (x) {
      setErr(x.message);
    }
  };

  const resetPassword = async e => {
    e.preventDefault();

    setErr('');
    setSuccess('');

    try {
      const d = await api(
        '/auth/reset-password',
        {
          method: 'POST',
          body: {
            id: f.id,
            code: f.code,
            newPassword: f.newPassword
          }
        }
      );

      setSuccess(
        'Password reset successfully. You can now log in.'
      );

      setForgot(false);
      setResetStep(false);
      setF({});
      setShow(false);

    } catch (x) {
      setErr(x.message);
    }
  };

  if (forgot) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">

          <div className="auth-brand">
            <span className="brand-mark">FK</span>
            <span>
              <strong>Fresh</strong>Kart
            </span>
          </div>

          <span className="eyebrow">
            ACCOUNT RECOVERY
          </span>

          <h1>
            Reset your password
          </h1>

          <p>
            {resetStep
              ? 'Enter the reset code and choose a new password.'
              : 'Enter your registered phone number or email.'}
          </p>

          <form
            onSubmit={
              resetStep
                ? resetPassword
                : forgotPassword
            }
            className="d-grid gap-3 mt-4"
          >

            <input
              className="form-control"
              placeholder="Phone or email"
              required
              value={f.id || ''}
              disabled={resetStep}
              onChange={set('id')}
            />

            {resetStep && (
              <>
                <input
                  className="form-control"
                  placeholder="6-digit reset code"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={f.code || ''}
                  onChange={set('code')}
                />

                <div className="input-group">
                  <input
                    className="form-control"
                    type={
                      show
                        ? 'text'
                        : 'password'
                    }
                    placeholder="New password"
                    minLength={6}
                    required
                    value={f.newPassword || ''}
                    onChange={set('newPassword')}
                  />

                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() =>
                      setShow(!show)
                    }
                  >
                    {show
                      ? 'Hide'
                      : 'Show'}
                  </button>
                </div>
              </>
            )}

            {err && (
              <div className="alert alert-danger py-2 mb-0">
                {err}
              </div>
            )}

            {success && (
              <div className="alert alert-success py-2 mb-0">
                {success}
              </div>
            )}

            <button className="btn btn-primary btn-lg">
              {resetStep
                ? 'Reset Password'
                : 'Send Reset Code'}

              <span>→</span>
            </button>

          </form>

          <button
            className="btn btn-link px-0 mt-3"
            onClick={() => {
              setForgot(false);
              setResetStep(false);
              setErr('');
              setSuccess('');
              setF({});
            }}
          >
            ← Back to Login
          </button>

        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap">

      <div className="auth-card">

        <div className="auth-brand">
          <span className="brand-mark">
            FK
          </span>

          <span>
            <strong>Fresh</strong>Kart
          </span>
        </div>

        <span className="eyebrow">
          WELCOME
        </span>

        <h1>
          {reg
            ? 'Create your account'
            : 'Welcome back'}
        </h1>

        <p>
          {reg
            ? 'Start shopping from your local supermarket.'
            : 'Sign in to continue your FreshKart shopping.'}
        </p>

        <form
          onSubmit={
            reg
              ? registerUser
              : loginUser
          }
          className="d-grid gap-3 mt-4"
        >

          {reg && (
            <input
              className="form-control"
              placeholder="Full name"
              required
              value={f.name || ''}
              onChange={set('name')}
            />
          )}

          {reg ? (
            <>
<input
  className="form-control"
  type="tel"
  placeholder="10-digit phone"
  required
  pattern="[0-9]{10}"
  inputMode="numeric"
  maxLength={10}
  value={f.phone || ''}
  onChange={set('phone')}
/>

              <input
                className="form-control"
                type="email"
                placeholder="Email (optional)"
                value={f.email || ''}
                onChange={set('email')}
              />
            </>
          ) : (
            <input
              className="form-control"
              placeholder="Phone or email"
              required
              value={f.id || ''}
              onChange={set('id')}
            />
          )}

          <div className="input-group">

            <input
              className="form-control"
              type={
                show
                  ? 'text'
                  : 'password'
              }
              placeholder="Password"
              required
              minLength={6}
              value={f.password || ''}
              onChange={set('password')}
            />

            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() =>
                setShow(!show)
              }
            >
              {show
                ? 'Hide'
                : 'Show'}
            </button>

          </div>

          {!reg && (
            <div className="d-flex justify-content-between align-items-center">

              <label
                className="d-flex align-items-center gap-2 small"
                style={{
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  className="form-check-input m-0"
                  checked={remember}
                  onChange={e =>
                    setRemember(
                      e.target.checked
                    )
                  }
                />

                Remember me
              </label>

              <button
                type="button"
                className="btn btn-link p-0 small"
                onClick={() => {
                  setForgot(true);
                  setErr('');
                  setSuccess('');
                }}
              >
                Forgot password?
              </button>

            </div>
          )}

          {err && (
            <div className="alert alert-danger py-2 mb-0">
              {err}
            </div>
          )}

          {success && (
            <div className="alert alert-success py-2 mb-0">
              {success}
            </div>
          )}

          <button className="btn btn-primary btn-lg">
            {reg
              ? 'Create account'
              : 'Log in'}

            <span>→</span>
          </button>

        </form>

        <button
          className="btn btn-link px-0 mt-3"
          onClick={() => {
            setReg(!reg);
            setErr('');
            setSuccess('');
            setF({});
          }}
        >
          {reg
            ? 'Already have an account? Log in'
            : 'New here? Create an account'}
        </button>

      </div>
    </div>
  );
}

export function Cart(){
  const {cart,total,fee,cfg}=useApp();
  if(!cart.length) return <div className="empty-page"><div className="empty-state"><div>🛒</div><h3>Your cart is empty</h3><p>Discover everyday essentials and add your favourites.</p><Link to="/" className="btn btn-primary">Browse products</Link></div></div>;
  return <div className="container page-pad" style={{maxWidth:900}}><div className="section-heading"><div><span className="section-kicker">YOUR BASKET</span><h2>Shopping cart</h2></div></div><div className="cart-layout"><div className="cart-list">{cart.map(i=><div className="cart-item" key={i._id}><div className="cart-thumb">{i.image?<img src={i.image} alt=""/>:EMOJI[i.category]||'🛒'}</div><div className="flex-grow-1"><b>{i.name}</b><small>₹{i.price} / {i.unit}</small></div><Stepper p={i}/><strong>₹{(i.price*i.qty).toFixed(0)}</strong></div>)}</div><aside className="summary-card"><h3>Order summary</h3><div><span>Subtotal</span><b>₹{total.toFixed(0)}</b></div><div><span>Delivery</span><b>{fee?`₹${fee}`:'Free'}</b></div>{total<cfg.freeAbove&&<small>Add ₹{(cfg.freeAbove-total).toFixed(0)} more for free delivery.</small>}<hr/><div className="summary-total"><span>Total</span><b>₹{(total+fee).toFixed(0)}</b></div>{total<cfg.minOrder?<div className="alert alert-warning mt-3">Minimum order is ₹{cfg.minOrder}.</div>:<Link to="/checkout" className="btn btn-cta w-100 mt-3">Continue to checkout →</Link>}</aside></div></div>;
}

export function Checkout(){
  const {user,cart,setCart,total,fee,cfg}=useApp(),nav=useNavigate(),[f,setF]=useState({phone:user.phone,pincode:'',slot:''}),[err,setErr]=useState(''),[busy,setBusy]=useState(false);
  useEffect(()=>{if(!f.pincode&&cfg.pincodes.length)setF(x=>({...x,pincode:cfg.pincodes[0]}))},[cfg.pincodes,f.pincode]);
  const set=k=>e=>setF({...f,[k]:e.target.value});
  const place=async e=>{e.preventDefault();setErr('');setBusy(true);try{await api('/orders',{method:'POST',body:{items:cart.map(i=>({product:i._id,name:i.name,qty:i.qty})),address:{line:f.line,pincode:f.pincode},phone:f.phone,slot:f.slot,note:f.note}});setCart([]);nav('/orders',{state:{placed:true}})}catch(x){setErr(x.message)}setBusy(false)};
  if(!cart.length) return <div className="empty-page">Your cart is empty.</div>;
  return <div className="container page-pad" style={{maxWidth:760}}><div className="section-heading"><div><span className="section-kicker">CHECKOUT</span><h2>Delivery details</h2></div></div><div className="checkout-card"><form onSubmit={place} className="d-grid gap-3">
      <textarea className="form-control" rows="2" placeholder="House no., street, landmark" required onChange={set('line')}/><input className="form-control" placeholder="Pincode" required value={f.pincode} onChange={set('pincode')}/><input className="form-control" placeholder="10-digit phone" required pattern="\d{10}" value={f.phone} onChange={set('phone')}/>
      <select className="form-select" required value={f.slot} onChange={set('slot')}><option value="">Choose delivery slot</option>{cfg.slots.map(s=><option key={s}>{s}</option>)}</select><input className="form-control" placeholder="Note for the delivery person (optional)" onChange={set('note')}/>
      <div className="payment-box"><span className="payment-icon">₹</span><div>Payment method<strong>Cash on Delivery</strong></div></div>
      <div className="checkout-total">Items ₹{total.toFixed(0)} + delivery ₹{fee} = <b>₹{(total+fee).toFixed(0)}</b></div>
      {err&&<div className="alert alert-danger py-2 mb-0">{err}</div>}<button className="btn btn-cta btn-lg" disabled={busy}>{busy?'Placing order…':'Place order · Pay on delivery'}</button>
    </form></div></div>;
}

export function MyOrders(){
  const [list,setList]=useState([]),[err,setErr]=useState(''),load=()=>api('/orders/mine').then(setList);
  useEffect(()=>{load()},[]);
  const cancel=id=>api(`/orders/${id}/cancel`,{method:'PATCH'}).then(load).catch(e=>setErr(e.message));
  return <div className="container page-pad" style={{maxWidth:820}}><div className="section-heading"><div><span className="section-kicker">ACCOUNT</span><h2>My orders</h2></div></div>{err&&<div className="alert alert-danger">{err}</div>}{!list.length&&<div className="empty-state"><div>📦</div><h3>No orders yet</h3><p>Your placed orders will appear here.</p></div>}{list.map(o=><div key={o._id} className="order-card"><div className="d-flex justify-content-between gap-3"><b>#{o._id.slice(-6).toUpperCase()}</b><span className={'status-pill '+(o.status==='Cancelled'?'muted':'')}>{o.status}</span></div><small className="text-muted">{new Date(o.createdAt).toLocaleString('en-IN')} · Slot {o.slot}</small><ul className="mb-2 mt-2">{o.items.map((i,k)=><li key={k}>{i.name} × {i.qty} {i.unit}</li>)}</ul><div className="d-flex justify-content-between align-items-center"><b>₹{o.total} · Cash on Delivery</b>{['Placed','Confirmed'].includes(o.status)&&<button className="btn btn-sm btn-outline-danger" onClick={()=>cancel(o._id)}>Cancel order</button>}</div></div>)}</div>;
}

export function Profile(){
  const {
    user,
    updateProfile,
    logout,
    cart,
    wishlist
  } = useApp();

  const nav = useNavigate();

  const [editing,setEditing]=useState(false);

  const [name,setName]=useState(
    user?.name || ''
  );

  const [email,setEmail]=useState(
    user?.email || ''
  );

  const [saving,setSaving]=useState(false);

  const [err,setErr]=useState('');

  const [success,setSuccess]=useState('');

  const save=async(e)=>{
    e.preventDefault();

    setErr('');
    setSuccess('');
    setSaving(true);

    try{
      await updateProfile({
        name,
        email
      });

      setEditing(false);
      setSuccess(
        'Profile updated successfully.'
      );
    }catch(x){
      setErr(x.message);
    }finally{
      setSaving(false);
    }
  };

  const handleLogout=()=>{
    logout();
    nav('/');
  };

  return (
    <div className="profile-page">
      <div className="container page-pad">

        <div className="profile-header">

          <div>
            <span className="section-kicker">
              MY ACCOUNT
            </span>

            <h1>
              Profile
            </h1>

            <p>
              Manage your FreshKart account and
              shopping activity.
            </p>
          </div>

          <div className="profile-header-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>

        </div>

        <div className="profile-layout">

          {/* PROFILE CARD */}
          <section className="profile-main-card">

            <div className="profile-card-top">

              <div className="profile-large-avatar">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>

              <div className="profile-identity">
                <h2>
                  {user?.name || 'FreshKart User'}
                </h2>

                <span>
                  <ShieldCheck size={15} />
                  {user?.role === 'admin'
                    ? 'Administrator'
                    : 'FreshKart Customer'}
                </span>
              </div>

              {!editing && (
                <button
                  type="button"
                  className="profile-edit-btn"
                  onClick={()=>{
                    setEditing(true);
                    setSuccess('');
                  }}
                >
                  <Pencil size={17} />
                  Edit profile
                </button>
              )}

            </div>

            {success && (
              <div className="profile-success">
                {success}
              </div>
            )}

            {err && (
              <div className="profile-error">
                {err}
              </div>
            )}

            {!editing ? (

              <div className="profile-details">

                <div className="profile-detail">

                  <span className="profile-detail-icon">
                    <User size={19} />
                  </span>

                  <div>
                    <small>Full name</small>
                    <strong>
                      {user?.name || 'Not available'}
                    </strong>
                  </div>

                </div>

                <div className="profile-detail">

                  <span className="profile-detail-icon">
                    <Phone size={19} />
                  </span>

                  <div>
                    <small>Phone number</small>
                    <strong>
                      {user?.phone || 'Not available'}
                    </strong>
                  </div>

                </div>

                <div className="profile-detail">

                  <span className="profile-detail-icon">
                    <Mail size={19} />
                  </span>

                  <div>
                    <small>Email address</small>
                    <strong>
                      {user?.email || 'Not added'}
                    </strong>
                  </div>

                </div>

              </div>

            ) : (

              <form
                className="profile-edit-form"
                onSubmit={save}
              >

                <div>
                  <label>
                    Full name
                  </label>

                  <input
                    className="form-control"
                    value={name}
                    onChange={(e)=>setName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label>
                    Phone number
                  </label>

                  <input
                    className="form-control"
                    value={user?.phone || ''}
                    disabled
                  />

                  <small>
                    Phone number cannot be changed here.
                  </small>
                </div>

                <div>
                  <label>
                    Email address
                  </label>

                  <input
                    className="form-control"
                    type="email"
                    value={email}
                    onChange={(e)=>setEmail(e.target.value)}
                  />
                </div>

                <div className="profile-edit-actions">

                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={()=>{
                      setEditing(false);
                      setName(user?.name || '');
                      setEmail(user?.email || '');
                      setErr('');
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    className="btn btn-cta"
                    disabled={saving}
                  >
                    <Save size={17} />

                    {saving
                      ? 'Saving...'
                      : 'Save changes'}
                  </button>

                </div>

              </form>
            )}

          </section>


          {/* ACCOUNT SHORTCUTS */}
          <aside className="profile-side">

            <button
              type="button"
              className="profile-action-card"
              onClick={()=>nav('/orders')}
            >
              <span>
                <Package size={21} />
              </span>

              <div>
                <strong>
                  My Orders
                </strong>

                <small>
                  View your order history
                </small>
              </div>

              <ChevronRightIcon />
            </button>


            <button
              type="button"
              className="profile-action-card"
              onClick={()=>nav('/')}
            >
              <span>
                <ShoppingCart size={21} />
              </span>

              <div>
                <strong>
                  Continue Shopping
                </strong>

                <small>
                  Explore FreshKart products
                </small>
              </div>

              <ChevronRightIcon />
            </button>


            <div className="profile-stats">

              <div>
                <Heart size={20} />

                <strong>
                  {wishlist.length}
                </strong>

                <small>
                  Wishlist
                </small>
              </div>

              <div>
                <ShoppingCart size={20} />

                <strong>
                  {cart.reduce(
                    (sum,item)=>
                      sum+(item.qty||0),
                    0
                  )}
                </strong>

                <small>
                  Cart items
                </small>
              </div>

            </div>


            <button
              type="button"
              className="profile-logout"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              Logout
            </button>

          </aside>

        </div>
      </div>
    </div>
  );
}

function ChevronRightIcon(){
  return (
    <span className="profile-arrow">
      →
    </span>
  );
}

const PAGES = {
  about: [
    'About FreshKart',
    'FreshKart brings fresh food, everyday groceries, household essentials and more from trusted suppliers to your door in Pandhurna. Order online and pay cash when we deliver.'
  ],

  contact: [
    'Contact us',
    `Call or WhatsApp us at +${PHONE}. Orders are delivered in the slots shown at checkout. [Near State Bank, Pandhurna.]`
  ],

  faq: [
    'FAQ',
    'Which areas do you deliver to? Only the pincodes accepted at checkout. How do I pay? Cash on delivery. Can I cancel? Yes, until the order is out for delivery.'
  ],

  refund: [
    'Refund and replacement',
    'If an item is spoiled or wrong, tell us at the time of delivery or within 2 hours and we will replace it or adjust the bill.'
  ],

  privacy: [
    'Privacy policy',
    'We collect your name, phone, email and address only to deliver your orders. We do not sell your data.'
  ],

  terms: [
    'Terms of service',
    'Prices and stock change daily. Orders are confirmed once accepted by FreshKart. We may cancel orders we cannot fulfil.'
  ]
};


/* =========================================================
   SERVICES PAGE
========================================================= */

function ServicesPage() {
  const services = [
    {
      icon: ShoppingBasket,
      title: 'Fresh Groceries',
      text: 'Daily groceries and essential food items selected for your everyday needs.'
    },
    {
      icon: Package,
      title: 'Home Delivery',
      text: 'Get your FreshKart order delivered to your doorstep in available delivery slots.'
    },
    {
      icon: ShieldCheck,
      title: 'Quality Checked',
      text: 'We focus on reliable products and quality essentials for your household.'
    },
    {
      icon: ShoppingCart,
      title: 'Easy Ordering',
      text: 'Browse products, add them to your cart and place your order in a few simple steps.'
    },
    {
      icon: Heart,
      title: 'Wishlist',
      text: 'Save products you like and easily find them again when you need them.'
    },
    {
      icon: Phone,
      title: 'Customer Support',
      text: `Need help? Contact FreshKart through phone or WhatsApp at +${PHONE}.`
    }
  ];

  return (
    <div className="container page-pad">
      <div className="content-card fk-info-page">

        <span className="section-kicker">
          FRESHKART SERVICES
        </span>

        <h1>
          Services designed for everyday shopping
        </h1>

        <p className="fk-info-intro">
          FreshKart makes everyday shopping simple,
          convenient and accessible from one place.
        </p>

        <div className="fk-service-grid">
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <article
                className="fk-service-card"
                key={service.title}
              >
                <div className="fk-info-icon">
                  <Icon size={24} />
                </div>

                <h3>
                  {service.title}
                </h3>

                <p>
                  {service.text}
                </p>
              </article>
            );
          })}
        </div>

      </div>
    </div>
  );
}


/* =========================================================
   CATEGORIES PAGE
========================================================= */

function CategoriesPage() {
  const { cfg } = useApp();
  const navigate = useNavigate();

  return (
    <div className="container page-pad">

      <div className="content-card fk-info-page">

        <span className="section-kicker">
          SHOPPING
        </span>

        <h1>
          Browse Categories
        </h1>

        <p className="fk-info-intro">
          Explore FreshKart products by category and
          find everything you need in one place.
        </p>

        <div className="fk-brd-category-grid">

          {cfg.categories.map((category) => {
            const Icon =
              CATEGORY_ICONS[category] ||
              ShoppingBag;

            return (
              <button
                type="button"
                key={category}
                className="fk-brd-category-card"
                onClick={() =>
                  navigate(
                    `/?cat=${encodeURIComponent(category)}`
                  )
                }
              >
                <span className="fk-brd-category-icon">
                  <Icon
                    size={25}
                    strokeWidth={1.8}
                  />
                </span>

                <span>
                  <strong>
                    {category}
                  </strong>

                  <small>
                    Explore products
                  </small>
                </span>

                <ChevronRight size={18} />
              </button>
            );
          })}

        </div>

      </div>
    </div>
  );
}


/* =========================================================
   SETTINGS PAGE
========================================================= */

function SettingsPage() {
  const [notifications, setNotifications] =
    useState(
      localStorage.getItem(
        'freshkart_notifications'
      ) !== 'false'
    );

  const [whatsapp, setWhatsapp] =
    useState(
      localStorage.getItem(
        'freshkart_whatsapp_updates'
      ) !== 'false'
    );

  const updateNotifications = (value) => {
    setNotifications(value);

    localStorage.setItem(
      'freshkart_notifications',
      String(value)
    );
  };

  const updateWhatsapp = (value) => {
    setWhatsapp(value);

    localStorage.setItem(
      'freshkart_whatsapp_updates',
      String(value)
    );
  };

  return (
    <div className="container page-pad">

      <div className="content-card fk-info-page">

        <span className="section-kicker">
          ACCOUNT SETTINGS
        </span>

        <h1>
          Settings
        </h1>

        <p className="fk-info-intro">
          Manage your FreshKart preferences.
        </p>


        {/* NOTIFICATIONS */}

        <div className="fk-settings-section">

          <div className="fk-settings-heading">

            <div className="fk-info-icon">
              <Bell size={21} />
            </div>

            <div>
              <h3>
                Notifications
              </h3>

              <p>
                Choose how FreshKart keeps you updated.
              </p>
            </div>

          </div>


          <label className="fk-setting-row">

            <div>
              <strong>
                Order notifications
              </strong>

              <small>
                Receive updates about your orders.
              </small>
            </div>

            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) =>
                updateNotifications(
                  e.target.checked
                )
              }
            />

          </label>


          <label className="fk-setting-row">

            <div>
              <strong>
                WhatsApp updates
              </strong>

              <small>
                Receive useful order updates through WhatsApp.
              </small>
            </div>

            <input
              type="checkbox"
              checked={whatsapp}
              onChange={(e) =>
                updateWhatsapp(
                  e.target.checked
                )
              }
            />

          </label>

        </div>


        {/* DELIVERY */}

        <div className="fk-settings-section">

          <div className="fk-settings-heading">

            <div className="fk-info-icon">
              <MapPin size={21} />
            </div>

            <div>
              <h3>
                Delivery
              </h3>

              <p>
                FreshKart delivery information.
              </p>
            </div>

          </div>

          <div className="fk-setting-info-box">

            <strong>
              Delivery location
            </strong>

            <span>
              Pandhurna and supported pincodes
            </span>

          </div>

          <div className="fk-setting-info-box">

            <strong>
              Payment method
            </strong>

            <span>
              Cash on Delivery
            </span>

          </div>

        </div>


        {/* PRIVACY */}

        <div className="fk-settings-section">

          <div className="fk-settings-heading">

            <div className="fk-info-icon">
              <ShieldCheck size={21} />
            </div>

            <div>
              <h3>
                Privacy & Security
              </h3>

              <p>
                Your account information is handled securely.
              </p>
            </div>

          </div>

          <p className="fk-settings-note">
            FreshKart uses your account information
            to provide shopping, delivery and
            customer support services.
          </p>

        </div>

      </div>
    </div>
  );
}


/* =========================================================
   HELP & SUPPORT PAGE
========================================================= */

function HelpPage() {
  const navigate = useNavigate();

  const questions = [
    {
      question: 'Where does FreshKart deliver?',
      answer:
        'FreshKart delivers to the supported pincodes available during checkout.'
    },
    {
      question: 'How can I pay?',
      answer:
        'FreshKart currently supports Cash on Delivery.'
    },
    {
      question: 'Can I cancel my order?',
      answer:
        'Orders can be cancelled while they are in the Placed or Confirmed stage. Once an order is out for delivery, cancellation may no longer be available.'
    },
    {
      question: 'What if I receive a wrong or spoiled item?',
      answer:
        'Contact FreshKart at the time of delivery or within 2 hours so the item can be reviewed for replacement or bill adjustment.'
    }
  ];

  return (
    <div className="container page-pad">

      <div className="content-card fk-info-page">

        <span className="section-kicker">
          CUSTOMER SUPPORT
        </span>

        <h1>
          Help & Support
        </h1>

        <p className="fk-info-intro">
          Find quick answers or contact FreshKart
          for help with your order.
        </p>


        {/* SUPPORT CARDS */}

        <div className="fk-help-actions">

          <button
            type="button"
            className="fk-help-card"
            onClick={() =>
              navigate('/p/contact')
            }
          >
            <span className="fk-info-icon">
              <Phone size={22} />
            </span>

            <div>
              <strong>
                Contact FreshKart
              </strong>

              <small>
                Call or WhatsApp for assistance
              </small>
            </div>

            <ChevronRight size={18} />
          </button>


          <button
            type="button"
            className="fk-help-card"
            onClick={() =>
              navigate('/p/faq')
            }
          >
            <span className="fk-info-icon">
              <HelpCircle size={22} />
            </span>

            <div>
              <strong>
                Frequently Asked Questions
              </strong>

              <small>
                Find answers to common questions
              </small>
            </div>

            <ChevronRight size={18} />
          </button>

        </div>


        {/* FAQ */}

        <div className="fk-faq-list">

          {questions.map((item) => (
            <details
              className="fk-faq-item"
              key={item.question}
            >
              <summary>
                <span>
                  {item.question}
                </span>

                <ChevronRight size={18} />
              </summary>

              <p>
                {item.answer}
              </p>
            </details>
          ))}

        </div>

      </div>
    </div>
  );
}


/* =========================================================
   GENERIC PAGE ROUTER
========================================================= */

export function Page() {
  const { slug } = useParams();

  if (slug === 'services') {
    return <ServicesPage />;
  }

  if (slug === 'categories') {
    return <CategoriesPage />;
  }

  if (slug === 'settings') {
    return <SettingsPage />;
  }

  if (slug === 'help') {
    return <HelpPage />;
  }

  const [t, b] =
    PAGES[slug] ||
    [
      'Not found',
      'This page does not exist.'
    ];

  return (
    <div
      className="container page-pad"
      style={{ maxWidth: 760 }}
    >
      <div className="content-card">

        <span className="section-kicker">
          FRESHKART
        </span>

        <h2>
          {t}
        </h2>

        <p>
          {b}
        </p>

      </div>
    </div>
  );
}
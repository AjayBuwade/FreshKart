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
  ShoppingBag
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

export function Auth(){
  const {login}=useApp(),nav=useNavigate(),[reg,setReg]=useState(false),[f,setF]=useState({}),[show,setShow]=useState(false),[err,setErr]=useState('');
  const set=k=>e=>setF({...f,[k]:e.target.value});
  const go=async e=>{e.preventDefault();setErr('');try{const d=await api(reg?'/auth/register':'/auth/login',{method:'POST',body:f});login(d);nav(d.user.role==='admin'?'/admin':'/')}catch(x){setErr(x.message)}};
  return <div className="auth-wrap"><div className="auth-card"><div className="auth-brand"><span className="brand-mark">FK</span><span><strong>Fresh</strong>Kart</span></div><span className="eyebrow">WELCOME</span><h1>{reg?'Create your account':'Welcome back'}</h1><p>{reg?'Start shopping from your local supermarket.':'Sign in to continue your FreshKart shopping.'}</p>
    <form onSubmit={go} className="d-grid gap-3 mt-4">
      {reg&&<input className="form-control" placeholder="Full name" required onChange={set('name')}/>}
      {reg?<><input className="form-control" placeholder="10-digit phone" required pattern="\d{10}" onChange={set('phone')}/><input className="form-control" type="email" placeholder="Email (optional)" onChange={set('email')}/></>
        :<input className="form-control" placeholder="Phone or email" required onChange={set('id')}/>}
      <div className="input-group"><input className="form-control" type={show?'text':'password'} placeholder="Password" required minLength={6} onChange={set('password')}/><button type="button" className="btn btn-outline-primary" onClick={()=>setShow(!show)}>{show?'Hide':'Show'}</button></div>
      {err&&<div className="alert alert-danger py-2 mb-0">{err}</div>}
      <button className="btn btn-primary btn-lg">{reg?'Create account':'Log in'} <span>→</span></button>
    </form>
    <button className="btn btn-link px-0 mt-3" onClick={()=>{setReg(!reg);setErr('')}}>{reg?'Already have an account? Log in':'New here? Create an account'}</button></div></div>;
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

const PAGES={
  about:['About FreshKart','FreshKart brings fresh food, everyday groceries, household essentials and more from trusted suppliers to your door in Pandhurna. Order online and pay cash when we deliver.'],
  contact:[`Contact us`,`Call or WhatsApp us at +${PHONE}. Orders are delivered in the slots shown at checkout. [Near State Bank, Pandhurna.]`],
  faq:['FAQ','Which areas do you deliver to? Only the pincodes accepted at checkout. How do I pay? Cash on delivery. Can I cancel? Yes, until the order is out for delivery.'],
  refund:['Refund and replacement','If an item is spoiled or wrong, tell us at the time of delivery or within 2 hours and we will replace it or adjust the bill. '],
  privacy:['Privacy policy','We collect your name, phone, email and address only to deliver your orders. We do not sell your data. '],
  terms:['Terms of service','Prices and stock change daily. Orders are confirmed once accepted by FreshKart. We may cancel orders we cannot fulfil. ']};
export function Page(){const {slug}=useParams(),[t,b]=PAGES[slug]||['Not found','This page does not exist.'];return <div className="container page-pad" style={{maxWidth:760}}><div className="content-card"><span className="section-kicker">FRESHKART</span><h2>{t}</h2><p>{b}</p></div></div>}

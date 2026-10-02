import {useState} from 'react';
import {Routes,Route,Link,Navigate,useNavigate} from 'react-router-dom';
import {useApp} from './store.jsx';
import {Home,Auth,Cart,Checkout,MyOrders,Page} from './pages.jsx';
import Admin from './Admin.jsx';

const Guard=({role,children})=>{const {user,ready}=useApp();
  if(!ready) return <div className="app-loading"><div className="loading-orb"></div><span>Loading FreshKart…</span></div>;
  if(!user) return <Navigate to="/login"/>;
  if(role&&user.role!==role) return <Navigate to="/"/>;
  return children};

export default function App(){
  const {user,logout,cart,total}=useApp(),nav=useNavigate(),[q,setQ]=useState('');
  const n=cart.length;
  return <>
    <div className="top-strip">
      <div className="container d-flex justify-content-between align-items-center">
        <span>Fresh prices • Trusted essentials • Delivered across Pandhurna</span>
        <span className="d-none d-md-inline">Cash on Delivery available</span>
      </div>
    </div>

    <nav className="navbar navbar-expand-md fk-nav sticky-top">
      <div className="container py-2">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
          <span className="brand-mark">FK</span>
          <span><strong>Fresh</strong>Kart <small>MARKET</small></span>
        </Link>
        <form className="search-shell flex-grow-1 mx-md-4 my-2 my-md-0" onSubmit={e=>{e.preventDefault();nav('/?q='+encodeURIComponent(q))}}>
          <span className="search-icon">⌕</span>
          <input aria-label="Search products" placeholder="Search groceries, electronics, household items…" value={q} onChange={e=>setQ(e.target.value)}/>
          {q&&<button type="button" className="search-clear" onClick={()=>setQ('')}>×</button>}
          <button className="search-submit" type="submit">Search</button>
        </form>
        <div className="d-flex gap-2 gap-lg-3 align-items-center flex-wrap">
          <Link className="nav-link d-none d-lg-block" to="/p/about">About</Link>
          <Link className="nav-link d-none d-lg-block" to="/p/contact">Contact</Link>
          <Link className="nav-link cart-link" to="/cart">Cart{n>0&&<span className="badge badge-olive ms-1">{n}</span>}</Link>
          {user?<><>{user.role==='admin'&&<Link className="nav-link" to="/admin">Admin</Link>}</>
            <Link className="nav-link d-none d-lg-block" to="/orders">Orders</Link>
            <button className="btn btn-sm btn-outline-light nav-login" onClick={()=>{logout();nav('/')}}>Logout</button></>
            :<Link className="btn btn-sm btn-cta nav-login" to="/login">Login</Link>}
        </div>
      </div>
    </nav>

    <Routes>
      <Route path="/" element={<Home/>}/><Route path="/login" element={<Auth/>}/><Route path="/cart" element={<Cart/>}/>
      <Route path="/checkout" element={<Guard><Checkout/></Guard>}/><Route path="/orders" element={<Guard><MyOrders/></Guard>}/>
      <Route path="/admin" element={<Guard role="admin"><Admin/></Guard>}/><Route path="/p/:slug" element={<Page/>}/>
    </Routes>

    {n>0&&<Link to="/cart" className="cartbar btn btn-cta rounded-0 py-3">View cart ({n} items) · ₹{total.toFixed(0)} <span>→</span></Link>}

    <footer className="site-footer">
      <div className="container py-5">
        <div className="row g-4">
          <div className="col-md-5">
            <div className="footer-brand"><span className="brand-mark">FK</span><span><strong>Fresh</strong>Kart</span></div>
            <p className="footer-copy">Your everyday supermarket for fresh food, household essentials, personal care and more — delivered in Pandhurna.</p>
          </div>
          <div className="col-6 col-md-2"><h6>Shop</h6><Link to="/">All products</Link><Link to="/?cat=Groceries">Groceries</Link><Link to="/?cat=Household">Household</Link><Link to="/?cat=Electronics">Electronics</Link></div>
          <div className="col-6 col-md-2"><h6>Help</h6><Link to="/p/about">About</Link><Link to="/p/contact">Contact</Link><Link to="/p/faq">FAQ</Link><Link to="/p/refund">Refunds</Link></div>
          <div className="col-6 col-md-3"><h6>Policies</h6><Link to="/p/privacy">Privacy</Link><Link to="/p/terms">Terms</Link><p className="small mt-3 mb-0">FSSAI Lic. No: C12121212</p></div>
        </div>
        <div className="footer-bottom mt-4 pt-3"><span>© 2026 FreshKart, Pandhurna</span><span>Made for everyday shopping.</span></div>
      </div>
    </footer>
  </>;
}
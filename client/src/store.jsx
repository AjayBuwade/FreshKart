import {createContext,useContext,useState,useEffect} from 'react';
// TODO: replace with the store's real WhatsApp number (country code, no +)
export const PHONE='919302576964';
export const EMOJI={Vegetables:'🥦',Fruits:'🍎',Dairy:'🥛',Grains:'🌾',Spices:'🌶️',Snacks:'🍪',Beverages:'🥤',Groceries:'🛒',Bakery:'🥐',Household:'🧹',PersonalCare:'🧴',Beauty:'✨','Baby Care':'🍼','Pet Care':'🐾',Electronics:'📱','Home & Kitchen':'🏠',Stationery:'📚',Toys:'🧸','Frozen Foods':'🧊'};
const Ctx=createContext();export const useApp=()=>useContext(Ctx);
const API_BASE =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api';

export const api = async (path, o = {}) => {
  const t = localStorage.getItem('fk_token');

  const r = await fetch(`${API_BASE}${path}`, {
    method: o.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(t && {
        Authorization: 'Bearer ' + t
      })
    },
    body: o.body
      ? JSON.stringify(o.body)
      : undefined
  });

  const d = await r.json();

  if (!r.ok) {
    throw Error(
      d.error || 'Something went wrong'
    );
  }

  return d;
};
export function AppProvider({children}){
  const [user,setUser]=useState(null),[ready,setReady]=useState(!localStorage.getItem('fk_token')), [cfg,setCfg]=useState({categories:[],slots:[],pincodes:[],freeAbove:500,deliveryCharge:30,minOrder:150});
  const [cart,setCart]=useState(()=>{try{return JSON.parse(localStorage.getItem('fk_cart')||'[]')}catch{return []}});
  const [wishlist,setWishlist]=useState(()=>{try{return JSON.parse(localStorage.getItem('fk_wishlist')||'[]')}catch{return []}});
  useEffect(()=>{api('/config').then(setCfg).catch(()=>{});if(localStorage.getItem('fk_token'))api('/auth/me').then(setUser).catch(()=>localStorage.removeItem('fk_token')).finally(()=>setReady(true));},[]);
  useEffect(()=>localStorage.setItem('fk_cart',JSON.stringify(cart)),[cart]);
  useEffect(()=>localStorage.setItem('fk_wishlist',JSON.stringify(wishlist)),[wishlist]);
  const login=({token,user})=>{localStorage.setItem('fk_token',token);setUser(user)};
  const logout=()=>{localStorage.removeItem('fk_token');setUser(null)};
  const add=(p,d=1)=>setCart(c=>{const i=c.find(x=>x._id===p._id),q=(i?.qty||0)+d,limited=Math.min(q,Number(p.stock)||0);return q<=0?c.filter(x=>x._id!==p._id):i?c.map(x=>x._id===p._id?{...x,qty:limited}:x):limited>0?[...c,{...p,qty:limited}]:c});
  const toggleWishlist=p=>setWishlist(w=>w.some(x=>x._id===p._id)?w.filter(x=>x._id!==p._id):[...w,p]);
  const isWishlisted=p=>wishlist.some(x=>x._id===p._id);
  const total=cart.reduce((s,i)=>s+i.price*i.qty,0),fee=total>=cfg.freeAbove?0:cfg.deliveryCharge;
  return <Ctx.Provider value={{user,ready,cfg,cart,setCart,add,total,fee,login,logout,wishlist,toggleWishlist,isWishlisted}}>{children}</Ctx.Provider>;
}

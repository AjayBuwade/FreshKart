import {useState,useEffect} from 'react';
import {api,useApp} from './store.jsx';

function Dash(){const [s,setS]=useState(null);useEffect(()=>{api('/admin/stats').then(setS)},[]);if(!s)return null;
  const Card=({t,v})=><div className="col-6 col-lg-3"><div className="card p-3"><small className="text-muted">{t}</small><div className="fs-4 fw-bold">{v}</div></div></div>;
  return <><div className="row g-3 mb-4"><Card t="Orders today" v={s.today.orders}/><Card t="Sales today" v={'₹'+s.today.sales}/><Card t="Cash still to collect" v={'₹'+s.cashToCollect}/><Card t="Low-stock items" v={s.low.length}/></div>
    <div className="row"><div className="col-md-6"><h6>Top products</h6><ul>{s.top.map(t=><li key={t._id}>{t._id} — {t.qty}</li>)}</ul></div>
    <div className="col-md-6"><h6>Low stock (5 or fewer)</h6><ul>{s.low.map(p=><li key={p._id}>{p.name} — {p.stock} left</li>)}</ul></div></div></>}

const blank={name:'',category:'Vegetables',price:'',unit:'kg',stock:'',image:'',active:true};
function Prods(){
  const {cfg}=useApp(),[list,setList]=useState([]),[f,setF]=useState(blank),[err,setErr]=useState('');
  const load=()=>api('/admin/products').then(setList);useEffect(()=>{load()},[]);
  const set=k=>e=>setF({...f,[k]:e.target.type==='checkbox'?e.target.checked:e.target.value});
  const save=async e=>{e.preventDefault();setErr('');try{await api('/admin/products'+(f._id?'/'+f._id:''),{method:f._id?'PUT':'POST',body:f});setF(blank);load()}catch(x){setErr(x.message)}};
  const patch=(p,b)=>api('/admin/products/'+p._id,{method:'PUT',body:b}).then(load);
  return <><form onSubmit={save} className="row g-2 mb-4 bg-white border rounded p-3">
    <div className="col-md-3"><input className="form-control" placeholder="Name" required value={f.name} onChange={set('name')}/></div>
    <div className="col-md-2"><select className="form-select" value={f.category} onChange={set('category')}>{cfg.categories.map(c=><option key={c}>{c}</option>)}</select></div>
    <div className="col-6 col-md-1"><input className="form-control" type="number" min="0" placeholder="₹" required value={f.price} onChange={set('price')}/></div>
    <div className="col-6 col-md-1"><select className="form-select" value={f.unit} onChange={set('unit')}>{['kg','g','dozen','piece','litre','ml','pack','bottle','set','box','5 kg'].map(u=><option key={u}>{u}</option>)}</select></div>
    <div className="col-6 col-md-1"><input className="form-control" type="number" min="0" placeholder="Stock" required value={f.stock} onChange={set('stock')}/></div>
    <div className="col-6 col-md-2"><input className="form-control" placeholder="Image URL (optional)" value={f.image||''} onChange={set('image')}/></div>
    <div className="col-md-2 d-flex gap-2"><button className="btn btn-primary flex-grow-1">{f._id?'Save changes':'Add product'}</button>{f._id&&<button type="button" className="btn btn-light" onClick={()=>setF(blank)}>Cancel</button>}</div>
    {err&&<div className="col-12 text-danger">{err}</div>}</form>
    <div className="table-responsive"><table className="table table-sm bg-white align-middle"><thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Shown</th><th></th></tr></thead><tbody>
      {list.map(p=><tr key={p._id}><td>{p.name}<br/><small className="text-muted">{p.category}</small></td>
        <td><input className="form-control form-control-sm" style={{width:80}} type="number" defaultValue={p.price} onBlur={e=>+e.target.value!==p.price&&patch(p,{price:+e.target.value})}/></td>
        <td><input className="form-control form-control-sm" style={{width:80}} type="number" defaultValue={p.stock} onBlur={e=>+e.target.value!==p.stock&&patch(p,{stock:+e.target.value})}/></td>
        <td><input type="checkbox" className="form-check-input" checked={p.active} onChange={e=>patch(p,{active:e.target.checked})}/></td>
        <td className="text-end"><button className="btn btn-sm btn-outline-primary me-1" onClick={()=>{setF(p);window.scrollTo(0,0)}}>Edit</button>
          <button className="btn btn-sm btn-outline-danger" onClick={()=>confirm('Delete '+p.name+'?')&&api('/admin/products/'+p._id,{method:'DELETE'}).then(load)}>Delete</button></td></tr>)}</tbody></table></div></>;
}

const ST=['Placed','Confirmed','Out for Delivery','Delivered','Cancelled'];
function slip(o){const w=window.open('');const pre=w.document.createElement('pre');
  pre.textContent=`FreshKart — Order #${o._id.slice(-6).toUpperCase()}\n${o.user?.name||''} ${o.phone}\n${o.address.line}, ${o.address.pincode}\nSlot: ${o.slot}\n\n${o.items.map(i=>`${i.name}  x ${i.qty} ${i.unit}  ₹${i.price*i.qty}`).join('\n')}\n\nDelivery: ₹${o.deliveryCharge}\nCOLLECT CASH: ₹${o.total}\nNote: ${o.note||'-'}`;
  w.document.body.append(pre);w.print()}
function Orders(){
  const [list,setList]=useState([]),[st,setSt]=useState(''),[err,setErr]=useState('');
  const load=()=>api('/admin/orders'+(st?'?status='+encodeURIComponent(st):'')).then(setList);useEffect(()=>{load()},[st]);
  const upd=(o,b)=>api('/admin/orders/'+o._id,{method:'PATCH',body:b}).then(load).catch(e=>setErr(e.message));
  return <><select className="form-select w-auto mb-3" value={st} onChange={e=>setSt(e.target.value)}><option value="">All orders</option>{ST.map(s=><option key={s}>{s}</option>)}</select>
    {err&&<div className="alert alert-danger">{err}</div>}
    {list.map(o=><div key={o._id} className="card mb-2"><div className="card-body py-2 row align-items-center g-2">
      <div className="col-md-4"><b>#{o._id.slice(-6).toUpperCase()}</b> · ₹{o.total}<br/><small>{o.user?.name} · {o.phone}<br/>{o.address.line}, {o.address.pincode} · {o.slot}</small></div>
      <div className="col-md-3"><small>{o.items.map(i=>`${i.name} × ${i.qty}`).join(', ')}</small></div>
      <div className="col-md-5 d-flex flex-wrap gap-2 align-items-center">
        <select className="form-select form-select-sm w-auto" value={o.status} onChange={e=>upd(o,{status:e.target.value})}>{ST.map(s=><option key={s}>{s}</option>)}</select>
        <label className="small"><input type="checkbox" className="form-check-input me-1" checked={o.cashCollected} onChange={e=>upd(o,{cashCollected:e.target.checked})}/>Cash collected</label>
        <button className="btn btn-sm btn-outline-primary" onClick={()=>slip(o)}>Print slip</button></div></div></div>)}</>;
}

export default function Admin(){
  const [tab,setTab]=useState('dash');
  return <div className="row g-0"><aside className="col-md-2 bg-white border-end p-2 d-flex flex-md-column gap-1">
    {[['dash','Dashboard'],['prod','Products'],['ord','Orders']].map(([k,l])=><button key={k} className={'btn btn-sm text-start '+(tab===k?'btn-primary':'btn-light')} onClick={()=>setTab(k)}>{l}</button>)}</aside>
    <main className="col-md-10 p-3">{tab==='dash'?<Dash/>:tab==='prod'?<Prods/>:<Orders/>}</main></div>;
}

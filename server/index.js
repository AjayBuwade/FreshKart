require('dotenv').config();
const express=require('express'),mongoose=require('mongoose'),cors=require('cors'),bcrypt=require('bcryptjs'),jwt=require('jsonwebtoken');
const {Schema,model}=mongoose,Id=Schema.Types.ObjectId;
const CFG={categories:['Groceries','Grains','Spices','Vegetables','Fruits','Dairy','Bakery','Snacks','Beverages','Household','PersonalCare','Beauty','Baby Care','Pet Care','Electronics','Home & Kitchen','Stationery','Toys','Frozen Foods'],slots:['8-10 AM','10-12 PM','4-6 PM','6-8 PM'],pincodes:(process.env.PINCODES||'480334').split(',').map(p=>p.trim()).filter(Boolean),minOrder:+process.env.MIN_ORDER||150,deliveryCharge:+process.env.DELIVERY_CHARGE||30,freeAbove:+process.env.FREE_ABOVE||500};
const STATUSES=['Placed','Confirmed','Out for Delivery','Delivered','Cancelled'];

const User=model('User',new Schema({name:String,phone:{type:String,unique:true},email:String,password:String,role:{type:String,default:'customer'}},{timestamps:true}));
const Product=model('Product',new Schema({name:{type:String,required:true},category:String,price:{type:Number,required:true,min:0},unit:{type:String,default:'kg'},stock:{type:Number,default:0,min:0},image:String,active:{type:Boolean,default:true}},{timestamps:true}));
const Order=model('Order',new Schema({user:{type:Id,ref:'User'},items:[{product:Id,name:String,price:Number,qty:Number,unit:String}],address:{line:String,pincode:String},phone:String,slot:String,note:String,subtotal:Number,deliveryCharge:Number,total:Number,status:{type:String,default:'Placed'},paymentMethod:{type:String,default:'COD'},cashCollected:{type:Boolean,default:false}},{timestamps:true}));

const sign=u=>jwt.sign({id:u._id,role:u.role},process.env.JWT_SECRET,{expiresIn:'7d'});
const pub=u=>({_id:u._id,name:u.name,phone:u.phone,email:u.email,role:u.role});
const auth=(req,res,next)=>{try{req.user=jwt.verify((req.headers.authorization||'').slice(7),process.env.JWT_SECRET);next()}catch{res.status(401).json({error:'Please log in'})}};
const admin=(req,res,next)=>req.user.role==='admin'?next():res.status(403).json({error:'Admins only'});
const wrap=f=>(req,res,next)=>f(req,res,next).catch(e=>res.status(400).json({error:e.message}));
// Plug MSG91 / WhatsApp Cloud API in here later
const notify=(phone,msg)=>console.log(`[notify ${phone}] ${msg}`);
const restock=o=>Promise.all(o.items.map(i=>Product.updateOne({_id:i.product},{$inc:{stock:i.qty}})));

const app=express();app.use(cors(),express.json());
app.get('/api/config',(q,r)=>r.json(CFG));

// ---- Auth
app.post('/api/auth/register',wrap(async(req,res)=>{
  const {name,phone,email,password}=req.body;
  if(!name||!/^\d{10}$/.test(phone)||(password||'').length<6) throw Error('Name, 10-digit phone and a password of 6+ characters are required');
  if(await User.exists({phone})) throw Error('This phone number is already registered');
  const u=await User.create({name,phone,email,password:await bcrypt.hash(password,10)});
  res.json({token:sign(u),user:pub(u)});
}));
app.post('/api/auth/login',wrap(async(req,res)=>{
  const {id,password}=req.body;
  const u=await User.findOne({$or:[{phone:id},{email:id}]});
  if(!u||!(await bcrypt.compare(password||'',u.password))) throw Error('Wrong phone/email or password');
  res.json({token:sign(u),user:pub(u)});
}));
app.get('/api/auth/me',auth,wrap(async(req,res)=>res.json(pub(await User.findById(req.user.id)))));

// ---- Catalog
app.get('/api/products',wrap(async(req,res)=>{
  const {category,q,sort}=req.query,f={active:true};
  if(category) f.category=category;
  if(q) f.name=new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i');
  res.json(await Product.find(f).sort(sort==='low'?{price:1}:sort==='high'?{price:-1}:{name:1}));
}));
app.get('/api/admin/products',auth,admin,wrap(async(q,r)=>r.json(await Product.find().sort({name:1}))));
app.post('/api/admin/products',auth,admin,wrap(async(q,r)=>r.json(await Product.create(q.body))));
app.put('/api/admin/products/:id',auth,admin,wrap(async(q,r)=>r.json(await Product.findByIdAndUpdate(q.params.id,q.body,{new:true,runValidators:true}))));
app.delete('/api/admin/products/:id',auth,admin,wrap(async(q,r)=>{await Product.findByIdAndDelete(q.params.id);r.json({ok:true})}));

// ---- Orders (Cash on Delivery)
app.post('/api/orders',auth,wrap(async(req,res)=>{
  const {items,address,phone,slot,note}=req.body;
  if(!items?.length) throw Error('Your cart is empty');
  if(!CFG.pincodes.includes(address?.pincode)) throw Error('Sorry, we do not deliver to this pincode yet');
  if(!address.line||!/^\d{10}$/.test(phone)) throw Error('A delivery address and 10-digit phone are required');
  if(!CFG.slots.includes(slot)) throw Error('Please choose a delivery slot');
  const done=[],lines=[];let subtotal=0;
  try{
    for(const i of items){
      const qty=+i.qty; if(!(qty>0)) throw Error('Invalid quantity');
      const p=await Product.findOneAndUpdate({_id:i.product,active:true,stock:{$gte:qty}},{$inc:{stock:-qty}});
      if(!p) throw Error(`${i.name||'An item'} is out of stock`);
      done.push({id:p._id,qty});subtotal+=p.price*qty;lines.push({product:p._id,name:p.name,price:p.price,qty,unit:p.unit});
    }
    if(subtotal<CFG.minOrder) throw Error(`Minimum order is ₹${CFG.minOrder}`);
  }catch(e){await Promise.all(done.map(d=>Product.updateOne({_id:d.id},{$inc:{stock:d.qty}})));throw e}
  const deliveryCharge=subtotal>=CFG.freeAbove?0:CFG.deliveryCharge;
  const o=await Order.create({user:req.user.id,items:lines,address,phone,slot,note,subtotal,deliveryCharge,total:subtotal+deliveryCharge});
  notify(phone,`FreshKart: order placed. Pay ₹${o.total} on delivery (${slot}).`);
  res.json(o);
}));
app.get('/api/orders/mine',auth,wrap(async(req,res)=>res.json(await Order.find({user:req.user.id}).sort({createdAt:-1}))));
app.patch('/api/orders/:id/cancel',auth,wrap(async(req,res)=>{
  const o=await Order.findOne({_id:req.params.id,user:req.user.id});
  if(!o||!['Placed','Confirmed'].includes(o.status)) throw Error('This order can no longer be cancelled');
  o.status='Cancelled';await o.save();await restock(o);res.json(o);
}));

// ---- Admin orders + reports
app.get('/api/admin/orders',auth,admin,wrap(async(req,res)=>res.json(await Order.find(req.query.status?{status:req.query.status}:{}).populate('user','name phone').sort({createdAt:-1}).limit(200))));
app.patch('/api/admin/orders/:id',auth,admin,wrap(async(req,res)=>{
  const o=await Order.findById(req.params.id),{status,cashCollected}=req.body;
  if(status){
    if(!STATUSES.includes(status)) throw Error('Invalid status');
    if(o.status==='Cancelled'&&status!=='Cancelled') throw Error('Cancelled orders cannot be reopened');
    if(status==='Cancelled'&&o.status!=='Cancelled') await restock(o);
    o.status=status;notify(o.phone,`FreshKart: your order is now ${status}`);
  }
  if(typeof cashCollected==='boolean') o.cashCollected=cashCollected;
  await o.save();res.json(o);
}));
app.get('/api/admin/stats',auth,admin,wrap(async(req,res)=>{
  const since=new Date();since.setHours(0,0,0,0);const live={status:{$ne:'Cancelled'}};
  const [today,top,low,cash]=await Promise.all([
    Order.aggregate([{$match:{createdAt:{$gte:since},...live}},{$group:{_id:null,orders:{$sum:1},sales:{$sum:'$total'}}}]),
    Order.aggregate([{$match:live},{$unwind:'$items'},{$group:{_id:'$items.name',qty:{$sum:'$items.qty'}}},{$sort:{qty:-1}},{$limit:5}]),
    Product.find({stock:{$lte:5}}).select('name stock'),
    Order.aggregate([{$match:{status:'Delivered',cashCollected:false}},{$group:{_id:null,due:{$sum:'$total'}}}])]);
  res.json({today:today[0]||{orders:0,sales:0},top,low,cashToCollect:cash[0]?.due||0});
}));

mongoose.connect(process.env.MONGO_URI).then(async()=>{
  if(!await User.exists({role:'admin'})) await User.create({name:'Admin',phone:process.env.ADMIN_PHONE||'9999999999',password:await bcrypt.hash(process.env.ADMIN_PASSWORD||'admin123',10),role:'admin'});
const seedProducts = [
  // =========================
  // VEGETABLES
  // =========================
  {
    name: 'Tomato',
    category: 'Vegetables',
    price: 30,
    unit: 'kg',
    stock: 50,
    image: 'https://images.pexels.com/photos/8016790/pexels-photo-8016790.jpeg?auto=compress&cs=tinysrgb&w=900'
  },
  {
    name: 'Potato',
    category: 'Vegetables',
    price: 25,
    unit: 'kg',
    stock: 80,
    image: 'https://images.pexels.com/photos/4110456/pexels-photo-4110456.jpeg?auto=compress&cs=tinysrgb&w=900'
  },
  {
    name: 'Spinach (Palak)',
    category: 'Vegetables',
    price: 20,
    unit: 'piece',
    stock: 30,
    image: 'https://images.pexels.com/photos/1656663/pexels-photo-1656663.jpeg?auto=compress&cs=tinysrgb&w=900'
  },

  // =========================
  // FRUITS
  // =========================
  {
    name: 'Banana',
    category: 'Fruits',
    price: 50,
    unit: 'dozen',
    stock: 40,
    image: 'https://images.pexels.com/photos/4114143/pexels-photo-4114143.jpeg?auto=compress&cs=tinysrgb&w=900'
  },
  {
    name: 'Apple',
    category: 'Fruits',
    price: 160,
    unit: 'kg',
    stock: 25,
    image: 'https://images.pexels.com/photos/5876762/pexels-photo-5876762.jpeg?auto=compress&cs=tinysrgb&w=900'
  },

  // =========================
  // DAIRY
  // =========================
  {
    name: 'Fresh Milk',
    category: 'Dairy',
    price: 60,
    unit: 'litre',
    stock: 40,
    image: 'https://images.pexels.com/photos/5652184/pexels-photo-5652184.jpeg?auto=compress&cs=tinysrgb&w=900'
  },
  {
    name: 'Paneer',
    category: 'Dairy',
    price: 700,
    unit: 'kg',
    stock: 18,
    image: 'https://images.pexels.com/photos/30858420/pexels-photo-30858420.jpeg?auto=compress&cs=tinysrgb&w=900'
  },

  // =========================
  // GROCERIES / GRAINS
  // =========================
  {
    name: 'Whole Wheat Atta',
    category: 'Groceries',
    price: 240,
    unit: '5 kg',
    stock: 25,
    image: 'https://images.pexels.com/photos/6287223/pexels-photo-6287223.jpeg?auto=compress&cs=tinysrgb&w=900'
  },
  {
    name: 'Oats',
    category: 'Grains',
    price: 180,
    unit: 'pack',
    stock: 22,
    image: 'https://images.pexels.com/photos/4725735/pexels-photo-4725735.jpeg?auto=compress&cs=tinysrgb&w=900'
  },
  {
    name: 'Turmeric Powder',
    category: 'Spices',
    price: 95,
    unit: 'pack',
    stock: 30,
    image: 'https://images.pexels.com/photos/8760466/pexels-photo-8760466.jpeg?auto=compress&cs=tinysrgb&w=900'
  },
  {
    name: 'Basmati Rice',
    category: 'Groceries',
    price: 180,
    unit: 'kg',
    stock: 35,
    image: 'https://images.pexels.com/photos/17563535/pexels-photo-17563535.jpeg?auto=compress&cs=tinysrgb&w=900'
  },
  {
    name: 'Toor Dal',
    category: 'Groceries',
    price: 150,
    unit: 'kg',
    stock: 30,
    image: 'https://images.pexels.com/photos/6086414/pexels-photo-6086414.jpeg?auto=compress&cs=tinysrgb&w=900'
  },

  // =========================
  // BAKERY
  // =========================
  {
    name: 'Brown Bread',
    category: 'Bakery',
    price: 45,
    unit: 'piece',
    stock: 20,
    image: 'https://images.pexels.com/photos/8599585/pexels-photo-8599585.jpeg?auto=compress&cs=tinysrgb&w=900'
  },
  {
    name: 'Butter Croissant',
    category: 'Bakery',
    price: 80,
    unit: 'piece',
    stock: 16,
    image: 'https://images.pexels.com/photos/3850349/pexels-photo-3850349.jpeg?auto=compress&cs=tinysrgb&w=900'
  },

  // =========================
  // SNACKS
  // =========================
  {
    name: 'Potato Chips',
    category: 'Snacks',
    price: 30,
    unit: 'pack',
    stock: 45,
    image: 'https://images.pexels.com/photos/13060681/pexels-photo-13060681.jpeg?auto=compress&cs=tinysrgb&w=900'
  },
  {
    name: 'Chocolate Biscuits',
    category: 'Snacks',
    price: 40,
    unit: 'pack',
    stock: 35,
    image: 'https://images.pexels.com/photos/2226977/pexels-photo-2226977.jpeg?auto=compress&cs=tinysrgb&w=900'
  },

  // =========================
  // BEVERAGES
  // =========================
  {
    name: 'Orange Juice',
    category: 'Beverages',
    price: 110,
    unit: 'litre',
    stock: 24,
    image: 'https://images.pexels.com/photos/13427966/pexels-photo-13427966.jpeg?auto=compress&cs=tinysrgb&w=900'
  },
  {
    name: 'Ground Coffee',
    category: 'Beverages',
    price: 260,
    unit: 'pack',
    stock: 18,
    image: 'https://images.pexels.com/photos/942803/pexels-photo-942803.jpeg?auto=compress&cs=tinysrgb&w=900'
  },

  // =========================
  // HOUSEHOLD
  // =========================
  {
    name: 'Dishwashing Liquid',
    category: 'Household',
    price: 125,
    unit: 'bottle',
    stock: 22,
    image: 'https://images.pexels.com/photos/10573258/pexels-photo-10573258.jpeg?auto=compress&cs=tinysrgb&w=900'
  },
  {
    name: 'Laundry Detergent',
    category: 'Household',
    price: 299,
    unit: 'pack',
    stock: 20,
    image: 'https://images.pexels.com/photos/5218021/pexels-photo-5218021.jpeg?auto=compress&cs=tinysrgb&w=900'
  },

  // =========================
  // PERSONAL CARE
  // =========================
  {
    name: 'Hand Wash',
    category: 'PersonalCare',
    price: 95,
    unit: 'bottle',
    stock: 28,
    image: 'https://images.pexels.com/photos/4108116/pexels-photo-4108116.jpeg?auto=compress&cs=tinysrgb&w=900'
  },
  {
    name: 'Shampoo',
    category: 'PersonalCare',
    price: 220,
    unit: 'bottle',
    stock: 18,
    image: 'https://images.pexels.com/photos/14149696/pexels-photo-14149696.jpeg?auto=compress&cs=tinysrgb&w=900'
  },

  // =========================
  // BEAUTY
  // =========================
  {
    name: 'Face Moisturizer',
    category: 'Beauty',
    price: 299,
    unit: 'piece',
    stock: 14,
    image: 'https://images.pexels.com/photos/7319145/pexels-photo-7319145.jpeg?auto=compress&cs=tinysrgb&w=900'
  },

  // =========================
  // BABY CARE
  // =========================
  {
    name: 'Baby Care Wipes',
    category: 'Baby Care',
    price: 149,
    unit: 'pack',
    stock: 20,
    image: 'https://images.pexels.com/photos/9771341/pexels-photo-9771341.jpeg?auto=compress&cs=tinysrgb&w=900'
  },

  // =========================
  // PET CARE
  // =========================
  {
    name: 'Pet Food',
    category: 'Pet Care',
    price: 399,
    unit: 'pack',
    stock: 14,
    image: 'https://images.pexels.com/photos/12928245/pexels-photo-12928245.jpeg?auto=compress&cs=tinysrgb&w=900'
  },

  // =========================
  // ELECTRONICS
  // =========================
  {
    name: 'Smartphone',
    category: 'Electronics',
    price: 12999,
    unit: 'piece',
    stock: 8,
    image: 'https://images.pexels.com/photos/8408537/pexels-photo-8408537.jpeg?auto=compress&cs=tinysrgb&w=900'
  },
  {
    name: 'Wireless Headphones',
    category: 'Electronics',
    price: 1799,
    unit: 'piece',
    stock: 12,
    image: 'https://images.pexels.com/photos/3394651/pexels-photo-3394651.jpeg?auto=compress&cs=tinysrgb&w=900'
  },

  // =========================
  // HOME & KITCHEN
  // =========================
  {
    name: 'LED Table Lamp',
    category: 'Home & Kitchen',
    price: 699,
    unit: 'piece',
    stock: 15,
    image: 'https://images.pexels.com/photos/8263851/pexels-photo-8263851.jpeg?auto=compress&cs=tinysrgb&w=900'
  },
  {
    name: 'Non-stick Fry Pan',
    category: 'Home & Kitchen',
    price: 899,
    unit: 'piece',
    stock: 10,
    image: 'https://images.pexels.com/photos/10807704/pexels-photo-10807704.jpeg?auto=compress&cs=tinysrgb&w=900'
  },

  // =========================
  // STATIONERY
  // =========================
  {
    name: 'Spiral Notebook',
    category: 'Stationery',
    price: 70,
    unit: 'piece',
    stock: 30,
    image: 'https://images.pexels.com/photos/3650937/pexels-photo-3650937.jpeg?auto=compress&cs=tinysrgb&w=900'
  },
  {
    name: 'Ball Pen Set',
    category: 'Stationery',
    price: 60,
    unit: 'pack',
    stock: 40,
    image: 'https://images.pexels.com/photos/983826/pexels-photo-983826.jpeg?auto=compress&cs=tinysrgb&w=900'
  },

  // =========================
  // TOYS
  // =========================
  {
    name: 'Building Blocks',
    category: 'Toys',
    price: 499,
    unit: 'set',
    stock: 10,
    image: 'https://images.pexels.com/photos/7301143/pexels-photo-7301143.jpeg?auto=compress&cs=tinysrgb&w=900'
  },

  // =========================
  // FROZEN FOODS
  // =========================
  {
    name: 'Frozen Mixed Vegetables',
    category: 'Frozen Foods',
    price: 180,
    unit: 'pack',
    stock: 18,
    image: 'https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg?auto=compress&cs=tinysrgb&w=900'
  }
];


for (const p of seedProducts) {
  const existing = await Product.findOne({ name: p.name });

  if (!existing) {
    await Product.create(p);
  } else {
    await Product.updateOne(
      { _id: existing._id },
      {
        $set: {
          name: p.name,
          category: p.category,
          price: p.price,
          unit: p.unit,
          stock: p.stock,
          image: p.image,
          active: true
        }
      }
    );
  }
}

  app.listen(process.env.PORT||5000,()=>console.log('FreshKart API running'));
}).catch(e=>console.error('MongoDB connection failed:',e.message));

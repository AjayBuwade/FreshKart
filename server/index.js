require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { Schema, model } = mongoose;
const Id = Schema.Types.ObjectId;

const CFG = {
  categories: [
    'Groceries',
    'Grains',
    'Spices',
    'Vegetables',
    'Fruits',
    'Dairy',
    'Bakery',
    'Snacks',
    'Beverages',
    'Household',
    'PersonalCare',
    'Beauty',
    'Baby Care',
    'Pet Care',
    'Electronics',
    'Home & Kitchen',
    'Stationery',
    'Toys',
    'Frozen Foods'
  ],

  slots: [
    '8-10 AM',
    '10-12 PM',
    '4-6 PM',
    '6-8 PM'
  ],

  pincodes: (process.env.PINCODES || '480334')
    .split(',')
    .map(p => p.trim())
    .filter(Boolean),

  minOrder: Number(process.env.MIN_ORDER) || 150,
  deliveryCharge: Number(process.env.DELIVERY_CHARGE) || 30,
  freeAbove: Number(process.env.FREE_ABOVE) || 500
};

const STATUSES = [
  'Placed',
  'Confirmed',
  'Out for Delivery',
  'Delivered',
  'Cancelled'
];

/* =====================================================
   MODELS
===================================================== */

const User = model(
  'User',
  new Schema(
    {
      name: String,
      phone: {
        type: String,
        unique: true
      },
      email: String,
      password: String,
      role: {
        type: String,
        default: 'customer'
      }
    },
    { timestamps: true }
  )
);

const Product = model(
  'Product',
  new Schema(
    {
      name: {
        type: String,
        required: true
      },
      category: String,
      price: {
        type: Number,
        required: true,
        min: 0
      },
      unit: {
        type: String,
        default: 'kg'
      },
      stock: {
        type: Number,
        default: 0,
        min: 0
      },
      image: String,
      active: {
        type: Boolean,
        default: true
      }
    },
    { timestamps: true }
  )
);

const Order = model(
  'Order',
  new Schema(
    {
      user: {
        type: Id,
        ref: 'User'
      },

      items: [
        {
          product: Id,
          name: String,
          price: Number,
          qty: Number,
          unit: String
        }
      ],

      address: {
        line: String,
        pincode: String
      },

      phone: String,
      slot: String,
      note: String,

      subtotal: Number,
      deliveryCharge: Number,
      total: Number,

      status: {
        type: String,
        default: 'Placed'
      },

      paymentMethod: {
        type: String,
        default: 'COD'
      },

      cashCollected: {
        type: Boolean,
        default: false
      }
    },
    { timestamps: true }
  )
);

const Settings = model(
  'Settings',
  new Schema(
    {
      storeName: {
        type: String,
        default: 'FreshKart'
      },

      storePhone: {
        type: String,
        default: ''
      },

      minOrder: {
        type: Number,
        default: 150,
        min: 0
      },

      deliveryCharge: {
        type: Number,
        default: 30,
        min: 0
      },

      freeAbove: {
        type: Number,
        default: 500,
        min: 0
      },

      pincodes: {
        type: [String],
        default: ['480334']
      },

      slots: {
        type: [String],
        default: [
          '8-10 AM',
          '10-12 PM',
          '4-6 PM',
          '6-8 PM'
        ]
      }
    },
    { timestamps: true }
  )
);

/* =====================================================
   HELPERS
===================================================== */

const sign = user =>
  jwt.sign(
    {
      id: user._id,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d'
    }
  );

const pub = user => ({
  _id: user._id,
  name: user.name,
  phone: user.phone,
  email: user.email,
  role: user.role
});

const auth = (req, res, next) => {
  try {
    const token = (req.headers.authorization || '').slice(7);

    req.user = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    next();
  } catch {
    res.status(401).json({
      error: 'Please log in'
    });
  }
};

const admin = (req, res, next) => {
  if (req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    error: 'Admins only'
  });
};

const wrap = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(error => {
    res.status(400).json({
      error: error.message || 'Something went wrong'
    });
  });

const notify = (phone, message) => {
  console.log(`[notify ${phone}] ${message}`);
};

const resetCodes = new Map();

const restock = order =>
  Promise.all(
    order.items.map(item =>
      Product.updateOne(
        { _id: item.product },
        {
          $inc: {
            stock: item.qty
          }
        }
      )
    )
  );

const getStoreSettings = async () => {
  let settings = await Settings.findOne();

  if (!settings) {
    settings = await Settings.create({
      storeName: 'FreshKart',
      storePhone: process.env.STORE_PHONE || '',
      minOrder: CFG.minOrder,
      deliveryCharge: CFG.deliveryCharge,
      freeAbove: CFG.freeAbove,
      pincodes: CFG.pincodes,
      slots: CFG.slots
    });
  }

  return settings;
};

/* =====================================================
   APP
===================================================== */

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true
  })
);

app.use(express.json());

/* =====================================================
   CONFIG
===================================================== */

app.get(
  '/api/config',
  wrap(async (req, res) => {
    const settings = await getStoreSettings();

    res.json({
      categories: CFG.categories,
      slots: settings.slots,
      pincodes: settings.pincodes,
      minOrder: settings.minOrder,
      deliveryCharge: settings.deliveryCharge,
      freeAbove: settings.freeAbove,
      storeName: settings.storeName,
      storePhone: settings.storePhone
    });
  })
);

/* =====================================================
   AUTH
===================================================== */

app.post(
  '/api/auth/register',
  wrap(async (req, res) => {
    const {
      name,
      phone,
      email,
      password
    } = req.body;

    if (
      !name ||
      !/^\d{10}$/.test(phone || '') ||
      (password || '').length < 6
    ) {
      throw Error(
        'Name, 10-digit phone and a password of 6+ characters are required'
      );
    }

    if (await User.exists({ phone })) {
      throw Error(
        'This phone number is already registered'
      );
    }

    const user = await User.create({
      name,
      phone,
      email,
      password: await bcrypt.hash(password, 10)
    });

    res.json({
      token: sign(user),
      user: pub(user)
    });
  })
);

app.post(
  '/api/auth/login',
  wrap(async (req, res) => {
    const {
      id,
      password
    } = req.body;

    const user = await User.findOne({
      $or: [
        { phone: id },
        { email: id }
      ]
    });

    if (
      !user ||
      !(await bcrypt.compare(
        password || '',
        user.password
      ))
    ) {
      throw Error(
        'Wrong phone/email or password'
      );
    }

    res.json({
      token: sign(user),
      user: pub(user)
    });
  })
);

app.post(
  '/api/auth/forgot-password',
  wrap(async (req, res) => {
    const { id } = req.body;

    if (!id?.trim()) {
      throw Error(
        'Phone number or email is required'
      );
    }

    const value = id.trim();

    const user = await User.findOne({
      $or: [
        { phone: value },
        { email: value }
      ]
    });

    if (!user) {
      throw Error(
        'No account found with this phone/email'
      );
    }

    const code = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    resetCodes.set(value, {
      code,
      expiresAt:
        Date.now() + 10 * 60 * 1000
    });

    console.log(
      `FreshKart password reset code for ${value}: ${code}`
    );

    res.json({
      message:
        'Reset code generated successfully.',
      demoCode: code
    });
  })
);

app.post(
  '/api/auth/reset-password',
  wrap(async (req, res) => {
    const {
      id,
      code,
      newPassword
    } = req.body;

    if (
      !id?.trim() ||
      !code?.trim() ||
      !newPassword
    ) {
      throw Error(
        'Phone/email, reset code and new password are required'
      );
    }

    if (newPassword.length < 6) {
      throw Error(
        'New password must be at least 6 characters'
      );
    }

    const value = id.trim();

    const saved = resetCodes.get(value);

    if (!saved) {
      throw Error(
        'Reset code not found. Please request a new code.'
      );
    }

    if (Date.now() > saved.expiresAt) {
      resetCodes.delete(value);

      throw Error(
        'Reset code has expired. Please request a new one.'
      );
    }

    if (saved.code !== code.trim()) {
      throw Error(
        'Invalid reset code'
      );
    }

    const user = await User.findOne({
      $or: [
        { phone: value },
        { email: value }
      ]
    });

    if (!user) {
      throw Error('User not found');
    }

    user.password =
      await bcrypt.hash(
        newPassword,
        10
      );

    await user.save();

    resetCodes.delete(value);

    res.json({
      ok: true,
      message:
        'Password reset successfully'
    });
  })
);

app.get(
  '/api/auth/me',
  auth,
  wrap(async (req, res) => {
    const user =
      await User.findById(req.user.id);

    res.json(pub(user));
  })
);

app.put(
  '/api/auth/me',
  auth,
  wrap(async (req, res) => {
    const {
      name,
      email
    } = req.body;

    if (!name?.trim()) {
      throw Error(
        'Name is required'
      );
    }

    const user =
      await User.findByIdAndUpdate(
        req.user.id,
        {
          $set: {
            name: name.trim(),
            email: (email || '').trim()
          }
        },
        {
          new: true,
          runValidators: true
        }
      );

    if (!user) {
      throw Error(
        'User not found'
      );
    }

    res.json({
      user: pub(user)
    });
  })
);

/* =====================================================
   PRODUCTS / CATALOG
===================================================== */

app.get(
  '/api/products',
  wrap(async (req, res) => {
    const {
      category,
      q,
      sort
    } = req.query;

    const filter = {
      active: true
    };

    if (category) {
      filter.category = category;
    }

    if (q) {
      const safeQuery =
        q.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&'
        );

      filter.name = new RegExp(
        safeQuery,
        'i'
      );
    }

    let sortObject = {
      name: 1
    };

    if (sort === 'low') {
      sortObject = {
        price: 1
      };
    }

    if (sort === 'high') {
      sortObject = {
        price: -1
      };
    }

    res.json(
      await Product.find(filter).sort(
        sortObject
      )
    );
  })
);

app.get(
  '/api/admin/products',
  auth,
  admin,
  wrap(async (req, res) => {
    res.json(
      await Product.find().sort({
        name: 1
      })
    );
  })
);

app.post(
  '/api/admin/products',
  auth,
  admin,
  wrap(async (req, res) => {
    const product =
      await Product.create(req.body);

    res.json(product);
  })
);

app.put(
  '/api/admin/products/:id',
  auth,
  admin,
  wrap(async (req, res) => {
    const product =
      await Product.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true
        }
      );

    if (!product) {
      throw Error(
        'Product not found'
      );
    }

    res.json(product);
  })
);

app.delete(
  '/api/admin/products/:id',
  auth,
  admin,
  wrap(async (req, res) => {
    const product =
      await Product.findByIdAndDelete(
        req.params.id
      );

    if (!product) {
      throw Error(
        'Product not found'
      );
    }

    res.json({
      ok: true
    });
  })
);

/* =====================================================
   CUSTOMER ORDERS
===================================================== */

app.post(
  '/api/orders',
  auth,
  wrap(async (req, res) => {
    const {
      items,
      address,
      phone,
      slot,
      note
    } = req.body;

    if (!items?.length) {
      throw Error(
        'Your cart is empty'
      );
    }

    const settings =
      await getStoreSettings();

    const pincode =
      String(
        address?.pincode || ''
      );

    if (
      !settings.pincodes.includes(
        pincode
      )
    ) {
      throw Error(
        'Sorry, we do not deliver to this pincode yet'
      );
    }

    if (
      !address?.line ||
      !/^\d{10}$/.test(
        phone || ''
      )
    ) {
      throw Error(
        'A delivery address and 10-digit phone are required'
      );
    }

    if (
      !settings.slots.includes(slot)
    ) {
      throw Error(
        'Please choose a delivery slot'
      );
    }

    const done = [];
    const lines = [];
    let subtotal = 0;

    try {
      for (const item of items) {
        const qty = Number(
          item.qty
        );

        if (!(qty > 0)) {
          throw Error(
            'Invalid quantity'
          );
        }

        const product =
          await Product.findOneAndUpdate(
            {
              _id: item.product,
              active: true,
              stock: {
                $gte: qty
              }
            },
            {
              $inc: {
                stock: -qty
              }
            },
            {
              new: true
            }
          );

        if (!product) {
          throw Error(
            `${item.name || 'An item'} is out of stock`
          );
        }

        done.push({
          id: product._id,
          qty
        });

        subtotal +=
          product.price * qty;

        lines.push({
          product: product._id,
          name: product.name,
          price: product.price,
          qty,
          unit: product.unit
        });
      }

      if (
        subtotal <
        settings.minOrder
      ) {
        throw Error(
          `Minimum order is ₹${settings.minOrder}`
        );
      }
    } catch (error) {
      await Promise.all(
        done.map(item =>
          Product.updateOne(
            {
              _id: item.id
            },
            {
              $inc: {
                stock: item.qty
              }
            }
          )
        )
      );

      throw error;
    }

    const deliveryCharge =
      subtotal >=
      settings.freeAbove
        ? 0
        : settings.deliveryCharge;

    const order =
      await Order.create({
        user: req.user.id,
        items: lines,
        address,
        phone,
        slot,
        note,
        subtotal,
        deliveryCharge,
        total:
          subtotal +
          deliveryCharge
      });

    notify(
      phone,
      `FreshKart: order placed. Pay ₹${order.total} on delivery (${slot}).`
    );

    res.json(order);
  })
);

app.get(
  '/api/orders/mine',
  auth,
  wrap(async (req, res) => {
    res.json(
      await Order.find({
        user: req.user.id
      }).sort({
        createdAt: -1
      })
    );
  })
);

app.patch(
  '/api/orders/:id/cancel',
  auth,
  wrap(async (req, res) => {
    const order =
      await Order.findOne({
        _id: req.params.id,
        user: req.user.id
      });

    if (
      !order ||
      ![
        'Placed',
        'Confirmed'
      ].includes(order.status)
    ) {
      throw Error(
        'This order can no longer be cancelled'
      );
    }

    order.status =
      'Cancelled';

    await order.save();

    await restock(order);

    res.json(order);
  })
);

/* =====================================================
   ADMIN ORDERS
===================================================== */

app.get(
  '/api/admin/orders',
  auth,
  admin,
  wrap(async (req, res) => {
    const filter =
      req.query.status
        ? {
            status:
              req.query.status
          }
        : {};

    const orders =
      await Order.find(filter)
        .populate(
          'user',
          'name phone'
        )
        .sort({
          createdAt: -1
        })
        .limit(200);

    res.json(orders);
  })
);

app.patch(
  '/api/admin/orders/:id',
  auth,
  admin,
  wrap(async (req, res) => {
    const {
      status,
      cashCollected
    } = req.body;

    const order =
      await Order.findById(
        req.params.id
      );

    if (!order) {
      throw Error(
        'Order not found'
      );
    }

    if (status) {
      if (
        !STATUSES.includes(status)
      ) {
        throw Error(
          'Invalid status'
        );
      }

      if (
        order.status ===
          'Cancelled' &&
        status !== 'Cancelled'
      ) {
        throw Error(
          'Cancelled orders cannot be reopened'
        );
      }

      if (
        status === 'Cancelled' &&
        order.status !== 'Cancelled'
      ) {
        await restock(order);
      }

      order.status = status;

      notify(
        order.phone,
        `FreshKart: your order is now ${status}`
      );
    }

    if (
      typeof cashCollected ===
      'boolean'
    ) {
      order.cashCollected =
        cashCollected;
    }

    await order.save();

    res.json(order);
  })
);

/* =====================================================
   ADMIN DASHBOARD STATS
===================================================== */

app.get(
  '/api/admin/stats',
  auth,
  admin,
  wrap(async (req, res) => {
    const since =
      new Date();

    since.setHours(
      0,
      0,
      0,
      0
    );

    const live = {
      status: {
        $ne: 'Cancelled'
      }
    };

    const [
      today,
      top,
      low,
      cash
    ] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: since
            },
            ...live
          }
        },
        {
          $group: {
            _id: null,
            orders: {
              $sum: 1
            },
            sales: {
              $sum: '$total'
            }
          }
        }
      ]),

      Order.aggregate([
        {
          $match: live
        },
        {
          $unwind: '$items'
        },
        {
          $group: {
            _id: '$items.name',
            qty: {
              $sum: '$items.qty'
            }
          }
        },
        {
          $sort: {
            qty: -1
          }
        },
        {
          $limit: 5
        }
      ]),

      Product.find({
        stock: {
          $lte: 5
        }
      }).select(
        'name stock'
      ),

      Order.aggregate([
        {
          $match: {
            status: 'Delivered',
            cashCollected: false
          }
        },
        {
          $group: {
            _id: null,
            due: {
              $sum: '$total'
            }
          }
        }
      ])
    ]);

    res.json({
      today:
        today[0] || {
          orders: 0,
          sales: 0
        },
      top,
      low,
      cashToCollect:
        cash[0]?.due || 0
    });
  })
);

/* =====================================================
   ADMIN CUSTOMERS
===================================================== */

app.get(
  '/api/admin/customers',
  auth,
  admin,
  wrap(async (req, res) => {
    const q =
      (req.query.q || '').trim();

    const filter = {
      role: {
        $ne: 'admin'
      }
    };

    if (q) {
      const safe =
        q.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&'
        );

      const regex =
        new RegExp(
          safe,
          'i'
        );

      filter.$or = [
        { name: regex },
        { phone: regex },
        { email: regex }
      ];
    }

    const customers =
      await User.find(filter)
        .select('-password')
        .sort({
          createdAt: -1
        })
        .limit(500);

    const ids =
      customers.map(
        customer =>
          customer._id
      );

    const stats =
      await Order.aggregate([
        {
          $match: {
            user: {
              $in: ids
            }
          }
        },
        {
          $group: {
            _id: '$user',
            orders: {
              $sum: 1
            },
            spent: {
              $sum: '$total'
            }
          }
        }
      ]);

    const map =
      new Map(
        stats.map(item => [
          String(item._id),
          item
        ])
      );

    res.json(
      customers.map(customer => ({
        ...customer.toObject(),

        orders:
          map.get(
            String(customer._id)
          )?.orders || 0,

        spent:
          map.get(
            String(customer._id)
          )?.spent || 0
      }))
    );
  })
);

/* =====================================================
   ADMIN INVENTORY
===================================================== */

app.get(
  '/api/admin/inventory',
  auth,
  admin,
  wrap(async (req, res) => {
    const products =
      await Product.find()
        .sort({
          stock: 1,
          category: 1,
          name: 1
        });

    res.json(products);
  })
);

app.patch(
  '/api/admin/inventory/:id',
  auth,
  admin,
  wrap(async (req, res) => {
    const {
      stock,
      active
    } = req.body;

    const update = {};

    if (stock !== undefined) {
      const value =
        Number(stock);

      if (
        !Number.isFinite(
          value
        ) ||
        value < 0
      ) {
        throw Error(
          'Stock must be 0 or more'
        );
      }

      update.stock =
        Math.floor(value);
    }

    if (
      active !== undefined
    ) {
      update.active =
        !!active;
    }

    if (
      !Object.keys(update)
        .length
    ) {
      throw Error(
        'Nothing to update'
      );
    }

    const product =
      await Product.findByIdAndUpdate(
        req.params.id,
        {
          $set: update
        },
        {
          new: true,
          runValidators: true
        }
      );

    if (!product) {
      throw Error(
        'Product not found'
      );
    }

    res.json(product);
  })
);

/* =====================================================
   ADMIN REPORTS
===================================================== */

app.get(
  '/api/admin/reports',
  auth,
  admin,
  wrap(async (req, res) => {
    const now =
      new Date();

    const start =
      new Date(now);

    start.setHours(
      0,
      0,
      0,
      0
    );

    const days = [];

    for (
      let i = 6;
      i >= 0;
      i--
    ) {
      const day =
        new Date(start);

      day.setDate(
        day.getDate() - i
      );

      days.push(day);
    }

    const since =
      days[0];

    const [
      summary,
      daily,
      statuses,
      topProducts
    ] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: since
            },
            status: {
              $ne: 'Cancelled'
            }
          }
        },
        {
          $group: {
            _id: null,
            orders: {
              $sum: 1
            },
            sales: {
              $sum: '$total'
            },
            avgOrder: {
              $avg: '$total'
            }
          }
        }
      ]),

      Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: since
            },
            status: {
              $ne: 'Cancelled'
            }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format:
                  '%Y-%m-%d',
                date:
                  '$createdAt'
              }
            },
            orders: {
              $sum: 1
            },
            sales: {
              $sum: '$total'
            }
          }
        },
        {
          $sort: {
            _id: 1
          }
        }
      ]),

      Order.aggregate([
        {
          $group: {
            _id: '$status',
            count: {
              $sum: 1
            }
          }
        },
        {
          $sort: {
            count: -1
          }
        }
      ]),

      Order.aggregate([
        {
          $match: {
            status: {
              $ne: 'Cancelled'
            }
          }
        },
        {
          $unwind: '$items'
        },
        {
          $group: {
            _id:
              '$items.name',

            qty: {
              $sum:
                '$items.qty'
            },

            sales: {
              $sum: {
                $multiply: [
                  '$items.price',
                  '$items.qty'
                ]
              }
            }
          }
        },
        {
          $sort: {
            qty: -1
          }
        },
        {
          $limit: 10
        }
      ])
    ]);

    res.json({
      summary:
        summary[0] || {
          orders: 0,
          sales: 0,
          avgOrder: 0
        },

      daily,
      statuses,
      topProducts
    });
  })
);

/* =====================================================
   ADMIN SETTINGS
===================================================== */

app.get(
  '/api/admin/settings',
  auth,
  admin,
  wrap(async (req, res) => {
    res.json(
      await getStoreSettings()
    );
  })
);

app.put(
  '/api/admin/settings',
  auth,
  admin,
  wrap(async (req, res) => {
    const {
      storeName,
      storePhone,
      minOrder,
      deliveryCharge,
      freeAbove,
      pincodes,
      slots
    } = req.body;

    const cleanPincodes =
      Array.isArray(pincodes)
        ? pincodes
            .map(String)
            .map(value =>
              value.trim()
            )
            .filter(Boolean)
        : [];

    const cleanSlots =
      Array.isArray(slots)
        ? slots
            .map(String)
            .map(value =>
              value.trim()
            )
            .filter(Boolean)
        : [];

    if (
      !String(
        storeName || ''
      ).trim()
    ) {
      throw Error(
        'Store name is required'
      );
    }

    if (
      !cleanPincodes.length
    ) {
      throw Error(
        'Add at least one delivery pincode'
      );
    }

    if (
      !cleanSlots.length
    ) {
      throw Error(
        'Add at least one delivery slot'
      );
    }

    const values = {
      minOrder:
        Number(minOrder),

      deliveryCharge:
        Number(deliveryCharge),

      freeAbove:
        Number(freeAbove)
    };

    if (
      Object.values(values).some(
        value =>
          !Number.isFinite(
            value
          ) ||
          value < 0
      )
    ) {
      throw Error(
        'Charges and minimum order must be valid numbers'
      );
    }

    const settings =
      await Settings.findOneAndUpdate(
        {},

        {
          $set: {
            storeName:
              String(
                storeName
              ).trim(),

            storePhone:
              String(
                storePhone || ''
              ).trim(),

            ...values,

            pincodes:
              cleanPincodes,

            slots:
              cleanSlots
          }
        },

        {
          new: true,
          upsert: true,
          setDefaultsOnInsert:
            true,
          runValidators: true
        }
      );

    res.json(settings);
  })
);

/* =====================================================
   DATABASE + SEED
===================================================== */

mongoose
  .connect(
    process.env.MONGO_URI
  )
  .then(async () => {
    console.log(
      'MongoDB connected'
    );

    if (
      !await User.exists({
        role: 'admin'
      })
    ) {
      await User.create({
        name: 'Admin',

        phone:
          process.env.ADMIN_PHONE ||
          '9999999999',

        password:
          await bcrypt.hash(
            process.env.ADMIN_PASSWORD ||
              'admin123',
            10
          ),

        role: 'admin'
      });

      console.log(
        'Admin user created'
      );
    }

    const seedProducts = [
      {
        name: 'Tomato',
        category: 'Vegetables',
        price: 30,
        unit: 'kg',
        stock: 50,
        image:
          'https://images.pexels.com/photos/8016790/pexels-photo-8016790.jpeg?auto=compress&cs=tinysrgb&w=900'
      },

      {
        name: 'Potato',
        category: 'Vegetables',
        price: 25,
        unit: 'kg',
        stock: 80,
        image:
          'https://images.pexels.com/photos/4110456/pexels-photo-4110456.jpeg?auto=compress&cs=tinysrgb&w=900'
      },

      {
        name: 'Spinach (Palak)',
        category: 'Vegetables',
        price: 20,
        unit: 'piece',
        stock: 30,
        image:
          'https://images.pexels.com/photos/1656663/pexels-photo-1656663.jpeg?auto=compress&cs=tinysrgb&w=900'
      },

      {
        name: 'Banana',
        category: 'Fruits',
        price: 50,
        unit: 'dozen',
        stock: 40,
        image:
          'https://images.pexels.com/photos/4114143/pexels-photo-4114143.jpeg?auto=compress&cs=tinysrgb&w=900'
      },

      {
        name: 'Apple',
        category: 'Fruits',
        price: 160,
        unit: 'kg',
        stock: 25,
        image:
          'https://images.pexels.com/photos/5876762/pexels-photo-5876762.jpeg?auto=compress&cs=tinysrgb&w=900'
      },

      {
        name: 'Fresh Milk',
        category: 'Dairy',
        price: 60,
        unit: 'litre',
        stock: 40,
        image:
          'https://images.pexels.com/photos/5652184/pexels-photo-5652184.jpeg?auto=compress&cs=tinysrgb&w=900'
      },

      {
        name: 'Paneer',
        category: 'Dairy',
        price: 700,
        unit: 'kg',
        stock: 18,
        image:
          'https://images.pexels.com/photos/30858420/pexels-photo-30858420.jpeg?auto=compress&cs=tinysrgb&w=900'
      },

      {
        name: 'Whole Wheat Atta',
        category: 'Groceries',
        price: 240,
        unit: '5 kg',
        stock: 25,
        image:
          'https://images.pexels.com/photos/6287223/pexels-photo-6287223.jpeg?auto=compress&cs=tinysrgb&w=900'
      },

      {
        name: 'Oats',
        category: 'Grains',
        price: 180,
        unit: 'pack',
        stock: 22,
        image:
          'https://images.pexels.com/photos/4725735/pexels-photo-4725735.jpeg?auto=compress&cs=tinysrgb&w=900'
      },

      {
        name: 'Turmeric Powder',
        category: 'Spices',
        price: 95,
        unit: 'pack',
        stock: 30,
        image:
          'https://images.pexels.com/photos/4198019/pexels-photo-4198019.jpeg?auto=compress&cs=tinysrgb&w=900'
      },

      {
        name: 'Basmati Rice',
        category: 'Groceries',
        price: 180,
        unit: 'kg',
        stock: 35,
        image:
          'https://images.pexels.com/photos/17563535/pexels-photo-17563535.jpeg?auto=compress&cs=tinysrgb&w=900'
      },

      {
        name: 'Toor Dal',
        category: 'Groceries',
        price: 150,
        unit: 'kg',
        stock: 30,
        image:
          'https://images.pexels.com/photos/6086414/pexels-photo-6086414.jpeg?auto=compress&cs=tinysrgb&w=900'
      },

      {
        name: 'Brown Bread',
        category: 'Bakery',
        price: 45,
        unit: 'piece',
        stock: 20,
        image:
          'https://images.pexels.com/photos/8599585/pexels-photo-8599585.jpeg?auto=compress&cs=tinysrgb&w=900'
      },

      {
        name: 'Butter Croissant',
        category: 'Bakery',
        price: 80,
        unit: 'piece',
        stock: 16,
        image:
          'https://images.pexels.com/photos/3850349/pexels-photo-3850349.jpeg?auto=compress&cs=tinysrgb&w=900'
      },

      {
        name: 'Potato Chips',
        category: 'Snacks',
        price: 30,
        unit: 'pack',
        stock: 45,
        image:
          'https://images.pexels.com/photos/13060681/pexels-photo-13060681.jpeg?auto=compress&cs=tinysrgb&w=900'
      },

      {
        name: 'Chocolate Biscuits',
        category: 'Snacks',
        price: 40,
        unit: 'pack',
        stock: 35,
        image:
          'https://images.pexels.com/photos/2226977/pexels-photo-2226977.jpeg?auto=compress&cs=tinysrgb&w=900'
      },

      {
        name: 'Orange Juice',
        category: 'Beverages',
        price: 110,
        unit: 'litre',
        stock: 24,
        image:
          'https://images.pexels.com/photos/13427966/pexels-photo-13427966.jpeg?auto=compress&cs=tinysrgb&w=900'
      },

      {
        name: 'Ground Coffee',
        category: 'Beverages',
        price: 260,
        unit: 'pack',
        stock: 18,
        image:
          'https://images.pexels.com/photos/942803/pexels-photo-942803.jpeg?auto=compress&cs=tinysrgb&w=900'
      },

      {
        name: 'Dishwashing Liquid',
        category: 'Household',
        price: 125,
        unit: 'bottle',
        stock: 22,
        image:
          'https://images.pexels.com/photos/10573258/pexels-photo-10573258.jpeg?auto=compress&cs=tinysrgb&w=900'
      },

      {
        name: 'Laundry Detergent',
        category: 'Household',
        price: 299,
        unit: 'pack',
        stock: 20,
        image:
          'https://images.pexels.com/photos/5218021/pexels-photo-5218021.jpeg?auto=compress&cs=tinysrgb&w=900'
      },

      {
        name: 'Hand Wash',
        category: 'PersonalCare',
        price: 95,
        unit: 'bottle',
        stock: 28,
        image:
          'https://images.pexels.com/photos/4108116/pexels-photo-4108116.jpeg?auto=compress&cs=tinysrgb&w=900'
      },

      {
        name: 'Shampoo',
        category: 'PersonalCare',
        price: 220,
        unit: 'bottle',
        stock: 18,
        image:
          'https://images.pexels.com/photos/14149696/pexels-photo-14149696.jpeg?auto=compress&cs=tinysrgb&w=900'
      },

      {
        name: 'Face Moisturizer',
        category: 'Beauty',
        price: 299,
        unit: 'piece',
        stock: 14,
        image:
          'https://images.pexels.com/photos/7319145/pexels-photo-7319145.jpeg?auto=compress&cs=tinysrgb&w=900'
      },

      {
        name: 'Baby Care Wipes',
        category: 'Baby Care',
        price: 149,
        unit: 'pack',
        stock: 20,
        image:
          'https://images.pexels.com/photos/9771341/pexels-photo-9771341.jpeg?auto=compress&cs=tinysrgb&w=900'
      },

      {
        name: 'Pet Food',
        category: 'Pet Care',
        price: 399,
        unit: 'pack',
        stock: 14,
        image:
          'https://images.pexels.com/photos/12928245/pexels-photo-12928245.jpeg?auto=compress&cs=tinysrgb&w=900'
      },

      {
        name: 'Smartphone',
        category: 'Electronics',
        price: 12999,
        unit: 'piece',
        stock: 8,
        image:
          'https://images.pexels.com/photos/8408537/pexels-photo-8408537.jpeg?auto=compress&cs=tinysrgb&w=900'
      },

      {
        name: 'Wireless Headphones',
        category: 'Electronics',
        price: 1799,
        unit: 'piece',
        stock: 12,
        image:
          'https://images.pexels.com/photos/3394651/pexels-photo-3394651.jpeg?auto=compress&cs=tinysrgb&w=900'
      },

      {
        name: 'LED Table Lamp',
        category: 'Home & Kitchen',
        price: 699,
        unit: 'piece',
        stock: 15,
        image:
          'https://images.pexels.com/photos/8263851/pexels-photo-8263851.jpeg?auto=compress&cs=tinysrgb&w=900'
      },

      {
        name: 'Non-stick Fry Pan',
        category: 'Home & Kitchen',
        price: 899,
        unit: 'piece',
        stock: 10,
        image:
          'https://images.pexels.com/photos/10807704/pexels-photo-10807704.jpeg?auto=compress&cs=tinysrgb&w=900'
      },

      {
        name: 'Spiral Notebook',
        category: 'Stationery',
        price: 70,
        unit: 'piece',
        stock: 30,
        image:
          'https://images.pexels.com/photos/3650937/pexels-photo-3650937.jpeg?auto=compress&cs=tinysrgb&w=900'
      },

      {
        name: 'Ball Pen Set',
        category: 'Stationery',
        price: 60,
        unit: 'pack',
        stock: 40,
        image:
          'https://images.pexels.com/photos/983826/pexels-photo-983826.jpeg?auto=compress&cs=tinysrgb&w=900'
      },

      {
        name: 'Building Blocks',
        category: 'Toys',
        price: 499,
        unit: 'set',
        stock: 10,
        image:
          'https://images.pexels.com/photos/7301143/pexels-photo-7301143.jpeg?auto=compress&cs=tinysrgb&w=900'
      },

      {
        name: 'Frozen Mixed Vegetables',
        category: 'Frozen Foods',
        price: 180,
        unit: 'pack',
        stock: 18,
        image:
          'https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg?auto=compress&cs=tinysrgb&w=900'
      }
    ];

    for (const productData of seedProducts) {
      const existing =
        await Product.findOne({
          name: productData.name
        });

      if (!existing) {
        await Product.create(
          productData
        );
      } else {
        await Product.updateOne(
          {
            _id: existing._id
          },
          {
            $set: {
              name:
                productData.name,
              category:
                productData.category,
              price:
                productData.price,
              unit:
                productData.unit,
              stock:
                productData.stock,
              image:
                productData.image,
              active: true
            }
          }
        );
      }
    }

    console.log(
      'FreshKart products seeded'
    );

    app.listen(
      process.env.PORT || 5000,
      () =>
        console.log(
          `FreshKart API running on port ${
            process.env.PORT || 5000
          }`
        )
    );
  })
  .catch(error => {
    console.error(
      'MongoDB connection failed:',
      error.message
    );
  });
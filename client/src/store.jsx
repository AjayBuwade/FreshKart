import {
  createContext,
  useContext,
  useState,
  useEffect
} from 'react';

// =====================================================
// FRESHKART CONSTANTS
// =====================================================

export const PHONE = '919302576964';

export const EMOJI = {
  Vegetables: '🥦',
  Fruits: '🍎',
  Dairy: '🥛',
  Grains: '🌾',
  Spices: '🌶️',
  Snacks: '🍪',
  Beverages: '🥤',
  Groceries: '🛒',
  Bakery: '🥐',
  Household: '🧹',
  PersonalCare: '🧴',
  Beauty: '✨',
  'Baby Care': '🍼',
  'Pet Care': '🐾',
  Electronics: '📱',
  'Home & Kitchen': '🏠',
  Stationery: '📚',
  Toys: '🧸',
  'Frozen Foods': '🧊'
};


// =====================================================
// CONTEXT
// =====================================================

const Ctx = createContext();

export const useApp = () => useContext(Ctx);


// =====================================================
// PRODUCTION API
// =====================================================

const API_BASE =
  'https://freshkart-47e8.onrender.com/api';


// =====================================================
// API HELPER
// =====================================================

export const api = async (path, o = {}) => {

  const token =
    localStorage.getItem('fk_token') ||
    sessionStorage.getItem('fk_token');

  const response = await fetch(
    `${API_BASE}${path}`,
    {
      method: o.method || 'GET',

      headers: {
        'Content-Type': 'application/json',

        ...(token && {
          Authorization:
            'Bearer ' + token
        })
      },

      body: o.body
        ? JSON.stringify(o.body)
        : undefined
    }
  );


  // ---------------------------------------------------
  // Check whether server returned JSON
  // ---------------------------------------------------

  const contentType =
    response.headers.get(
      'content-type'
    ) || '';


  if (
    !contentType.includes(
      'application/json'
    )
  ) {

    const text =
      await response.text();

    throw Error(
      `Server returned ${response.status}. ${text.slice(
        0,
        150
      )}`
    );
  }


  // ---------------------------------------------------
  // Parse JSON
  // ---------------------------------------------------

  const data =
    await response.json();


  // ---------------------------------------------------
  // Handle API errors
  // ---------------------------------------------------

  if (!response.ok) {

    throw Error(
      data.error ||
      'Something went wrong'
    );
  }


  return data;
};


// =====================================================
// APP PROVIDER
// =====================================================

export function AppProvider({
  children
}) {

  // ===================================================
  // AUTH TOKEN CHECK
  // ===================================================

  const hasToken =
    !!localStorage.getItem(
      'fk_token'
    ) ||
    !!sessionStorage.getItem(
      'fk_token'
    );


  // ===================================================
  // USER
  // ===================================================

  const [user, setUser] =
    useState(null);


  // ===================================================
  // APP READY STATE
  // ===================================================

  const [ready, setReady] =
    useState(!hasToken);


  // ===================================================
  // STORE CONFIGURATION
  // ===================================================

  const [cfg, setCfg] =
    useState({
      categories: [],
      slots: [],
      pincodes: [],
      freeAbove: 500,
      deliveryCharge: 30,
      minOrder: 150
    });


  // ===================================================
  // CART
  // ===================================================

  const [cart, setCart] =
    useState(() => {

      try {

        return JSON.parse(
          localStorage.getItem(
            'fk_cart'
          ) || '[]'
        );

      } catch {

        return [];

      }

    });


  // ===================================================
  // WISHLIST
  // ===================================================

  const [wishlist, setWishlist] =
    useState(() => {

      try {

        return JSON.parse(
          localStorage.getItem(
            'fk_wishlist'
          ) || '[]'
        );

      } catch {

        return [];

      }

    });


  // ===================================================
  // LOAD CONFIG + AUTH USER
  // ===================================================

  useEffect(() => {

    // -----------------------------------------------
    // Load FreshKart configuration
    // -----------------------------------------------

    api('/config')
      .then(setCfg)
      .catch(() => {});


    // -----------------------------------------------
    // Find saved token
    // -----------------------------------------------

    const token =
      localStorage.getItem(
        'fk_token'
      ) ||
      sessionStorage.getItem(
        'fk_token'
      );


    // -----------------------------------------------
    // If no token, app is already ready
    // -----------------------------------------------

    if (!token) {

      setReady(true);

      return;

    }


    // -----------------------------------------------
    // Validate existing token
    // -----------------------------------------------

    api('/auth/me')

      .then(setUser)

      .catch(() => {

        localStorage.removeItem(
          'fk_token'
        );

        sessionStorage.removeItem(
          'fk_token'
        );

        setUser(null);

      })

      .finally(() => {

        setReady(true);

      });

  }, []);


  // ===================================================
  // SAVE CART
  // ===================================================

  useEffect(() => {

    localStorage.setItem(
      'fk_cart',
      JSON.stringify(cart)
    );

  }, [cart]);


  // ===================================================
  // SAVE WISHLIST
  // ===================================================

  useEffect(() => {

    localStorage.setItem(
      'fk_wishlist',
      JSON.stringify(wishlist)
    );

  }, [wishlist]);


  // ===================================================
  // LOGIN
  // ===================================================

  const login = (
    { token, user },
    remember = true
  ) => {

    // Remove old tokens first

    localStorage.removeItem(
      'fk_token'
    );

    sessionStorage.removeItem(
      'fk_token'
    );


    // Remember me ON
    // -----------------

    if (remember) {

      localStorage.setItem(
        'fk_token',
        token
      );

    }

    // Remember me OFF
    // ----------------

    else {

      sessionStorage.setItem(
        'fk_token',
        token
      );

    }


    setUser(user);

  };


  // ===================================================
  // LOGOUT
  // ===================================================

  const logout = () => {

    localStorage.removeItem(
      'fk_token'
    );

    sessionStorage.removeItem(
      'fk_token'
    );

    setUser(null);

  };


  // ===================================================
  // UPDATE PROFILE
  // ===================================================

  const updateProfile =
    async body => {

      const data =
        await api(
          '/auth/me',
          {
            method: 'PUT',
            body
          }
        );


      setUser(
        data.user
      );


      return data.user;

    };


  // ===================================================
  // ADD / REMOVE CART ITEMS
  // ===================================================

  const add = (
    product,
    direction = 1
  ) => {

    setCart(currentCart => {

      const existing =
        currentCart.find(
          item =>
            item._id ===
            product._id
        );


      const currentQty =
        existing?.qty || 0;


      const newQty =
        currentQty +
        direction;


      const limitedQty =
        Math.min(
          newQty,
          Number(
            product.stock
          ) || 0
        );


      // ---------------------------------------------
      // Remove product completely
      // ---------------------------------------------

      if (newQty <= 0) {

        return currentCart.filter(
          item =>
            item._id !==
            product._id
        );

      }


      // ---------------------------------------------
      // Existing product
      // ---------------------------------------------

      if (existing) {

        return currentCart.map(
          item =>

            item._id ===
            product._id

              ? {
                  ...item,
                  qty: limitedQty
                }

              : item
        );

      }


      // ---------------------------------------------
      // New product
      // ---------------------------------------------

      if (limitedQty > 0) {

        return [
          ...currentCart,
          {
            ...product,
            qty: limitedQty
          }
        ];

      }


      return currentCart;

    });

  };


  // ===================================================
  // WISHLIST TOGGLE
  // ===================================================

  const toggleWishlist =
    product => {

      setWishlist(
        currentWishlist => {

          const exists =
            currentWishlist.some(
              item =>
                item._id ===
                product._id
            );


          if (exists) {

            return currentWishlist.filter(
              item =>
                item._id !==
                product._id
            );

          }


          return [
            ...currentWishlist,
            product
          ];

        }
      );

    };


  // ===================================================
  // CHECK WISHLIST
  // ===================================================

  const isWishlisted =
    product => {

      return wishlist.some(
        item =>
          item._id ===
          product._id
      );

    };


  // ===================================================
  // CART TOTAL
  // ===================================================

  const total =
    cart.reduce(
      (sum, item) =>
        sum +
        item.price *
          item.qty,
      0
    );


  // ===================================================
  // DELIVERY FEE
  // ===================================================

  const fee =
    total >= cfg.freeAbove
      ? 0
      : cfg.deliveryCharge;


  // ===================================================
  // PROVIDER
  // ===================================================

  return (

    <Ctx.Provider
      value={{
        // Authentication
        user,
        ready,
        login,
        logout,

        // Configuration
        cfg,

        // Cart
        cart,
        setCart,
        add,
        total,
        fee,

        // Profile
        updateProfile,

        // Wishlist
        wishlist,
        toggleWishlist,
        isWishlisted
      }}
    >

      {children}

    </Ctx.Provider>

  );

}
import { create } from 'zustand';
import {
  AddOnOption,
  CartItem,
  Category,
  MenuItem,
  Order,
  SiteConfig,
  SpiceLevel,
} from '../types';
import { CATEGORIES, INITIAL_MENU } from '../data/initialMenu';
import { INITIAL_CONFIG } from '../data/initialConfig';
import {
  fetchConfig,
  fetchMenu,
  saveConfig,
  saveMenuItem,
  subscribeOrder,
} from '../lib/firebase';
import { validateCoupon } from '../utils/kitchenLogic';

const LS_ACTIVE_ORDER_ID = 'sh_active_order_id_v1';
const LS_CURRENCY = 'sh_currency_pref_v1';

interface KitchenStore {
  // Menu & Site Config
  menu: MenuItem[];
  categories: Category[];
  config: SiteConfig;
  currency: 'NPR' | 'INR';
  isLoaded: boolean;

  // Search & Navigation Filters
  selectedCategory: number;
  searchQuery: string;
  dietFilter: 'all' | 'v' | 'n' | 'best';

  // Cart
  cart: CartItem[];
  riderTip: number;
  couponCode: string;
  couponDiscount: number;
  couponError: string | null;

  // Modals & Sheets
  selectedDish: MenuItem | null;
  isCartOpen: boolean;
  isCheckoutOpen: boolean;
  isTrackingOpen: boolean;
  isMyOrdersOpen: boolean;
  isStaffOpen: boolean;
  isFounderGuideOpen: boolean;
  isChatOpen: boolean;

  // Active Order & Tracking
  activeOrderId: string | null;
  activeOrder: Order | null;
  orderUnsubscribe: (() => void) | null;

  // Actions
  init: () => Promise<void>;
  setCurrency: (c: 'NPR' | 'INR') => void;
  setSelectedCategory: (catId: number) => void;
  setSearchQuery: (q: string) => void;
  setDietFilter: (f: 'all' | 'v' | 'n' | 'best') => void;

  // Dish Sheet Modal
  openDishModal: (dish: MenuItem) => void;
  closeDishModal: () => void;

  // Modals
  setCartOpen: (open: boolean) => void;
  setCheckoutOpen: (open: boolean) => void;
  setTrackingOpen: (open: boolean) => void;
  setMyOrdersOpen: (open: boolean) => void;
  setStaffOpen: (open: boolean) => void;
  setFounderGuideOpen: (open: boolean) => void;
  setChatOpen: (open: boolean) => void;

  // Cart Management
  addToCart: (
    item: MenuItem,
    qty: number,
    spice: SpiceLevel,
    addons: AddOnOption[],
    itemNote: string
  ) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartItemQty: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  setRiderTip: (tip: number) => void;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;
  reorder: (order: Order) => void;

  // Order Tracking
  setActiveOrderId: (orderId: string | null) => void;
  setActiveOrder: (order: Order | null) => void;

  // CMS / Staff actions
  toggleSoldOut: (uid: string) => Promise<void>;
  updateMenuItem: (item: MenuItem) => Promise<void>;
  addMenuItem: (item: MenuItem) => Promise<void>;
  updateSiteConfig: (config: SiteConfig) => Promise<void>;
}

export const useKitchenStore = create<KitchenStore>((set, get) => ({
  menu: INITIAL_MENU,
  categories: CATEGORIES,
  config: INITIAL_CONFIG,
  currency: (localStorage.getItem(LS_CURRENCY) as 'NPR' | 'INR') || 'NPR',
  isLoaded: false,

  selectedCategory: 0,
  searchQuery: '',
  dietFilter: 'all',

  cart: [],
  riderTip: 20,
  couponCode: '',
  couponDiscount: 0,
  couponError: null,

  selectedDish: null,
  isCartOpen: false,
  isCheckoutOpen: false,
  isTrackingOpen: false,
  isMyOrdersOpen: false,
  isStaffOpen: false,
  isFounderGuideOpen: false,
  isChatOpen: false,

  activeOrderId: localStorage.getItem(LS_ACTIVE_ORDER_ID),
  activeOrder: null,
  orderUnsubscribe: null,

  init: async () => {
    try {
      const [loadedMenu, loadedConfig] = await Promise.all([fetchMenu(), fetchConfig()]);
      set({ menu: loadedMenu, config: loadedConfig, isLoaded: true });

      // Check if there was an active order in localStorage
      const savedOrderId = localStorage.getItem(LS_ACTIVE_ORDER_ID);
      if (savedOrderId) {
        get().setActiveOrderId(savedOrderId);
      }
    } catch (e) {
      console.error('Initialization error:', e);
      set({ isLoaded: true });
    }
  },

  setCurrency: (c) => {
    localStorage.setItem(LS_CURRENCY, c);
    set({ currency: c });
  },

  setSelectedCategory: (catId) => set({ selectedCategory: catId }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setDietFilter: (f) => set({ dietFilter: f }),

  openDishModal: (dish) => set({ selectedDish: dish }),
  closeDishModal: () => set({ selectedDish: null }),

  setCartOpen: (open) => set({ isCartOpen: open }),
  setCheckoutOpen: (open) => set({ isCheckoutOpen: open }),
  setTrackingOpen: (open) => set({ isTrackingOpen: open }),
  setMyOrdersOpen: (open) => set({ isMyOrdersOpen: open }),
  setStaffOpen: (open) => set({ isStaffOpen: open }),
  setFounderGuideOpen: (open) => set({ isFounderGuideOpen: open }),
  setChatOpen: (open) => set({ isChatOpen: open }),

  addToCart: (item, qty, spice, addons, itemNote) => {
    const addonPriceSum = addons.reduce((sum, a) => sum + a.price, 0);
    const unitPrice = item.p + addonPriceSum;

    // Check if identical item (same uid, spice, addons, note) exists
    const addonIds = addons.map((a) => a.id).sort().join(',');
    const cartItemId = `${item.uid}-${spice}-${addonIds}-${itemNote.trim()}`;

    const currentCart = get().cart;
    const existingIndex = currentCart.findIndex((c) => c.cartItemId === cartItemId);

    let updatedCart: CartItem[];
    if (existingIndex >= 0) {
      updatedCart = [...currentCart];
      updatedCart[existingIndex].qty += qty;
    } else {
      updatedCart = [
        ...currentCart,
        {
          cartItemId,
          item,
          qty,
          spice,
          addons,
          itemNote: itemNote.trim(),
          unitPrice,
        },
      ];
    }

    set({ cart: updatedCart, isCartOpen: true });

    // Revalidate coupon if one is applied
    const state = get();
    if (state.couponCode) {
      state.applyCoupon(state.couponCode);
    }
  },

  removeFromCart: (cartItemId) => {
    const updated = get().cart.filter((c) => c.cartItemId !== cartItemId);
    set({ cart: updated });
    const state = get();
    if (state.couponCode) {
      state.applyCoupon(state.couponCode);
    }
  },

  updateCartItemQty: (cartItemId, delta) => {
    const updated = get()
      .cart.map((c) => {
        if (c.cartItemId === cartItemId) {
          const newQty = c.qty + delta;
          return newQty > 0 ? { ...c, qty: newQty } : null;
        }
        return c;
      })
      .filter((c): c is CartItem => c !== null);

    set({ cart: updated });
    const state = get();
    if (state.couponCode) {
      state.applyCoupon(state.couponCode);
    }
  },

  clearCart: () => {
    set({ cart: [], couponCode: '', couponDiscount: 0, couponError: null });
  },

  setRiderTip: (tip) => set({ riderTip: tip }),

  applyCoupon: (code) => {
    const subtotal = get().cart.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
    const result = validateCoupon(code, subtotal);

    if (result.valid) {
      set({
        couponCode: code.trim().toUpperCase(),
        couponDiscount: result.discount,
        couponError: null,
      });
    } else {
      set({
        couponCode: '',
        couponDiscount: 0,
        couponError: result.error || 'Invalid coupon',
      });
    }
  },

  removeCoupon: () => {
    set({ couponCode: '', couponDiscount: 0, couponError: null });
  },

  reorder: (order) => {
    // Reorder that refills the cart with the same customizations
    const reorderedCart: CartItem[] = order.items.map((it) => {
      const foundItem = get().menu.find((m) => m.uid === it.uid) || {
        uid: it.uid,
        name: it.name,
        p: it.unitPrice,
        cat: 0,
        t: 'n',
        desc: '',
        out: false,
        hid: false,
      };

      const addonIds = (it.addons || []).map((a) => a.id).sort().join(',');
      const cartItemId = `${it.uid}-${it.spice}-${addonIds}-${(it.note || '').trim()}`;

      return {
        cartItemId,
        item: foundItem,
        qty: it.qty,
        spice: it.spice,
        addons: it.addons || [],
        itemNote: it.note || '',
        unitPrice: it.unitPrice,
      };
    });

    set({
      cart: reorderedCart,
      isCartOpen: true,
      isMyOrdersOpen: false,
    });
  },

  setActiveOrderId: (orderId) => {
    // Clean previous listener
    const currentUnsub = get().orderUnsubscribe;
    if (currentUnsub) {
      currentUnsub();
    }

    if (!orderId) {
      localStorage.removeItem(LS_ACTIVE_ORDER_ID);
      set({ activeOrderId: null, activeOrder: null, orderUnsubscribe: null });
      return;
    }

    localStorage.setItem(LS_ACTIVE_ORDER_ID, orderId);

    const unsub = subscribeOrder(orderId, (order) => {
      set({ activeOrder: order });
    });

    set({ activeOrderId: orderId, orderUnsubscribe: unsub });
  },

  setActiveOrder: (order) => set({ activeOrder: order }),

  toggleSoldOut: async (uid) => {
    const updatedMenu = get().menu.map((item) => {
      if (item.uid === uid) {
        const out = !item.out;
        const updated = { ...item, out };
        saveMenuItem(updated);
        return updated;
      }
      return item;
    });
    set({ menu: updatedMenu });
  },

  updateMenuItem: async (item) => {
    const updatedMenu = get().menu.map((m) => (m.uid === item.uid ? item : m));
    set({ menu: updatedMenu });
    await saveMenuItem(item);
  },

  addMenuItem: async (item) => {
    const updatedMenu = [...get().menu, item];
    set({ menu: updatedMenu });
    await saveMenuItem(item);
  },

  updateSiteConfig: async (newConfig) => {
    set({ config: newConfig });
    await saveConfig(newConfig);
  },
}));

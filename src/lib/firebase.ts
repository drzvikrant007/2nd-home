import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  Firestore,
  Unsubscribe,
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, Auth } from 'firebase/auth';
import { MenuItem, Order, OrderStage, RiderDetails, SiteConfig } from '../types';
import { INITIAL_MENU } from '../data/initialMenu';
import { INITIAL_CONFIG } from '../data/initialConfig';

// Environment variables or fallback config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-firebase-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'second-home-brt.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'second-home-brt',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'second-home-brt.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef',
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let isRealFirebase = false;

// Initialize Firebase if configured
try {
  if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    isRealFirebase = true;
  }
} catch (err) {
  console.warn('Firebase initialization skipped, using local synchronized persistence:', err);
}

// Local storage keys for caching and fallback
const LS_MENU_KEY = 'second_home_menu_v1';
const LS_CONFIG_KEY = 'second_home_config_v1';
const LS_ORDERS_KEY = 'second_home_orders_v1';
const LS_ANON_UID_KEY = 'second_home_anon_uid_v1';

// In-memory / window event dispatchers for real-time reactivity when offline/local
type OrderListener = (order: Order | null) => void;
type OrdersListListener = (orders: Order[]) => void;
const orderSubscribers = new Map<string, Set<OrderListener>>();
const allOrdersSubscribers = new Set<OrdersListListener>();

function notifyOrderUpdate(order: Order) {
  const subs = orderSubscribers.get(order.orderId);
  if (subs) {
    subs.forEach((cb) => cb(order));
  }
  const allOrders = getLocalOrders();
  allOrdersSubscribers.forEach((cb) => cb(allOrders));
}

function getLocalOrders(): Order[] {
  try {
    const raw = localStorage.getItem(LS_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalOrders(orders: Order[]) {
  try {
    localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Failed to save orders locally', e);
  }
}

/**
 * Gets or creates anonymous user ID
 */
export async function getAnonymousUserId(): Promise<string> {
  // If real auth is available
  if (auth) {
    try {
      if (auth.currentUser) return auth.currentUser.uid;
      const cred = await signInAnonymously(auth);
      return cred.user.uid;
    } catch {
      // Fallback
    }
  }

  // Fallback persistent anonymous ID
  let anonUid = localStorage.getItem(LS_ANON_UID_KEY);
  if (!anonUid) {
    anonUid = 'anon_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    localStorage.setItem(LS_ANON_UID_KEY, anonUid);
  }
  return anonUid;
}

/**
 * Fetches menu items
 */
export async function fetchMenu(): Promise<MenuItem[]> {
  if (db && isRealFirebase) {
    try {
      const menuCol = collection(db, 'menu');
      const snap = await getDocs(menuCol);
      if (!snap.empty) {
        const items: MenuItem[] = [];
        snap.forEach((d) => items.push(d.data() as MenuItem));
        localStorage.setItem(LS_MENU_KEY, JSON.stringify(items));
        return items;
      }
    } catch (e) {
      console.warn('Firestore fetch menu error, falling back to local:', e);
    }
  }

  // Local storage fallback
  try {
    const local = localStorage.getItem(LS_MENU_KEY);
    if (local) {
      return JSON.parse(local);
    }
  } catch (e) {
    console.error(e);
  }

  // Default seed menu
  localStorage.setItem(LS_MENU_KEY, JSON.stringify(INITIAL_MENU));
  return INITIAL_MENU;
}

/**
 * Saves a single menu item
 */
export async function saveMenuItem(item: MenuItem): Promise<void> {
  // Update local
  const current = await fetchMenu();
  const index = current.findIndex((m) => m.uid === item.uid);
  if (index >= 0) {
    current[index] = item;
  } else {
    current.push(item);
  }
  localStorage.setItem(LS_MENU_KEY, JSON.stringify(current));

  // Sync to Firestore if available
  if (db && isRealFirebase) {
    try {
      await setDoc(doc(db, 'menu', item.uid), item, { merge: true });
    } catch (e) {
      console.warn('Firestore saveMenuItem error:', e);
    }
  }
}

/**
 * Saves entire menu in batch
 */
export async function saveMenuBatch(items: MenuItem[]): Promise<void> {
  localStorage.setItem(LS_MENU_KEY, JSON.stringify(items));
  if (db && isRealFirebase) {
    try {
      for (const item of items) {
        await setDoc(doc(db, 'menu', item.uid), item, { merge: true });
      }
    } catch (e) {
      console.warn('Firestore saveMenuBatch error:', e);
    }
  }
}

/**
 * Fetches site config
 */
export async function fetchConfig(): Promise<SiteConfig> {
  if (db && isRealFirebase) {
    try {
      const snap = await getDoc(doc(db, 'config', 'site'));
      if (snap.exists()) {
        const conf = snap.data() as SiteConfig;
        localStorage.setItem(LS_CONFIG_KEY, JSON.stringify(conf));
        return conf;
      }
    } catch (e) {
      console.warn('Firestore fetchConfig error:', e);
    }
  }

  try {
    const local = localStorage.getItem(LS_CONFIG_KEY);
    if (local) return JSON.parse(local);
  } catch (e) {
    console.error(e);
  }

  localStorage.setItem(LS_CONFIG_KEY, JSON.stringify(INITIAL_CONFIG));
  return INITIAL_CONFIG;
}

/**
 * Saves site config
 */
export async function saveConfig(config: SiteConfig): Promise<void> {
  localStorage.setItem(LS_CONFIG_KEY, JSON.stringify(config));
  if (db && isRealFirebase) {
    try {
      await setDoc(doc(db, 'config', 'site'), config, { merge: true });
    } catch (e) {
      console.warn('Firestore saveConfig error:', e);
    }
  }
}

/**
 * Creates new order
 */
export async function createOrder(order: Order): Promise<void> {
  // Store locally
  const orders = getLocalOrders();
  orders.unshift(order);
  saveLocalOrders(orders);
  notifyOrderUpdate(order);

  // Firestore sync
  if (db && isRealFirebase) {
    try {
      await setDoc(doc(db, 'orders', order.orderId), order);
    } catch (e) {
      console.warn('Firestore createOrder error:', e);
    }
  }
}

/**
 * Real-time listener for a single order by ID
 */
export function subscribeOrder(orderId: string, callback: (order: Order | null) => void): Unsubscribe {
  // Real Firestore listener
  if (db && isRealFirebase) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const unsubscribe = onSnapshot(orderRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Order;
          callback(data);
        } else {
          // Check local
          const localOrder = getLocalOrders().find((o) => o.orderId === orderId) || null;
          callback(localOrder);
        }
      });
      return unsubscribe;
    } catch (e) {
      console.warn('Firestore onSnapshot error, falling back to local observer:', e);
    }
  }

  // Local observer
  if (!orderSubscribers.has(orderId)) {
    orderSubscribers.set(orderId, new Set());
  }
  const set = orderSubscribers.get(orderId)!;
  set.add(callback);

  // Initial emit
  const initial = getLocalOrders().find((o) => o.orderId === orderId) || null;
  callback(initial);

  return () => {
    set.delete(callback);
    if (set.size === 0) {
      orderSubscribers.delete(orderId);
    }
  };
}

/**
 * Real-time listener for all orders (for KDS)
 */
export function subscribeAllOrders(callback: (orders: Order[]) => void): Unsubscribe {
  if (db && isRealFirebase) {
    try {
      const ordersCol = collection(db, 'orders');
      const unsubscribe = onSnapshot(ordersCol, (snap) => {
        const list: Order[] = [];
        snap.forEach((d) => list.push(d.data() as Order));
        list.sort((a, b) => b.createdAt - a.createdAt);
        callback(list);
      });
      return unsubscribe;
    } catch (e) {
      console.warn('Firestore onSnapshot error for all orders:', e);
    }
  }

  allOrdersSubscribers.add(callback);
  callback(getLocalOrders());

  return () => {
    allOrdersSubscribers.delete(callback);
  };
}

/**
 * Updates order stage & rider in KDS
 */
export async function updateOrderStage(
  orderId: string,
  stage: OrderStage,
  rider: RiderDetails | null = null,
  status: Order['status'] = 'cooking'
): Promise<void> {
  const orders = getLocalOrders();
  const idx = orders.findIndex((o) => o.orderId === orderId);
  if (idx >= 0) {
    orders[idx] = {
      ...orders[idx],
      stage,
      rider: rider ?? orders[idx].rider,
      status,
    };
    saveLocalOrders(orders);
    notifyOrderUpdate(orders[idx]);
  }

  if (db && isRealFirebase) {
    try {
      const payload: Partial<Order> = { stage, status };
      if (rider) payload.rider = rider;
      await setDoc(doc(db, 'orders', orderId), payload, { merge: true });
    } catch (e) {
      console.warn('Firestore updateOrderStage error:', e);
    }
  }
}

/**
 * Fetches all orders belonging to customer UID
 */
export async function fetchCustomerOrders(customerUid: string): Promise<Order[]> {
  const all = getLocalOrders();
  return all.filter((o) => o.customerUid === customerUid || !o.customerUid);
}

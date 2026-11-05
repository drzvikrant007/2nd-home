export type DietType = 'v' | 'n' | 'e'; // 'v': veg, 'n': non-veg, 'e': egg

export interface MenuItem {
  uid: string;
  cat: number;
  name: string;
  p: number; // Price in NPR
  t: DietType;
  best?: boolean; // Bestseller
  desc: string;
  out?: boolean; // Sold out / "86"
  hid?: boolean; // Hidden from menu
  nepaliName?: string;
  nepaliDesc?: string;
}

export interface Category {
  id: number;
  name: string;
  emoji: string;
}

export type SpiceLevel = 'Mild' | 'Homestyle' | 'Hot 🔥' | 'Extra Hot 💀';

export interface AddOnOption {
  id: string;
  name: string;
  price: number; // in NPR
}

export interface CartItem {
  cartItemId: string; // unique per combination of item + customizations
  item: MenuItem;
  qty: number;
  spice: SpiceLevel;
  addons: AddOnOption[];
  itemNote: string; // Per-item kitchen note (separate from delivery order note)
  unitPrice: number; // price with addons
}

export type AddressType = 'Home' | 'Hostel/PG' | 'Night Office' | "Friend's Place";

export interface CustomerDetails {
  name: string;
  phone: string;
  address: string;
  addrType: AddressType;
  note: string; // Delivery note for rider (e.g. "Call on arrival, don't ring the bell")
}

export type PaymentMethod = 'qr' | 'whatsapp' | 'cod' | 'card';

export interface RiderDetails {
  name: string;
  phone: string;
  plate: string;
}

export type OrderStage = 0 | 1 | 2 | 3 | 4;
// 0: Order received & payment verified
// 1: Chef cooking
// 2: Double sealed in thermal foil
// 3: Night rider on the way
// 4: Delivered

export interface Order {
  orderId: string; // e.g. "SH-8492"
  customerUid: string;
  createdAt: number; // timestamp
  customer: CustomerDetails;
  items: Array<{
    uid: string;
    name: string;
    qty: number;
    spice: SpiceLevel;
    addons: AddOnOption[];
    note: string;
    unitPrice: number;
  }>;
  subtotal: number;
  surge: number;
  fee: number;
  disc: number;
  tip: number;
  total: number;
  pay: PaymentMethod;
  stage: OrderStage;
  status: 'pending' | 'cooking' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  rider: RiderDetails | null;
  eta: number; // ETA timestamp
  couponUsed?: string | null;
}

export interface SiteConfig {
  phones: string[];
  whatsappPhone: string;
  address: string;
  openingHour: number; // 18 = 6:00 PM
  openingMinute: number;
  closingHour: number; // 3 = 3:00 AM
  closingMinute: number;
  avgDeliveryMinutes: number; // default 24 min
  exchangeRateNprToInr: number; // e.g. 0.625 (1 NPR = 0.625 INR or 1 INR = 1.6 NPR)
  staffPin: string; // demo pin (default: "2024")
  qrImageUrl: string;
  socialHandle: string; // "secondhomebrt"
}

export interface Coupon {
  code: string;
  type: 'percent' | 'flat';
  value: number;
  minOrder: number;
  description: string;
}

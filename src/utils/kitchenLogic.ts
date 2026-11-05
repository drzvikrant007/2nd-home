import { SiteConfig } from '../types';
import { VALID_COUPONS } from '../data/initialConfig';

/**
 * Checks if the kitchen is currently open based on operating hours.
 * Default hours: 18:00 (6:00 PM) to 03:00 (3:00 AM) next morning.
 */
export function isOpenNow(config: Pick<SiteConfig, 'openingHour' | 'openingMinute' | 'closingHour' | 'closingMinute'>, date = new Date()): boolean {
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const openMinutes = config.openingHour * 60 + config.openingMinute; // 18*60 = 1080
  const closeMinutes = config.closingHour * 60 + config.closingMinute; // 3*60 = 180

  if (openMinutes > closeMinutes) {
    // Crosses midnight (e.g. 18:00 -> 03:00)
    return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
  } else {
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  }
}

/**
 * Computes status banner text and subtext
 */
export function getStatusBadge(config: SiteConfig, date = new Date()): {
  isOpen: boolean;
  statusText: string;
  pillText: string;
  timeRange: string;
} {
  const open = isOpenNow(config, date);
  const timeRange = '6:00 PM – 3:00 AM';

  if (open) {
    return {
      isOpen: true,
      pillText: 'OPEN NOW',
      statusText: `OPEN NOW • ${timeRange} • Avg Delivery: ${config.avgDeliveryMinutes} mins • Insulated Thermal Packing`,
      timeRange,
    };
  } else {
    return {
      isOpen: false,
      pillText: 'OPENS 6:00 PM',
      statusText: `OPENS 6:00 PM • Night Cloud Kitchen • Service: ${timeRange}`,
      timeRange,
    };
  }
}

/**
 * Checks if late-night surge applies (11:00 PM / 23:00 until kitchen closing at 03:00 AM)
 */
export function isLateNightSurge(date = new Date()): boolean {
  const hour = date.getHours();
  // 23:00 (11 PM) or 00:00, 01:00, 02:00
  return hour >= 23 || hour < 3;
}

/**
 * Delivery and packaging fee: Free above रू500, otherwise रू40
 */
export function calculateDeliveryFee(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= 500 ? 0 : 40;
}

/**
 * Late night surge fee: रू30 if late night
 */
export function getLateNightSurgeAmount(date = new Date()): number {
  return isLateNightSurge(date) ? 30 : 0;
}

/**
 * Validates discount coupon code
 */
export function validateCoupon(
  code: string,
  subtotal: number
): { valid: boolean; discount: number; error?: string } {
  const cleanCode = (code || '').trim().toUpperCase();
  if (!cleanCode) {
    return { valid: false, discount: 0, error: 'Please enter a coupon code' };
  }

  const coupon = VALID_COUPONS[cleanCode];
  if (!coupon) {
    return {
      valid: false,
      discount: 0,
      error: 'Invalid coupon code. Try HOMEFOOD15 or MIDNIGHT50',
    };
  }

  if (subtotal < coupon.minOrder) {
    return {
      valid: false,
      discount: 0,
      error: `Minimum order of रू${coupon.minOrder} required for coupon ${coupon.code}`,
    };
  }

  let discount = 0;
  if (coupon.type === 'percent') {
    discount = Math.round((subtotal * coupon.value) / 100);
  } else {
    discount = coupon.value;
  }

  // Discount cannot exceed subtotal
  discount = Math.min(discount, subtotal);

  return { valid: true, discount };
}

/**
 * Phone number validation:
 * Must match /^(\+?977)?\d{10}$/ or 10-digit local number
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s-]/g, '');
  const nepalRegex = /^(\+?977)?\d{10}$/;
  return nepalRegex.test(cleaned);
}

/**
 * Formats price in NPR (रू) or INR (₹)
 */
export function formatCurrency(
  amountNpr: number,
  currency: 'NPR' | 'INR',
  exchangeRate = 0.625
): string {
  if (currency === 'INR') {
    const inrValue = Math.round(amountNpr * exchangeRate);
    return `₹${inrValue.toLocaleString('en-IN')}`;
  }
  return `रू ${Math.round(amountNpr).toLocaleString('en-IN')}`;
}

/**
 * Calculates ETA and time remaining
 */
export function calculateETA(createdAtMs: number, avgDeliveryMinutes = 24) {
  const etaMs = createdAtMs + avgDeliveryMinutes * 60 * 1000;
  const diffMs = etaMs - Date.now();
  const minutesRemaining = Math.max(0, Math.ceil(diffMs / (60 * 1000)));

  const etaDate = new Date(etaMs);
  const hours = etaDate.getHours();
  const minutes = etaDate.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const formattedTime = `${displayHours}:${displayMinutes} ${ampm}`;

  return {
    etaMs,
    minutesRemaining,
    formattedTime,
  };
}

/**
 * Generates formatted WhatsApp order message
 */
export function generateWhatsAppOrderTicket(order: {
  orderId: string;
  customer: { name: string; phone: string; address: string; addrType: string; note: string };
  items: Array<{ name: string; qty: number; spice: string; addons?: Array<{ name: string }>; note?: string; unitPrice: number }>;
  subtotal: number;
  fee: number;
  surge: number;
  disc: number;
  tip: number;
  total: number;
  pay: string;
  whatsappPhone: string;
}): string {
  const lines: string[] = [
    `🌙 *SECOND HOME (2nd Home) - NIGHT ORDER*`,
    `*Order ID:* #${order.orderId}`,
    `----------------------------------------`,
    `👤 *Customer:* ${order.customer.name}`,
    `📞 *Phone:* ${order.customer.phone}`,
    `📍 *Delivery Address:* ${order.customer.address} (${order.customer.addrType})`,
  ];

  if (order.customer.note) {
    lines.push(`📝 *Rider Note:* "${order.customer.note}"`);
  }

  lines.push(`----------------------------------------`);
  lines.push(`🍽️ *ORDER ITEMS:*`);

  order.items.forEach((item, index) => {
    let itemLine = `${index + 1}. *${item.name}* x ${item.qty} (रू${item.unitPrice * item.qty})`;
    itemLine += `\n   🌶️ Spice: ${item.spice}`;
    if (item.addons && item.addons.length > 0) {
      itemLine += `\n   ➕ Addons: ${item.addons.map((a) => a.name).join(', ')}`;
    }
    if (item.note) {
      itemLine += `\n   💬 Kitchen Note: "${item.note}"`;
    }
    lines.push(itemLine);
  });

  lines.push(`----------------------------------------`);
  lines.push(`Subtotal: रू ${order.subtotal}`);
  if (order.fee > 0) lines.push(`Packaging & Delivery Fee: रू ${order.fee}`);
  if (order.surge > 0) lines.push(`Late Night Surge: रू ${order.surge}`);
  if (order.disc > 0) lines.push(`Discount Applied: -रू ${order.disc}`);
  if (order.tip > 0) lines.push(`Rider Tip: रू ${order.tip}`);
  lines.push(`*TOTAL: रू ${order.total}*`);
  lines.push(`Payment Mode: ${order.pay.toUpperCase()}`);
  lines.push(`----------------------------------------`);
  lines.push(`🚀 _Insulated Thermal Foil Packing • Hot & Fresh Delivery_`);

  const fullText = lines.join('\n');
  const cleanPhone = order.whatsappPhone.replace(/\D/g, '');
  return `https://wa.me/977${cleanPhone.replace(/^977/, '')}?text=${encodeURIComponent(fullText)}`;
}

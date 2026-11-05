import { AddOnOption, Coupon, SiteConfig } from '../types';

export const INITIAL_CONFIG: SiteConfig = {
  phones: ['+977-9761341498', '+977-9814110239'],
  whatsappPhone: '9761341498', // WhatsApp orders go to 9761341498
  address: 'Biratnagar-03, Morang, Nepal',
  openingHour: 18, // 6:00 PM
  openingMinute: 0,
  closingHour: 3, // 3:00 AM
  closingMinute: 0,
  avgDeliveryMinutes: 24,
  exchangeRateNprToInr: 0.625, // 1 NPR = 0.625 INR (₹)
  staffPin: '2024', // Demo PIN gate
  qrImageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80', // Default fallback or dynamic qrcode.react
  socialHandle: 'secondhomebrt',
};

export const AVAILABLE_ADDONS: AddOnOption[] = [
  { id: 'extra-cheese', name: 'Extra Cheese', price: 50 },
  { id: 'fried-egg', name: 'Fried Egg', price: 40 },
  { id: 'extra-gravy', name: 'Extra Gravy', price: 60 },
  { id: 'dipping-sauce', name: 'Special Dipping Sauce', price: 30 },
];

export const VALID_COUPONS: Record<string, Coupon> = {
  HOMEFOOD15: {
    code: 'HOMEFOOD15',
    type: 'percent',
    value: 15,
    minOrder: 300,
    description: '15% OFF on orders above रू300',
  },
  MIDNIGHT50: {
    code: 'MIDNIGHT50',
    type: 'flat',
    value: 50,
    minOrder: 500,
    description: 'Flat रू50 OFF on orders above रू500',
  },
};

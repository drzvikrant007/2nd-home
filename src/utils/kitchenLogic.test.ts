import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isOpenNow,
  isLateNightSurge,
  calculateDeliveryFee,
  validateCoupon,
  validatePhone,
  formatCurrency,
  calculateETA,
  generateWhatsAppOrderTicket,
} from './kitchenLogic';

test('isOpenNow correctly checks midnight operating hours (18:00 to 03:00)', () => {
  const config = {
    openingHour: 18,
    openingMinute: 0,
    closingHour: 3,
    closingMinute: 0,
  };

  // 19:30 (7:30 PM) -> OPEN
  const eveningOpen = new Date(2026, 10, 5, 19, 30);
  assert.equal(isOpenNow(config, eveningOpen), true);

  // 01:45 (1:45 AM) -> OPEN
  const midnightOpen = new Date(2026, 10, 5, 1, 45);
  assert.equal(isOpenNow(config, midnightOpen), true);

  // 02:59 (2:59 AM) -> OPEN
  const lateOpen = new Date(2026, 10, 5, 2, 59);
  assert.equal(isOpenNow(config, lateOpen), true);

  // 03:00 (3:00 AM) -> CLOSED
  const closingExact = new Date(2026, 10, 5, 3, 0);
  assert.equal(isOpenNow(config, closingExact), false);

  // 12:00 (Noon) -> CLOSED
  const afternoonClosed = new Date(2026, 10, 5, 12, 0);
  assert.equal(isOpenNow(config, afternoonClosed), false);

  // 17:59 (5:59 PM) -> CLOSED
  const preOpen = new Date(2026, 10, 5, 17, 59);
  assert.equal(isOpenNow(config, preOpen), false);

  // 18:00 (6:00 PM) -> OPEN
  const openExact = new Date(2026, 10, 5, 18, 0);
  assert.equal(isOpenNow(config, openExact), true);
});

test('isLateNightSurge triggers between 23:00 and 03:00', () => {
  // 22:45 (10:45 PM) -> no surge
  assert.equal(isLateNightSurge(new Date(2026, 10, 5, 22, 45)), false);

  // 23:00 (11:00 PM) -> surge
  assert.equal(isLateNightSurge(new Date(2026, 10, 5, 23, 0)), true);

  // 01:30 (1:30 AM) -> surge
  assert.equal(isLateNightSurge(new Date(2026, 10, 5, 1, 30)), true);

  // 03:15 (3:15 AM) -> no surge (closed)
  assert.equal(isLateNightSurge(new Date(2026, 10, 5, 3, 15)), false);
});

test('calculateDeliveryFee is free above रू500 and रू40 below', () => {
  assert.equal(calculateDeliveryFee(0), 0);
  assert.equal(calculateDeliveryFee(250), 40);
  assert.equal(calculateDeliveryFee(499), 40);
  assert.equal(calculateDeliveryFee(500), 0);
  assert.equal(calculateDeliveryFee(850), 0);
});

test('validateCoupon handles HOMEFOOD15 and MIDNIGHT50 with min orders', () => {
  // Empty
  assert.equal(validateCoupon('', 500).valid, false);

  // Invalid
  assert.equal(validateCoupon('DISCOUNT99', 500).valid, false);

  // HOMEFOOD15 min order 300
  const underMinHome = validateCoupon('HOMEFOOD15', 250);
  assert.equal(underMinHome.valid, false);
  assert.match(underMinHome.error || '', /Minimum order of रू300/);

  // HOMEFOOD15 valid (15% of 400 = 60)
  const validHome = validateCoupon('HOMEFOOD15', 400);
  assert.equal(validHome.valid, true);
  assert.equal(validHome.discount, 60);

  // MIDNIGHT50 min order 500
  const underMinMidnight = validateCoupon('MIDNIGHT50', 450);
  assert.equal(underMinMidnight.valid, false);

  // MIDNIGHT50 valid (flat 50)
  const validMidnight = validateCoupon('MIDNIGHT50', 600);
  assert.equal(validMidnight.valid, true);
  assert.equal(validMidnight.discount, 50);
});

test('validatePhone checks valid Nepal formats and 10-digit numbers', () => {
  assert.equal(validatePhone('+9779761341498'), true);
  assert.equal(validatePhone('9779814110239'), true);
  assert.equal(validatePhone('9761341498'), true);
  assert.equal(validatePhone('9814110239'), true);
  assert.equal(validatePhone('123'), false);
  assert.equal(validatePhone('abc9761341498'), false);
  assert.equal(validatePhone('976134149800'), false);
});

test('formatCurrency toggles between NPR and INR correctly', () => {
  assert.equal(formatCurrency(400, 'NPR'), 'रू 400');
  // 400 * 0.625 = 250
  assert.equal(formatCurrency(400, 'INR', 0.625), '₹250');
});

test('calculateETA produces valid delivery time and remaining minutes', () => {
  const now = Date.now();
  const eta = calculateETA(now, 24);
  assert.equal(eta.minutesRemaining >= 23 && eta.minutesRemaining <= 25, true);
  assert.match(eta.formattedTime, /(AM|PM)/);
});

test('generateWhatsAppOrderTicket produces valid formatted link', () => {
  const url = generateWhatsAppOrderTicket({
    orderId: 'SH-1234',
    customer: {
      name: 'Bikrant',
      phone: '9761341498',
      address: 'Main Road, Biratnagar',
      addrType: 'Home',
      note: 'Call on gate',
    },
    items: [
      {
        name: 'Chicken Steam Momo',
        qty: 2,
        spice: 'Hot 🔥',
        unitPrice: 200,
      },
    ],
    subtotal: 400,
    fee: 40,
    surge: 30,
    disc: 0,
    tip: 20,
    total: 490,
    pay: 'whatsapp',
    whatsappPhone: '9761341498',
  });

  assert.match(url, /^https:\/\/wa\.me\/9779761341498\?text=/);
  assert.match(decodeURIComponent(url), /SECOND HOME/);
  assert.match(decodeURIComponent(url), /Chicken Steam Momo/);
  assert.match(decodeURIComponent(url), /Call on gate/);
});

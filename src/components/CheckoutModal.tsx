import React, { useState } from 'react';
import {
  X,
  MapPin,
  Phone,
  User,
  CreditCard,
  QrCode,
  MessageCircle,
  Banknote,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { AddressType, CustomerDetails, Order, PaymentMethod } from '../types';
import { useKitchenStore } from '../store/useKitchenStore';
import {
  calculateDeliveryFee,
  formatCurrency,
  generateWhatsAppOrderTicket,
  getLateNightSurgeAmount,
  validatePhone,
} from '../utils/kitchenLogic';
import { createOrder, getAnonymousUserId } from '../lib/firebase';

const ADDRESS_TYPES: AddressType[] = ['Home', 'Hostel/PG', 'Night Office', "Friend's Place"];

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    setCheckoutOpen,
    cart,
    clearCart,
    riderTip,
    couponCode,
    couponDiscount,
    currency,
    config,
    setActiveOrderId,
    setTrackingOpen,
  } = useKitchenStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [addrType, setAddrType] = useState<AddressType>('Home');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('qr');
  const [phoneError, setPhoneError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [nameError, setNameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCheckoutOpen || cart.length === 0) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const deliveryFee = calculateDeliveryFee(subtotal);
  const surge = getLateNightSurgeAmount(new Date());
  const grandTotal = Math.max(0, subtotal + deliveryFee + surge + riderTip - couponDiscount);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;

    if (!name.trim()) {
      setNameError('Name is required');
      hasError = true;
    } else {
      setNameError('');
    }

    if (!phone.trim() || !validatePhone(phone)) {
      setPhoneError('Valid 10-digit Nepal mobile number is required (e.g. 9761341498)');
      hasError = true;
    } else {
      setPhoneError('');
    }

    if (!address.trim()) {
      setAddressError('Delivery address in Biratnagar is required');
      hasError = true;
    } else {
      setAddressError('');
    }

    if (payMethod === 'card') {
      alert('Card payments are coming soon. Please select QR, WhatsApp, or Cash on Delivery.');
      return;
    }

    if (hasError) return;

    setIsSubmitting(true);
    try {
      const customerUid = await getAnonymousUserId();
      const orderNum = Math.floor(1000 + Math.random() * 9000);
      const orderId = `SH-${orderNum}`;
      const now = Date.now();
      const eta = now + config.avgDeliveryMinutes * 60 * 1000;

      const customer: CustomerDetails = {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        addrType,
        note: deliveryNote.trim(),
      };

      const newOrder: Order = {
        orderId,
        customerUid,
        createdAt: now,
        customer,
        items: cart.map((c) => ({
          uid: c.item.uid,
          name: c.item.name,
          qty: c.qty,
          spice: c.spice,
          addons: c.addons,
          note: c.itemNote,
          unitPrice: c.unitPrice,
        })),
        subtotal,
        surge,
        fee: deliveryFee,
        disc: couponDiscount,
        tip: riderTip,
        total: grandTotal,
        pay: payMethod,
        stage: 0,
        status: 'pending',
        rider: null,
        eta,
        couponUsed: couponCode || null,
      };

      await createOrder(newOrder);

      // If WhatsApp 1-tap, trigger WhatsApp link
      if (payMethod === 'whatsapp') {
        const waUrl = generateWhatsAppOrderTicket({
          orderId,
          customer,
          items: newOrder.items,
          subtotal,
          fee: deliveryFee,
          surge,
          disc: couponDiscount,
          tip: riderTip,
          total: grandTotal,
          pay: 'WhatsApp 1-Tap',
          whatsappPhone: config.whatsappPhone,
        });
        window.open(waUrl, '_blank');
      }

      // Clear cart, close checkout, activate tracking
      clearCart();
      setCheckoutOpen(false);
      setActiveOrderId(orderId);
      setTrackingOpen(true);
    } catch (err) {
      console.error('Failed to submit order:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const qrPayload = `fonepay://pay?recipient=SecondHome&phone=${config.whatsappPhone}&amt=${grandTotal}&remark=Order`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={() => setCheckoutOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Checkout"
    >
      <div
        className="relative w-full max-w-xl bg-[#111827] border border-[#1f2937] rounded-3xl p-6 sm:p-7 shadow-2xl shadow-black max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1f2937]">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-heading">
              Midnight Delivery Checkout
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Biratnagar-03 • Sealed in insulated thermal foil
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCheckoutOpen(false)}
            className="p-2 text-gray-400 hover:text-white rounded-full bg-gray-800 transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmitOrder} className="py-5 space-y-5">
          {/* Customer Details: Name & Phone (Required) */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5 font-heading">
              <User className="w-4 h-4 text-orange-400" />
              Contact Information <span className="text-rose-400">*</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Bikrant Mandal"
                  className="w-full bg-[#090d16] border border-gray-700 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none min-h-[44px]"
                />
                {nameError && <p className="text-xs text-rose-400 mt-1">{nameError}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Nepal Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9761341498 or +977..."
                    className="w-full bg-[#090d16] border border-gray-700 focus:border-orange-500 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none min-h-[44px]"
                  />
                </div>
                {phoneError && <p className="text-xs text-rose-400 mt-1">{phoneError}</p>}
              </div>
            </div>
          </div>

          {/* Delivery Location & Address Type */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5 font-heading">
                <MapPin className="w-4 h-4 text-orange-400" />
                Delivery Address in Biratnagar <span className="text-rose-400">*</span>
              </h3>
            </div>

            <div>
              <textarea
                required
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, ward, landmark, building/room number..."
                className="w-full bg-[#090d16] border border-gray-700 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none min-h-[56px]"
              />
              {addressError && <p className="text-xs text-rose-400 mt-1">{addressError}</p>}
            </div>

            {/* Address Type Badges */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1" role="group" aria-label="Address Type">
              {ADDRESS_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAddrType(type)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer min-h-[44px] shrink-0 ${
                    addrType === type
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/60'
                      : 'bg-[#090d16] text-gray-400 border-gray-800 hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Rider Delivery Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Delivery Note for Night Rider
              </label>
              <input
                type="text"
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                placeholder="e.g. Call on arrival, don't ring the bell, leave at hostel reception..."
                className="w-full bg-[#090d16] border border-gray-700 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none min-h-[44px]"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5 font-heading">
              <CreditCard className="w-4 h-4 text-amber-400" />
              Choose Payment Method
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Option 1: Fonepay / eSewa / UPI QR */}
              <button
                type="button"
                onClick={() => setPayMethod('qr')}
                className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition cursor-pointer min-h-[44px] ${
                  payMethod === 'qr'
                    ? 'bg-orange-500/10 border-orange-500/60 text-white'
                    : 'bg-[#090d16] border-gray-800 text-gray-400 hover:bg-gray-800/50'
                }`}
              >
                <QrCode className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-white">Fonepay / eSewa QR</div>
                  <div className="text-[11px] text-gray-400">Scan & Pay Instantly</div>
                </div>
              </button>

              {/* Option 2: WhatsApp 1-Tap */}
              <button
                type="button"
                onClick={() => setPayMethod('whatsapp')}
                className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition cursor-pointer min-h-[44px] ${
                  payMethod === 'whatsapp'
                    ? 'bg-emerald-500/10 border-emerald-500/60 text-white'
                    : 'bg-[#090d16] border-gray-800 text-gray-400 hover:bg-gray-800/50'
                }`}
              >
                <MessageCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-white">WhatsApp 1-Tap</div>
                  <div className="text-[11px] text-gray-400">Send pre-formatted ticket</div>
                </div>
              </button>

              {/* Option 3: Cash on Delivery */}
              <button
                type="button"
                onClick={() => setPayMethod('cod')}
                className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition cursor-pointer min-h-[44px] ${
                  payMethod === 'cod'
                    ? 'bg-amber-500/10 border-amber-500/60 text-white'
                    : 'bg-[#090d16] border-gray-800 text-gray-400 hover:bg-gray-800/50'
                }`}
              >
                <Banknote className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-white">Cash on Delivery</div>
                  <div className="text-[11px] text-gray-400">Pay cash to rider</div>
                </div>
              </button>

              {/* Option 4: Card (Coming Soon) */}
              <div
                className="p-3 rounded-2xl border border-gray-800 bg-[#090d16]/50 text-gray-500 flex items-start gap-3 relative cursor-not-allowed opacity-60 min-h-[44px]"
              >
                <Lock className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-gray-400">Card Payment</div>
                  <div className="text-[10px] text-amber-400 font-bold uppercase mt-0.5">
                    Coming Soon
                  </div>
                </div>
              </div>
            </div>

            {/* QR Payment View Preview */}
            {payMethod === 'qr' && (
              <div className="p-4 rounded-2xl bg-[#090d16] border border-amber-500/20 text-center space-y-2">
                <span className="text-xs font-bold text-amber-300 block">
                  Scan to Pay {formatCurrency(grandTotal, currency, config.exchangeRateNprToInr)}
                </span>
                <div className="inline-block p-3 bg-white rounded-xl shadow-md">
                  <QRCodeSVG value={qrPayload} size={130} />
                </div>
                <p className="text-[11px] text-gray-400">
                  Accepts eSewa, Khalti, IME Pay, Fonepay & mobile banking apps
                </p>
              </div>
            )}
          </div>

          {/* Final Total and Order Confirmation */}
          <div className="pt-3 border-t border-[#1f2937] flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 block">Total Due</span>
              <span className="text-xl font-black text-white font-heading">
                {formatCurrency(grandTotal, currency, config.exchangeRateNprToInr)}
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3.5 bg-gradient-to-r from-[#ff6a1a] to-[#ffb020] hover:from-orange-500 hover:to-amber-500 text-gray-950 font-black rounded-2xl shadow-xl shadow-orange-500/25 active:scale-98 transition cursor-pointer min-h-[48px] flex items-center gap-2"
            >
              <span>{isSubmitting ? 'Placing Order...' : 'Confirm Order'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutModal;

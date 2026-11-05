import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Tag,
  AlertCircle,
  CheckCircle2,
  HeartHandshake,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useKitchenStore } from '../store/useKitchenStore';
import {
  calculateDeliveryFee,
  formatCurrency,
  getLateNightSurgeAmount,
  isLateNightSurge,
} from '../utils/kitchenLogic';
import { getAiComboSuggestion } from '../lib/aiClient';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setCartOpen,
    cart,
    removeFromCart,
    updateCartItemQty,
    clearCart,
    riderTip,
    setRiderTip,
    couponCode,
    couponDiscount,
    couponError,
    applyCoupon,
    removeCoupon,
    currency,
    config,
    setCheckoutOpen,
    menu,
    openDishModal,
  } = useKitchenStore();

  const [inputCoupon, setInputCoupon] = useState('');
  const [comboSuggestion, setComboSuggestion] = useState<string | null>(null);
  const [isSuggestingCombo, setIsSuggestingCombo] = useState(false);

  if (!isCartOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const deliveryFee = calculateDeliveryFee(subtotal);
  const surge = getLateNightSurgeAmount(new Date());
  const lateNightActive = isLateNightSurge(new Date());
  const grandTotal = Math.max(0, subtotal + deliveryFee + surge + riderTip - couponDiscount);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    applyCoupon(inputCoupon);
  };

  const handleSuggestCombo = async () => {
    if (cart.length < 2) return;
    setIsSuggestingCombo(true);
    try {
      const simplifiedItems = cart.map((c) => ({ name: c.item.name, qty: c.qty }));
      const availableDishes = menu.filter((m) => !m.out && !m.hid).map((m) => m.name);
      const res = await getAiComboSuggestion(simplifiedItems, availableDishes);
      setComboSuggestion(res);
    } finally {
      setIsSuggestingCombo(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => setCartOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Cart"
    >
      <div
        className="relative w-full max-w-md bg-[#111827] border-l border-[#1f2937] h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1f2937] bg-[#090d16]/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white font-heading">Midnight Cart</h2>
              <span className="text-xs text-gray-400">
                {cart.reduce((s, c) => s + c.qty, 0)} {cart.length === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs font-semibold text-gray-400 hover:text-rose-400 px-2 py-1 transition cursor-pointer min-h-[36px]"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={() => setCartOpen(false)}
              className="p-2 text-gray-400 hover:text-white rounded-full bg-gray-800/80 hover:bg-gray-700 transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cart Item List or Empty State */}
        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="p-5 rounded-3xl bg-gray-800/40 text-gray-400 mb-4 border border-[#1f2937]">
              <ShoppingBag className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-white font-heading">Your midnight cart is empty</h3>
            <p className="text-sm text-gray-400 mt-2 max-w-xs leading-relaxed">
              Satisfy your late night cravings! Add steaming momos, crispy starters, or homestyle biryani.
            </p>
            <button
              type="button"
              onClick={() => setCartOpen(false)}
              className="mt-6 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-gray-950 font-bold rounded-2xl shadow-lg shadow-orange-500/20 cursor-pointer min-h-[44px]"
            >
              Explore Night Menu
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Free Delivery Bar */}
            <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs">
              {subtotal >= 500 ? (
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Free insulated delivery unlocked (order &gt; रू500)!</span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-gray-300">
                  <span>
                    Add <strong className="text-amber-400 font-bold">रू{500 - subtotal}</strong> more for{' '}
                    <strong className="text-white">FREE Delivery</strong>
                  </span>
                  <span className="text-[10px] text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded">
                    रू40 fee
                  </span>
                </div>
              )}
            </div>

            {/* AI Combo Suggestion Trigger (when 2+ items) */}
            {cart.length >= 2 && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 to-orange-950/40 border border-amber-500/30 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Chef AI Midnight Pairings
                  </span>
                  <button
                    type="button"
                    onClick={handleSuggestCombo}
                    disabled={isSuggestingCombo}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 text-gray-950 font-bold text-[11px] hover:bg-amber-400 transition cursor-pointer min-h-[36px]"
                  >
                    {isSuggestingCombo ? 'Thinking...' : '🎯 Suggest a combo'}
                  </button>
                </div>
                {comboSuggestion && (
                  <p className="text-gray-200 leading-relaxed italic bg-black/30 p-2.5 rounded-xl border border-amber-500/20">
                    "{comboSuggestion}"
                  </p>
                )}
              </div>
            )}

            {/* Cart Items */}
            <div className="space-y-3">
              {cart.map((cartItem) => (
                <div
                  key={cartItem.cartItemId}
                  className="p-3.5 rounded-2xl bg-[#090d16]/80 border border-[#1f2937] space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-white font-heading">
                        {cartItem.item.name}
                      </h4>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5 text-[11px]">
                        <span className="text-orange-400 font-semibold">
                          🌶️ {cartItem.spice}
                        </span>
                        {cartItem.addons.map((addon) => (
                          <span
                            key={addon.id}
                            className="bg-gray-800 text-gray-300 px-1.5 py-0.2 rounded"
                          >
                            +{addon.name}
                          </span>
                        ))}
                      </div>
                      {cartItem.itemNote && (
                        <p className="text-[11px] text-amber-300/80 italic mt-1">
                          Note: "{cartItem.itemNote}"
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(cartItem.cartItemId)}
                      className="text-gray-500 hover:text-rose-400 p-1 cursor-pointer min-h-[36px]"
                      aria-label={`Remove ${cartItem.item.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm font-black text-white">
                      {formatCurrency(
                        cartItem.unitPrice * cartItem.qty,
                        currency,
                        config.exchangeRateNprToInr
                      )}
                    </span>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-2 bg-[#1f2937] p-1 rounded-xl border border-gray-700">
                      <button
                        type="button"
                        onClick={() => updateCartItemQty(cartItem.cartItemId, -1)}
                        className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center cursor-pointer min-h-[36px] min-w-[36px]"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-white">
                        {cartItem.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartItemQty(cartItem.cartItemId, 1)}
                        className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center cursor-pointer min-h-[36px] min-w-[36px]"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Box */}
            <div className="pt-2">
              <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-orange-400" />
                  Have a Coupon Code?
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputCoupon}
                    onChange={(e) => setInputCoupon(e.target.value)}
                    placeholder="HOMEFOOD15 or MIDNIGHT50"
                    className="flex-1 bg-[#090d16] border border-[#1f2937] focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 uppercase font-mono tracking-wider focus:outline-none min-h-[44px]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-xl transition cursor-pointer min-h-[44px]"
                  >
                    Apply
                  </button>
                </div>

                {couponDiscount > 0 && couponCode && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-xs text-emerald-300">
                    <span className="flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Code {couponCode} applied (-
                      {formatCurrency(couponDiscount, currency, config.exchangeRateNprToInr)})
                    </span>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-xs text-rose-400 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {couponError && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-400 p-2 rounded-xl bg-rose-950/30 border border-rose-500/30">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{couponError}</span>
                  </div>
                )}
              </form>
            </div>

            {/* Rider Tip Selection */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <HeartHandshake className="w-3.5 h-3.5 text-pink-400" />
                  Tip your Night Rider
                </span>
                <span className="text-[11px] text-gray-400">100% goes to rider</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[0, 20, 30, 50].map((tipOption) => (
                  <button
                    key={tipOption}
                    type="button"
                    onClick={() => setRiderTip(tipOption)}
                    className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer min-h-[44px] ${
                      riderTip === tipOption
                        ? 'bg-pink-500/20 text-pink-300 border-pink-500/60'
                        : 'bg-[#090d16] text-gray-400 border-gray-800 hover:bg-gray-800'
                    }`}
                  >
                    {tipOption === 0
                      ? 'No Tip'
                      : formatCurrency(tipOption, currency, config.exchangeRateNprToInr)}
                  </button>
                ))}
              </div>
            </div>

            {/* Bill Details Breakdown */}
            <div className="pt-3 border-t border-[#1f2937] space-y-2 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal, currency, config.exchangeRateNprToInr)}</span>
              </div>

              <div className="flex justify-between text-gray-400">
                <span className="flex items-center gap-1">
                  Packaging & Delivery Fee
                  {deliveryFee === 0 && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-bold">
                      FREE
                    </span>
                  )}
                </span>
                <span>{formatCurrency(deliveryFee, currency, config.exchangeRateNprToInr)}</span>
              </div>

              {lateNightActive && (
                <div className="flex justify-between text-amber-300 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Late-Night Surge (11 PM – 3 AM)
                  </span>
                  <span>{formatCurrency(surge, currency, config.exchangeRateNprToInr)}</span>
                </div>
              )}

              {riderTip > 0 && (
                <div className="flex justify-between text-pink-300">
                  <span>Rider Tip</span>
                  <span>{formatCurrency(riderTip, currency, config.exchangeRateNprToInr)}</span>
                </div>
              )}

              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Coupon Discount ({couponCode})</span>
                  <span>-{formatCurrency(couponDiscount, currency, config.exchangeRateNprToInr)}</span>
                </div>
              )}

              <div className="flex justify-between text-base font-black text-white pt-2 border-t border-[#1f2937] font-heading">
                <span>Total Amount</span>
                <span className="text-orange-400">
                  {formatCurrency(grandTotal, currency, config.exchangeRateNprToInr)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Checkout Button */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-[#1f2937] bg-[#090d16]/70">
            <button
              type="button"
              onClick={() => {
                setCartOpen(false);
                setCheckoutOpen(true);
              }}
              className="w-full flex items-center justify-between px-6 py-3.5 bg-gradient-to-r from-[#ff6a1a] to-[#ffb020] hover:from-orange-500 hover:to-amber-500 text-gray-950 font-black rounded-2xl shadow-xl shadow-orange-500/25 active:scale-98 transition cursor-pointer min-h-[48px]"
            >
              <span>Proceed to Checkout</span>
              <div className="flex items-center gap-2">
                <span>{formatCurrency(grandTotal, currency, config.exchangeRateNprToInr)}</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;

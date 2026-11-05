import React from 'react';
import { ShoppingBag, Clock, History, Compass, Sparkles } from 'lucide-react';
import { useKitchenStore } from '../store/useKitchenStore';
import BrandLogo from './BrandLogo';
import { formatCurrency } from '../utils/kitchenLogic';

export const Navbar: React.FC = () => {
  const {
    cart,
    currency,
    setCurrency,
    setCartOpen,
    setMyOrdersOpen,
    setTrackingOpen,
    setChatOpen,
    activeOrderId,
    config,
  } = useKitchenStore();

  const totalCartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);

  const scrollToMenu = () => {
    const el = document.getElementById('menu-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#090d16]/90 backdrop-blur-md border-b border-[#1f2937] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-2">
        {/* Brand Logo & Title */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center text-left cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-lg p-1"
          aria-label="Second Home Midnight Kitchen Home"
        >
          <BrandLogo size={42} showText={true} />
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5" aria-label="Main Navigation">
          <button
            onClick={scrollToMenu}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-300 hover:text-white hover:bg-gray-800/60 rounded-xl transition cursor-pointer min-h-[44px]"
          >
            <Compass className="w-4 h-4 text-orange-400" />
            Menu
          </button>

          <button
            onClick={() => setMyOrdersOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-300 hover:text-white hover:bg-gray-800/60 rounded-xl transition cursor-pointer min-h-[44px]"
          >
            <History className="w-4 h-4 text-orange-400" />
            My Orders
          </button>

          <button
            onClick={() => setTrackingOpen(true)}
            className="relative flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-300 hover:text-white hover:bg-gray-800/60 rounded-xl transition cursor-pointer min-h-[44px]"
          >
            <Clock className="w-4 h-4 text-orange-400" />
            Track Order
            {activeOrderId && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
          </button>

          <button
            onClick={() => setChatOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl transition cursor-pointer min-h-[44px]"
          >
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            Ask Chef AI
          </button>
        </nav>

        {/* Right Action Controls: Currency Toggle + Cart */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Currency Toggle (NPR रू / INR ₹) */}
          <div
            className="flex items-center bg-[#111827] border border-[#1f2937] p-1 rounded-xl text-xs font-bold"
            role="group"
            aria-label="Currency selection"
          >
            <button
              onClick={() => setCurrency('NPR')}
              className={`px-2.5 py-1.5 rounded-lg transition min-h-[36px] flex items-center cursor-pointer ${
                currency === 'NPR'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              aria-pressed={currency === 'NPR'}
            >
              रू NPR
            </button>
            <button
              onClick={() => setCurrency('INR')}
              className={`px-2.5 py-1.5 rounded-lg transition min-h-[36px] flex items-center cursor-pointer ${
                currency === 'INR'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              aria-pressed={currency === 'INR'}
            >
              ₹ INR
            </button>
          </div>

          {/* Cart Button */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-gradient-to-r from-[#ff6a1a] to-[#ffb020] text-gray-950 font-extrabold rounded-2xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 active:scale-95 transition-all cursor-pointer min-h-[44px]"
            aria-label={`Open shopping cart with ${totalCartCount} items`}
          >
            <ShoppingBag className="w-5 h-5 text-gray-950" />
            <span className="hidden sm:inline text-sm">Cart</span>
            {totalCartCount > 0 ? (
              <span className="flex items-center justify-center bg-gray-950 text-white text-xs font-bold px-2 py-0.5 rounded-full border border-orange-400/50">
                {totalCartCount}
              </span>
            ) : null}
            {totalCartCount > 0 && (
              <span className="text-xs font-extrabold text-gray-950 hidden md:inline ml-1 border-l border-gray-900/30 pl-2">
                {formatCurrency(cartSubtotal, currency, config.exchangeRateNprToInr)}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

import React from 'react';
import { ArrowDown, ShoppingBag, Clock, Flame, ShieldAlert, Sparkles, PhoneCall } from 'lucide-react';
import { BrandLogoSvg } from './BrandLogo';
import { useKitchenStore } from '../store/useKitchenStore';

export const Hero: React.FC = () => {
  const { setCartOpen, config } = useKitchenStore();

  const scrollToMenu = () => {
    const el = document.getElementById('menu-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-16 px-4 sm:px-6 lg:px-8 border-b border-[#1f2937]">
      {/* Background ambient radial gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto text-center relative z-10">
        {/* Large Brand Logo Centered */}
        <div className="inline-flex flex-col items-center justify-center mb-5 group">
          <div className="p-4 rounded-3xl bg-gradient-to-b from-[#111827] to-[#090d16] border border-[#1f2937] shadow-2xl shadow-orange-950/40 transform transition-transform group-hover:scale-105 duration-300">
            <BrandLogoSvg size={76} />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-extrabold tracking-widest uppercase px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full">
              🌙 Midnight Cloud Kitchen • Biratnagar
            </span>
          </div>
        </div>

        {/* Main Title & Tagline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white font-heading leading-tight mb-4">
          Good Food Feels Like <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6a1a] via-[#ffb020] to-yellow-400">Home</span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-gray-300 font-normal leading-relaxed mb-8">
          Biratnagar’s dedicated late-night kitchen. Piping hot momos, rich curries, fragrant biryanis, and crispy midnight bites sealed double in insulated thermal foil.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 mb-12">
          <button
            onClick={scrollToMenu}
            className="flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-[#ff6a1a] to-[#ffb020] hover:from-orange-500 hover:to-amber-500 text-gray-950 font-extrabold rounded-2xl shadow-xl shadow-orange-500/25 active:scale-95 transition-all text-base cursor-pointer min-h-[48px]"
          >
            <span>Order Now</span>
            <ArrowDown className="w-4 h-4 animate-bounce" />
          </button>

          <button
            onClick={() => setCartOpen(true)}
            className="flex items-center gap-2 px-6 py-3.5 bg-[#111827] hover:bg-gray-800 text-white font-bold border border-[#1f2937] hover:border-gray-600 rounded-2xl active:scale-95 transition-all text-base cursor-pointer min-h-[48px]"
          >
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <span>View Cart</span>
          </button>

          <a
            href={`tel:${config.phones[0]}`}
            className="flex items-center gap-2 px-5 py-3.5 bg-gray-900/60 hover:bg-gray-800 text-gray-300 hover:text-white font-medium border border-gray-800 rounded-2xl transition-all text-sm cursor-pointer min-h-[48px]"
          >
            <PhoneCall className="w-4 h-4 text-emerald-400" />
            <span>Direct Call</span>
          </a>
        </div>

        {/* Three Prominent Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {/* Stat 1 */}
          <div className="p-4 rounded-2xl bg-[#111827]/80 border border-[#1f2937] flex items-center gap-3.5 text-left">
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-white font-heading">
                ~{config.avgDeliveryMinutes} Mins
              </div>
              <div className="text-xs text-gray-400">
                Average hot delivery time
              </div>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="p-4 rounded-2xl bg-[#111827]/80 border border-[#1f2937] flex items-center gap-3.5 text-left">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-white font-heading">
                Thermal Foil
              </div>
              <div className="text-xs text-gray-400">
                Double sealed & insulated
              </div>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="p-4 rounded-2xl bg-[#111827]/80 border border-[#1f2937] flex items-center gap-3.5 text-left">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-white font-heading">
                6 PM – 3 AM
              </div>
              <div className="text-xs text-gray-400">
                Open every night in Biratnagar
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

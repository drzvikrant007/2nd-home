import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Check, Flame, Languages, Sparkles } from 'lucide-react';
import { AddOnOption, MenuItem, SpiceLevel } from '../types';
import { AVAILABLE_ADDONS } from '../data/initialConfig';
import { useKitchenStore } from '../store/useKitchenStore';
import { formatCurrency } from '../utils/kitchenLogic';
import { getAiNepaliTranslation } from '../lib/aiClient';

interface DishSheetProps {
  dish: MenuItem | null;
  onClose: () => void;
}

const SPICE_LEVELS: SpiceLevel[] = ['Mild', 'Homestyle', 'Hot 🔥', 'Extra Hot 💀'];

export const DishSheet: React.FC<DishSheetProps> = ({ dish, onClose }) => {
  const { addToCart, currency, config } = useKitchenStore();

  const [qty, setQty] = useState(1);
  const [spice, setSpice] = useState<SpiceLevel>('Homestyle');
  const [selectedAddons, setSelectedAddons] = useState<AddOnOption[]>([]);
  const [itemNote, setItemNote] = useState('');

  // Nepali translation toggle state
  const [isNepali, setIsNepali] = useState(false);
  const [nepaliData, setNepaliData] = useState<{ nepaliName: string; nepaliDesc: string } | null>(null);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    // Reset state when dish changes
    if (dish) {
      setQty(1);
      setSpice('Homestyle');
      setSelectedAddons([]);
      setItemNote('');
      setIsNepali(false);
      setNepaliData(null);
    }
  }, [dish]);

  if (!dish) return null;

  const toggleAddon = (addon: AddOnOption) => {
    if (selectedAddons.some((a) => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter((a) => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const handleNepaliToggle = async () => {
    if (!isNepali) {
      if (!nepaliData) {
        setTranslating(true);
        try {
          const res = await getAiNepaliTranslation(dish.name, dish.desc);
          setNepaliData(res);
        } finally {
          setTranslating(false);
        }
      }
      setIsNepali(true);
    } else {
      setIsNepali(false);
    }
  };

  const addonTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const singleUnitPrice = dish.p + addonTotal;
  const grandTotal = singleUnitPrice * qty;

  const handleConfirm = () => {
    addToCart(dish, qty, spice, selectedAddons, itemNote);
    onClose();
  };

  const displayName = isNepali && nepaliData ? nepaliData.nepaliName : dish.name;
  const displayDesc = isNepali && nepaliData ? nepaliData.nepaliDesc : dish.desc;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Customize ${dish.name}`}
    >
      <div
        className="relative w-full max-w-lg bg-[#111827] border border-[#1f2937] rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 shadow-2xl shadow-black/80 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title and Close Button */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#1f2937]">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {/* Diet Indicator */}
              <span
                className={`w-4 h-4 rounded-sm flex items-center justify-center border p-0.5 ${
                  dish.t === 'v'
                    ? 'border-emerald-500 text-emerald-500'
                    : dish.t === 'e'
                    ? 'border-yellow-400 text-yellow-400'
                    : 'border-rose-500 text-rose-500'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    dish.t === 'v'
                      ? 'bg-emerald-500'
                      : dish.t === 'e'
                      ? 'bg-yellow-400'
                      : 'bg-rose-500'
                  }`}
                />
              </span>

              {/* Nepali Toggle Button */}
              <button
                type="button"
                onClick={handleNepaliToggle}
                disabled={translating}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition border cursor-pointer min-h-[36px] ${
                  isNepali
                    ? 'bg-orange-500 text-gray-950 border-orange-400'
                    : 'bg-[#1f2937] text-gray-300 border-gray-700 hover:text-white'
                }`}
                aria-pressed={isNepali}
                aria-label="Toggle Nepali translation"
              >
                <Languages className={`w-3.5 h-3.5 ${translating ? 'animate-spin' : ''}`} />
                <span>{isNepali ? '🇳🇵 Nepali (Active)' : '🇳🇵 Translate to Nepali'}</span>
              </button>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white font-heading">
              {displayName}
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 leading-relaxed">
              {displayDesc}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-full bg-gray-800/80 hover:bg-gray-700 transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close customization sheet"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Customizations */}
        <div className="py-4 space-y-6">
          {/* Spice Level Section */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-sm font-extrabold text-white flex items-center gap-1.5 font-heading">
                <Flame className="w-4 h-4 text-orange-400" />
                Select Spice Level
              </label>
              <span className="text-xs text-orange-400 font-semibold">{spice}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup" aria-label="Spice level">
              {SPICE_LEVELS.map((level) => {
                const isSelected = spice === level;
                return (
                  <button
                    key={level}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSpice(level)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition text-center cursor-pointer min-h-[44px] flex items-center justify-center ${
                      isSelected
                        ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white border-orange-400 shadow-md shadow-orange-950/40'
                        : 'bg-[#1f2937]/70 text-gray-300 border-gray-700 hover:bg-gray-800'
                    }`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add-ons Section */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-sm font-extrabold text-white flex items-center gap-1.5 font-heading">
                <Plus className="w-4 h-4 text-amber-400" />
                Optional Add-ons
              </label>
              <span className="text-xs text-gray-400">Multiple allowed</span>
            </div>

            <div className="space-y-2">
              {AVAILABLE_ADDONS.map((addon) => {
                const isChecked = selectedAddons.some((a) => a.id === addon.id);
                return (
                  <button
                    key={addon.id}
                    type="button"
                    onClick={() => toggleAddon(addon)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm font-semibold transition cursor-pointer min-h-[44px] ${
                      isChecked
                        ? 'bg-orange-500/10 border-orange-500/60 text-white'
                        : 'bg-[#1f2937]/50 border-gray-800 text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                          isChecked ? 'bg-orange-500 border-orange-500 text-gray-950' : 'border-gray-600'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span>{addon.name}</span>
                    </div>

                    <span className="text-xs font-bold text-amber-400">
                      +{formatCurrency(addon.price, currency, config.exchangeRateNprToInr)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Separate Per-item Kitchen Note */}
          <div>
            <label className="block text-sm font-extrabold text-white mb-1.5 font-heading">
              Kitchen Instructions for this Dish
            </label>
            <input
              type="text"
              value={itemNote}
              onChange={(e) => setItemNote(e.target.value)}
              placeholder="e.g. Less oil, extra crispy, spicy jhol on the side..."
              className="w-full bg-[#1f2937]/70 border border-gray-700 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none min-h-[44px]"
            />
            <span className="text-[11px] text-gray-500 mt-1 block">
              * Note: Rider delivery notes can be added separately at checkout.
            </span>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm font-extrabold text-white font-heading">Quantity</span>
            <div className="flex items-center gap-3 bg-[#1f2937] border border-gray-700 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-lg bg-gray-800 text-gray-300 hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-bold text-white text-base">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="w-10 h-10 rounded-lg bg-gray-800 text-gray-300 hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Add to Cart Button */}
        <div className="pt-4 border-t border-[#1f2937]">
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full flex items-center justify-between px-6 py-3.5 bg-gradient-to-r from-[#ff6a1a] to-[#ffb020] hover:from-orange-500 hover:to-amber-500 text-gray-950 font-black rounded-2xl shadow-xl shadow-orange-500/25 active:scale-98 transition cursor-pointer min-h-[48px]"
          >
            <span>Add to Cart ({qty} {qty === 1 ? 'item' : 'items'})</span>
            <span className="text-base font-extrabold">
              {formatCurrency(grandTotal, currency, config.exchangeRateNprToInr)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DishSheet;

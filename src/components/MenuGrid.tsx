import React, { useState } from 'react';
import { Sparkles, Plus, Check, AlertCircle, Flame } from 'lucide-react';
import { MenuItem, Category } from '../types';
import { useKitchenStore } from '../store/useKitchenStore';
import { formatCurrency } from '../utils/kitchenLogic';
import { getAiDescription } from '../lib/aiClient';

interface MenuGridProps {
  onSelectDish: (dish: MenuItem) => void;
}

export const MenuGrid: React.FC<MenuGridProps> = ({ onSelectDish }) => {
  const { menu, categories, currency, config, searchQuery, dietFilter, cart } = useKitchenStore();
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const [loadingDescUid, setLoadingDescUid] = useState<string | null>(null);

  // Filter items
  const filteredItems = menu.filter((item) => {
    if (item.hid) return false;

    // Diet filter
    if (dietFilter === 'v' && item.t !== 'v') return false;
    if (dietFilter === 'n' && item.t !== 'n') return false;
    if (dietFilter === 'best' && !item.best) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.desc.toLowerCase().includes(q);
      return matchName || matchDesc;
    }

    return true;
  });

  const handleDescribe = async (e: React.MouseEvent, item: MenuItem) => {
    e.stopPropagation();
    if (descriptions[item.uid]) return;

    setLoadingDescUid(item.uid);
    try {
      const catObj = categories.find((c) => c.id === item.cat);
      const text = await getAiDescription(item.name, item.desc, catObj?.name || 'Nepali Special');
      setDescriptions((prev) => ({ ...prev, [item.uid]: text }));
    } finally {
      setLoadingDescUid(null);
    }
  };

  // Group filtered items by category
  const groupedByCategory = categories
    .map((cat) => ({
      category: cat,
      items: filteredItems.filter((item) => item.cat === cat.id),
    }))
    .filter((group) => group.items.length > 0);

  if (filteredItems.length === 0) {
    return (
      <div className="py-20 text-center px-4">
        <div className="inline-flex p-4 rounded-full bg-gray-800/60 text-gray-400 mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white font-heading">No midnight dishes found</h3>
        <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
          Try clearing your search query or switching diet filters to see more of our night menu.
        </p>
      </div>
    );
  }

  return (
    <div id="menu-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {groupedByCategory.map(({ category, items }) => (
        <section
          key={category.id}
          id={`category-section-${category.id}`}
          className="scroll-mt-36"
        >
          {/* Category Header with emoji and count */}
          <div className="flex items-center justify-between pb-3 mb-6 border-b border-[#1f2937]">
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl">{category.emoji}</span>
              <h2 className="text-2xl font-black text-white font-heading tracking-tight">
                {category.name}
              </h2>
            </div>
            <span className="text-xs font-bold text-gray-400 bg-[#111827] px-3 py-1 rounded-full border border-[#1f2937]">
              {items.length} {items.length === 1 ? 'dish' : 'dishes'}
            </span>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => {
              // Diet left border color
              const dietBorder =
                item.t === 'v'
                  ? 'border-l-emerald-500'
                  : item.t === 'e'
                  ? 'border-l-yellow-400'
                  : 'border-l-rose-500';

              // Quantity currently in cart for this item
              const inCartQty = cart
                .filter((c) => c.item.uid === item.uid)
                .reduce((sum, c) => sum + c.qty, 0);

              const aiDesc = descriptions[item.uid];
              const isLoadingDesc = loadingDescUid === item.uid;

              return (
                <div
                  key={item.uid}
                  onClick={() => !item.out && onSelectDish(item)}
                  className={`relative flex flex-col justify-between p-5 rounded-2xl bg-[#111827] border border-[#1f2937] border-l-4 ${dietBorder} hover:border-gray-700 transition-all duration-200 shadow-md hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-950/20 group cursor-pointer ${
                    item.out ? 'opacity-65 cursor-not-allowed' : ''
                  }`}
                >
                  {/* Card Header & Badges */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Authentic South Asian Diet Indicator Symbol */}
                        <span
                          className={`w-4 h-4 rounded-sm flex items-center justify-center border p-0.5 ${
                            item.t === 'v'
                              ? 'border-emerald-500 text-emerald-500'
                              : item.t === 'e'
                              ? 'border-yellow-400 text-yellow-400'
                              : 'border-rose-500 text-rose-500'
                          }`}
                          title={
                            item.t === 'v' ? 'Vegetarian' : item.t === 'e' ? 'Egg' : 'Non-Vegetarian'
                          }
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              item.t === 'v'
                                ? 'bg-emerald-500'
                                : item.t === 'e'
                                ? 'bg-yellow-400'
                                : 'bg-rose-500'
                            }`}
                          />
                        </span>

                        {/* Bestseller Badge */}
                        {item.best && (
                          <span className="flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-300 border border-amber-400/30">
                            <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                            Bestseller
                          </span>
                        )}

                        {/* Sold Out Badge */}
                        {item.out && (
                          <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Sold Out
                          </span>
                        )}
                      </div>

                      {/* In-cart count badge if added */}
                      {inCartQty > 0 && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-500 text-gray-950 flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" />
                          {inCartQty} in cart
                        </span>
                      )}
                    </div>

                    {/* Dish Name */}
                    <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition font-heading">
                      {item.name}
                    </h3>

                    {/* Flavor Description */}
                    <p className="text-xs text-gray-400 leading-relaxed mt-1.5 line-clamp-2">
                      {item.desc}
                    </p>

                    {/* AI Generated Mouth-Watering Description Callout */}
                    {aiDesc && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed animate-in fade-in">
                        <span className="font-bold text-amber-300 mr-1">✨ Chef says:</span>
                        {aiDesc}
                      </div>
                    )}
                  </div>

                  {/* Card Bottom: Price, AI Describe & Add Button */}
                  <div className="flex items-center justify-between gap-2 mt-5 pt-3 border-t border-[#1f2937]/80">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400">Price</span>
                      <span className="text-lg font-black text-white font-heading">
                        {formatCurrency(item.p, currency, config.exchangeRateNprToInr)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* "✨ Describe" Button */}
                      {!aiDesc && !item.out && (
                        <button
                          type="button"
                          onClick={(e) => handleDescribe(e, item)}
                          disabled={isLoadingDesc}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 rounded-xl transition cursor-pointer min-h-[44px]"
                          aria-label={`Get AI mouth-watering description for ${item.name}`}
                        >
                          <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${isLoadingDesc ? 'animate-spin' : ''}`} />
                          <span className="hidden sm:inline">Describe</span>
                        </button>
                      )}

                      {/* Add Button */}
                      <button
                        type="button"
                        disabled={item.out}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!item.out) onSelectDish(item);
                        }}
                        className={`flex items-center gap-1 px-4 py-2 font-bold text-sm rounded-xl transition shadow-md active:scale-95 cursor-pointer min-h-[44px] ${
                          item.out
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-gray-950 font-extrabold shadow-orange-500/20'
                        }`}
                        aria-label={`Add ${item.name} to order`}
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

export default MenuGrid;

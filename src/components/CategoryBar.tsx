import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, Flame, Leaf, Drumstick } from 'lucide-react';
import { useKitchenStore } from '../store/useKitchenStore';

export const CategoryBar: React.FC = () => {
  const {
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    dietFilter,
    setDietFilter,
    menu,
  } = useKitchenStore();

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Debounced search (250ms) as requested
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 250);

    return () => clearTimeout(handler);
  }, [localSearch, setSearchQuery]);

  // Memoize category item counts to prevent unnecessary recalculations
  const categoryCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const cat of categories) {
      counts[cat.id] = menu.filter((item) => item.cat === cat.id && !item.hid).length;
    }
    return counts;
  }, [categories, menu]);

  const handleCategoryClick = (catId: number) => {
    setSelectedCategory(catId);
    // Smooth scroll to target category section if not searching
    const el = document.getElementById(`category-section-${catId}`);
    if (el) {
      const yOffset = -140; // account for sticky nav and category bar
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="sticky top-18 z-30 w-full bg-[#090d16]/95 backdrop-blur-md border-b border-[#1f2937] py-3 px-4 sm:px-6 lg:px-8 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col gap-3">
        {/* Top Controls Row: Debounced Search & Diet Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box with 250ms debounce */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search momos, biryani, starters, pizza..."
              className="w-full bg-[#111827] border border-[#1f2937] focus:border-orange-500/80 focus:ring-1 focus:ring-orange-500 rounded-xl pl-10 pr-9 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none transition min-h-[44px]"
              aria-label="Search menu items"
            />
            {localSearch && (
              <button
                onClick={() => {
                  setLocalSearch('');
                  setSearchQuery('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Diet Filters: All / Veg / Non-Veg / Bestsellers */}
          <div
            className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none"
            role="group"
            aria-label="Dietary filters"
          >
            <button
              onClick={() => setDietFilter('all')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer min-h-[44px] ${
                dietFilter === 'all'
                  ? 'bg-white text-gray-950 shadow-md'
                  : 'bg-[#111827] text-gray-300 border border-[#1f2937] hover:bg-gray-800'
              }`}
            >
              All Dishes
            </button>

            <button
              onClick={() => setDietFilter('v')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer min-h-[44px] ${
                dietFilter === 'v'
                  ? 'bg-emerald-500 text-gray-950 font-extrabold shadow-md'
                  : 'bg-[#111827] text-emerald-400 border border-[#1f2937] hover:bg-emerald-950/30'
              }`}
            >
              <Leaf className="w-3.5 h-3.5" />
              <span>Veg Only</span>
            </button>

            <button
              onClick={() => setDietFilter('n')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer min-h-[44px] ${
                dietFilter === 'n'
                  ? 'bg-red-500 text-white font-extrabold shadow-md'
                  : 'bg-[#111827] text-red-400 border border-[#1f2937] hover:bg-red-950/30'
              }`}
            >
              <Drumstick className="w-3.5 h-3.5" />
              <span>Non-Veg</span>
            </button>

            <button
              onClick={() => setDietFilter('best')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer min-h-[44px] ${
                dietFilter === 'best'
                  ? 'bg-amber-400 text-gray-950 font-extrabold shadow-md'
                  : 'bg-[#111827] text-amber-300 border border-[#1f2937] hover:bg-amber-950/30'
              }`}
            >
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Bestsellers</span>
            </button>
          </div>
        </div>

        {/* Sticky Horizontally Scrollable Category Bar with Emojis */}
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
          role="tablist"
          aria-label="Menu categories"
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id && !searchQuery;
            const count = categoryCounts[cat.id] || 0;

            return (
              <button
                key={cat.id}
                role="tab"
                aria-selected={isSelected}
                onClick={() => handleCategoryClick(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold shrink-0 transition-all cursor-pointer min-h-[44px] ${
                  isSelected
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-gray-950 shadow-lg shadow-orange-500/20'
                    : 'bg-[#111827] text-gray-300 border border-[#1f2937] hover:border-gray-600 hover:text-white'
                }`}
              >
                <span className="text-base">{cat.emoji}</span>
                <span>{cat.name}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                    isSelected ? 'bg-gray-950 text-white' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default React.memo(CategoryBar);

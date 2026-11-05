import React, { useEffect, useState } from 'react';
import { Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { useKitchenStore } from '../store/useKitchenStore';
import { getStatusBadge } from '../utils/kitchenLogic';

export const StatusBanner: React.FC = () => {
  const { config } = useKitchenStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const badge = getStatusBadge(config, currentTime);

  return (
    <aside aria-label="Kitchen operating status" className="w-full bg-[#111827]/70 border-b border-[#1f2937] py-2 px-4 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Status Pill with Neon indicator */}
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full font-bold uppercase tracking-wider text-xs border ${
              badge.isOpen
                ? 'bg-emerald-950/70 border-emerald-500/40 text-[#22ff88]'
                : 'bg-amber-950/70 border-amber-500/40 text-amber-300'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  badge.isOpen ? 'bg-[#22ff88]' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  badge.isOpen ? 'bg-[#22ff88]' : 'bg-amber-400'
                }`}
              />
            </span>
            <span>{badge.pillText}</span>
          </div>

          <span className="text-gray-300 font-medium hidden sm:inline">
            6:00 PM – 3:00 AM Daily
          </span>

          <span className="text-gray-500 hidden md:inline">•</span>

          <span className="text-gray-300 font-medium hidden md:flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Avg Delivery: {config.avgDeliveryMinutes} mins
          </span>

          <span className="text-gray-500 hidden lg:inline">•</span>

          <span className="text-orange-400 font-semibold hidden lg:flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-orange-400" />
            Insulated Thermal Foil Packing
          </span>
        </div>

        {/* Small live badge note */}
        <div className="flex items-center gap-2 text-gray-400 text-xs ml-auto">
          <span className="hidden sm:inline">Biratnagar-03, Nepal</span>
          <span className="bg-orange-500/10 text-orange-300 border border-orange-500/20 px-2 py-0.5 rounded-md font-mono text-[11px]">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </aside>
  );
};

export default StatusBanner;

import React, { useEffect, useState } from 'react';
import {
  X,
  History,
  RotateCcw,
  Clock,
  ExternalLink,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Order } from '../types';
import { useKitchenStore } from '../store/useKitchenStore';
import { formatCurrency } from '../utils/kitchenLogic';
import { fetchCustomerOrders, getAnonymousUserId } from '../lib/firebase';

export const MyOrdersModal: React.FC = () => {
  const {
    isMyOrdersOpen,
    setMyOrdersOpen,
    reorder,
    currency,
    config,
    setActiveOrderId,
    setTrackingOpen,
  } = useKitchenStore();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isMyOrdersOpen) {
      loadHistory();
    }
  }, [isMyOrdersOpen]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const uid = await getAnonymousUserId();
      const list = await fetchCustomerOrders(uid);
      setOrders(list);
    } finally {
      setLoading(false);
    }
  };

  if (!isMyOrdersOpen) return null;

  const handleTrack = (orderId: string) => {
    setActiveOrderId(orderId);
    setMyOrdersOpen(false);
    setTrackingOpen(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={() => setMyOrdersOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Order History"
    >
      <div
        className="relative w-full max-w-2xl bg-[#111827] border border-[#1f2937] rounded-3xl p-6 sm:p-7 shadow-2xl shadow-black max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1f2937]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-heading">
                My Midnight Orders
              </h2>
              <p className="text-xs text-gray-400">
                Order history & one-tap re-ordering
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMyOrdersOpen(false)}
            className="p-2 text-gray-400 hover:text-white rounded-full bg-gray-800 transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close orders history"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            Loading your orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="p-4 rounded-full bg-gray-800 text-gray-400 inline-flex mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white font-heading">No past orders yet</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
              Your midnight orders from Second Home in Biratnagar will appear here with live tracking and instant re-order.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const formattedDate = new Date(order.createdAt).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              const statusLabels: Record<number, string> = {
                0: 'Order Received',
                1: 'Chef Cooking',
                2: 'Sealed in Foil',
                3: 'Rider on the Way',
                4: 'Delivered',
              };

              return (
                <div
                  key={order.orderId}
                  className="p-4 sm:p-5 rounded-2xl bg-[#090d16] border border-[#1f2937] hover:border-gray-700 transition space-y-3"
                >
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white font-heading">
                        #{order.orderId}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formattedDate}
                      </span>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        order.stage >= 4
                          ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-400'
                          : 'bg-orange-950/70 border-orange-500/40 text-orange-400 animate-pulse'
                      }`}
                    >
                      {statusLabels[order.stage] || 'Active'}
                    </span>
                  </div>

                  {/* Items Summary */}
                  <div className="space-y-1 text-xs text-gray-300">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>
                          <strong className="text-white font-bold">{item.qty}x</strong> {item.name}{' '}
                          <span className="text-orange-400 text-[11px]">({item.spice})</span>
                          {item.addons && item.addons.length > 0 && (
                            <span className="text-gray-400 text-[10px] ml-1">
                              [+{item.addons.map((a) => a.name).join(', ')}]
                            </span>
                          )}
                        </span>
                        <span className="text-gray-400">
                          {formatCurrency(
                            item.unitPrice * item.qty,
                            currency,
                            config.exchangeRateNprToInr
                          )}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Bottom Action Bar */}
                  <div className="pt-3 border-t border-[#1f2937] flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <span className="text-xs text-gray-400 block">Total Paid</span>
                      <span className="text-base font-extrabold text-white font-heading">
                        {formatCurrency(order.total, currency, config.exchangeRateNprToInr)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Track Button */}
                      <button
                        type="button"
                        onClick={() => handleTrack(order.orderId)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition cursor-pointer min-h-[44px] flex items-center gap-1.5"
                      >
                        <span>Track</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {/* One-Tap Re-Order */}
                      <button
                        type="button"
                        onClick={() => reorder(order)}
                        className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-gray-950 transition active:scale-95 cursor-pointer min-h-[44px] flex items-center gap-1.5 shadow-md shadow-orange-500/20"
                      >
                        <RotateCcw className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Re-Order</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrdersModal;

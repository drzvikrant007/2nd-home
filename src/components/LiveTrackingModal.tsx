import React, { useEffect, useState } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  Bike,
  Flame,
  PackageCheck,
  PhoneCall,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useKitchenStore } from '../store/useKitchenStore';
import { calculateETA, formatCurrency } from '../utils/kitchenLogic';

const TRACKING_STEPS = [
  {
    stage: 0,
    title: 'Order Received & Verified',
    desc: 'Payment confirmed & order sent to kitchen',
    icon: CheckCircle2,
  },
  {
    stage: 1,
    title: 'Chef Cooking',
    desc: 'Wok tossed fresh with authentic Biratnagar spices',
    icon: Flame,
  },
  {
    stage: 2,
    title: 'Double Sealed in Thermal Foil',
    desc: 'Packed in insulated thermal foil to retain oven-fresh heat',
    icon: PackageCheck,
  },
  {
    stage: 3,
    title: 'Night Rider on the Way',
    desc: 'Heading to your location in Biratnagar',
    icon: Bike,
  },
  {
    stage: 4,
    title: 'Delivered',
    desc: 'Enjoy your hot meal! Good Food Feels Like Home',
    icon: ShieldCheck,
  },
];

export const LiveTrackingModal: React.FC = () => {
  const {
    isTrackingOpen,
    setTrackingOpen,
    activeOrder,
    activeOrderId,
    config,
    currency,
  } = useKitchenStore();

  const [now, setNow] = useState(Date.now());

  // Tick clock for dynamic ETA countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  if (!isTrackingOpen) return null;

  if (!activeOrder && !activeOrderId) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in"
        onClick={() => setTrackingOpen(false)}
        role="dialog"
      >
        <div
          className="w-full max-w-md bg-[#111827] border border-[#1f2937] rounded-3xl p-6 text-center space-y-4 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 rounded-full bg-gray-800 text-gray-400 inline-flex">
            <Clock className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white font-heading">No Active Order</h3>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">
            You don't have an ongoing order right now. Place an order to track live preparation and delivery!
          </p>
          <button
            type="button"
            onClick={() => setTrackingOpen(false)}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-gray-950 font-bold rounded-xl cursor-pointer min-h-[44px]"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  // Active order is available or loading
  const currentStage = activeOrder ? activeOrder.stage : 0;
  const etaInfo = activeOrder
    ? calculateETA(activeOrder.createdAt, config.avgDeliveryMinutes)
    : { formattedTime: '24 mins', minutesRemaining: 24 };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={() => setTrackingOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Live Order Tracking"
    >
      <div
        className="relative w-full max-w-xl bg-[#111827] border border-[#1f2937] rounded-3xl p-6 sm:p-7 shadow-2xl shadow-black max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1f2937]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-md">
                #{activeOrder?.orderId || activeOrderId}
              </span>
              <span className="text-xs text-gray-400">
                {activeOrder ? new Date(activeOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white font-heading mt-1">
              Live Order Tracking
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setTrackingOpen(false)}
            className="p-2 text-gray-400 hover:text-white rounded-full bg-gray-800 transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close tracking"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ETA & Thermal Foil Highlight */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-950/40 to-[#111827] border border-orange-500/30">
            <span className="text-xs text-orange-400 font-bold block flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Estimated Delivery
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-white font-heading mt-1">
              {currentStage >= 4 ? 'Delivered' : etaInfo.formattedTime}
            </div>
            {currentStage < 4 && (
              <span className="text-[11px] text-gray-400 mt-0.5 block">
                ~{etaInfo.minutesRemaining} mins remaining
              </span>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-[#090d16] border border-[#1f2937] flex flex-col justify-center">
            <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Insulated Foil
            </span>
            <span className="text-xs text-gray-300 mt-1 leading-tight">
              Double-sealed thermal packing preserves fresh heat.
            </span>
          </div>
        </div>

        {/* 5-Step Vertical Progress Stepper */}
        <div className="p-5 rounded-2xl bg-[#090d16] border border-[#1f2937] space-y-5">
          {TRACKING_STEPS.map((step, idx) => {
            const isCompleted = currentStage > step.stage;
            const isCurrent = currentStage === step.stage;
            const isPending = currentStage < step.stage;

            const Icon = step.icon;

            return (
              <div key={step.stage} className="flex items-start gap-4 relative">
                {/* Connector line between steps */}
                {idx < TRACKING_STEPS.length - 1 && (
                  <div
                    className={`absolute left-5 top-10 bottom--5 w-0.5 -ml-px transition-colors ${
                      isCompleted ? 'bg-orange-500' : 'bg-gray-800'
                    }`}
                  />
                )}

                {/* Step Circle Indicator */}
                <div
                  className={`relative z-10 w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0 transition-all ${
                    isCompleted
                      ? 'bg-orange-500 text-gray-950 border-orange-400'
                      : isCurrent
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-gray-950 border-amber-300 ring-4 ring-orange-500/20 animate-pulse'
                      : 'bg-gray-800 text-gray-500 border-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Step Details */}
                <div className="flex-1 pt-0.5">
                  <div className="flex items-center justify-between">
                    <h4
                      className={`text-sm font-bold font-heading ${
                        isCurrent
                          ? 'text-orange-400'
                          : isCompleted
                          ? 'text-white'
                          : 'text-gray-500'
                      }`}
                    >
                      {step.title}
                    </h4>
                    {isCurrent && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40">
                        In Progress
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Night Rider Details Card (Visible during Stage 3 or 4) */}
        {activeOrder?.rider && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 to-orange-950/40 border border-orange-500/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <Bike className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-orange-400 block tracking-wider">
                  Assigned Night Rider
                </span>
                <h4 className="text-base font-extrabold text-white font-heading">
                  {activeOrder.rider.name}
                </h4>
                <div className="text-xs text-gray-400 flex items-center gap-2">
                  <span>Plate: <strong className="text-gray-200">{activeOrder.rider.plate}</strong></span>
                </div>
              </div>
            </div>

            <a
              href={`tel:${activeOrder.rider.phone}`}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-gray-950 font-extrabold rounded-xl shadow-lg transition active:scale-95 cursor-pointer min-h-[44px]"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call Rider</span>
            </a>
          </div>
        )}

        {/* Order Summary & Delivery Address */}
        {activeOrder && (
          <div className="p-4 rounded-2xl bg-[#090d16] border border-[#1f2937] space-y-2 text-xs">
            <div className="flex justify-between text-gray-400">
              <span>Delivery to:</span>
              <span className="font-semibold text-white text-right max-w-[220px]">
                {activeOrder.customer.address} ({activeOrder.customer.addrType})
              </span>
            </div>
            {activeOrder.customer.note && (
              <div className="flex justify-between text-amber-300">
                <span>Rider Note:</span>
                <span className="italic">"{activeOrder.customer.note}"</span>
              </div>
            )}
            <div className="flex justify-between text-gray-400 pt-1 border-t border-gray-800">
              <span>Items ({activeOrder.items.length}):</span>
              <span className="text-gray-300">
                {activeOrder.items.map((i) => `${i.name} x${i.qty}`).join(', ')}
              </span>
            </div>
            <div className="flex justify-between font-bold text-white pt-1">
              <span>Total:</span>
              <span className="text-orange-400 font-extrabold">
                {formatCurrency(activeOrder.total, currency, config.exchangeRateNprToInr)}
              </span>
            </div>
          </div>
        )}

        {/* WhatsApp Support Callout */}
        <div className="text-center pt-2">
          <a
            href={`https://wa.me/977${config.whatsappPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
              `Hello Second Home, inquiring about order #${activeOrder?.orderId || activeOrderId}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-emerald-400 transition"
          >
            <span>Need assistance? WhatsApp us directly</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default LiveTrackingModal;

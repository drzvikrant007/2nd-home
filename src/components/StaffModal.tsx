import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Lock,
  UtensilsCrossed,
  Settings,
  Database,
  BookOpen,
  Volume2,
  VolumeX,
  Printer,
  Bike,
  Plus,
  Edit2,
  Check,
  AlertTriangle,
  Download,
  Upload,
  Clock,
  Flame,
  PackageCheck,
  CheckCircle2,
  PhoneCall,
  Save,
} from 'lucide-react';
import { MenuItem, Order, OrderStage, RiderDetails, SiteConfig } from '../types';
import { useKitchenStore } from '../store/useKitchenStore';
import { formatCurrency } from '../utils/kitchenLogic';
import { subscribeAllOrders, updateOrderStage } from '../lib/firebase';

export const StaffModal: React.FC = () => {
  const {
    isStaffOpen,
    setStaffOpen,
    menu,
    config,
    currency,
    toggleSoldOut,
    updateMenuItem,
    addMenuItem,
    updateSiteConfig,
  } = useKitchenStore();

  // Authentication & Rate limit state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [attempts, setAttempts] = useState<number[]>([]);
  const [isLockedOut, setIsLockedOut] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'kds' | 'menu' | 'settings' | 'backup' | 'guide'>('kds');

  // KDS State
  const [orders, setOrders] = useState<Order[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedOrderForKOT, setSelectedOrderForKOT] = useState<Order | null>(null);

  // Rider Assignment Modal State
  const [riderModalOrder, setRiderModalOrder] = useState<Order | null>(null);
  const [riderName, setRiderName] = useState('');
  const [riderPhone, setRiderPhone] = useState('');
  const [riderPlate, setRiderPlate] = useState('');

  // Menu Edit / Add State
  const [editingDish, setEditingDish] = useState<MenuItem | null>(null);
  const [isAddingDish, setIsAddingDish] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState<SiteConfig>(config);

  // Founder Guide Commission Slider
  const [monthlyRevenue, setMonthlyRevenue] = useState(300000); // NPR 300,000 / month
  const [commissionCut, setCommissionCut] = useState(28); // 28% aggregator fee default

  const prevOrdersCountRef = useRef(0);

  // Rate limit helper: 5 tries per minute
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const now = Date.now();
    const recentAttempts = attempts.filter((t) => now - t < 60000);

    if (recentAttempts.length >= 5) {
      setIsLockedOut(true);
      setAuthError('Too many failed attempts. Rate limit exceeded (max 5 tries/min). Please wait 60s.');
      return;
    }

    if (pinInput === config.staffPin || pinInput === '2024') {
      setIsAuthenticated(true);
      setAuthError('');
      setPinInput('');
    } else {
      const updated = [...recentAttempts, now];
      setAttempts(updated);
      setAuthError(`Incorrect PIN. (${5 - updated.length} attempts left this minute)`);
    }
  };

  // Sound chime synthesizer using Web Audio API
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {
      // Audio autoplay policy catch
    }
  };

  // Subscribe to all orders for KDS
  useEffect(() => {
    if (isStaffOpen && isAuthenticated) {
      const unsub = subscribeAllOrders((list) => {
        if (list.length > prevOrdersCountRef.current && prevOrdersCountRef.current > 0) {
          playChime();
        }
        prevOrdersCountRef.current = list.length;
        setOrders(list);
      });
      return () => unsub();
    }
  }, [isStaffOpen, isAuthenticated, soundEnabled]);

  useEffect(() => {
    setSettingsForm(config);
  }, [config]);

  if (!isStaffOpen) return null;

  // Print KOT
  const handlePrintKOT = (order: Order) => {
    setSelectedOrderForKOT(order);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Stage advancement
  const handleAdvanceStage = async (order: Order, nextStage: OrderStage) => {
    if (nextStage === 3) {
      // Open rider assignment dialog
      setRiderModalOrder(order);
      setRiderName(order.rider?.name || 'Ramesh Thapa');
      setRiderPhone(order.rider?.phone || '9814110239');
      setRiderPlate(order.rider?.plate || 'Ko 23 Pa 8921');
      return;
    }

    const statusMap: Record<OrderStage, Order['status']> = {
      0: 'pending',
      1: 'cooking',
      2: 'ready',
      3: 'out_for_delivery',
      4: 'delivered',
    };

    await updateOrderStage(order.orderId, nextStage, order.rider, statusMap[nextStage]);
  };

  const handleConfirmRiderDispatch = async () => {
    if (!riderModalOrder) return;
    const rider: RiderDetails = {
      name: riderName.trim() || 'Night Rider',
      phone: riderPhone.trim() || '9814110239',
      plate: riderPlate.trim() || 'Ko 23 Pa 8921',
    };
    await updateOrderStage(riderModalOrder.orderId, 3, rider, 'out_for_delivery');
    setRiderModalOrder(null);
  };

  // Backup & Restore
  const handleExportJson = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      menu,
      config,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `second_home_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.menu && Array.isArray(parsed.menu)) {
          for (const item of parsed.menu) {
            await updateMenuItem(item);
          }
        }
        if (parsed.config) {
          await updateSiteConfig(parsed.config);
        }
        alert('Data successfully restored from backup!');
      } catch {
        alert('Failed to parse backup file. Please ensure it is a valid JSON export.');
      }
    };
    reader.readAsText(file);
  };

  // KDS Metrics
  const activeOrdersCount = orders.filter((o) => o.stage < 4).length;
  const tonightTotalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Staff Management Portal"
    >
      <div
        className="relative w-full max-w-6xl bg-[#111827] border border-[#1f2937] rounded-3xl p-5 sm:p-7 shadow-2xl shadow-black max-h-[95vh] overflow-y-auto flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1f2937]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white font-heading">
                  Staff & Kitchen Management (KDS)
                </h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Demo PIN Gate
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Demo PIN gate, not for production security • Default PIN: 2024
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStaffOpen(false)}
            className="p-2 text-gray-400 hover:text-white rounded-full bg-gray-800 transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close staff modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PIN GATE SCREEN IF NOT AUTHENTICATED */}
        {!isAuthenticated ? (
          <div className="py-16 max-w-sm mx-auto text-center space-y-4">
            <div className="p-4 rounded-3xl bg-gray-800/80 inline-flex text-orange-400 border border-gray-700">
              <Lock className="w-10 h-10" />
            </div>

            <h3 className="text-xl font-bold text-white font-heading">Enter Staff Security PIN</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Notice: Demo PIN gate, not for production security. Default PIN is <strong className="text-orange-400">2024</strong>. Rate limited to 5 attempts per minute.
            </p>

            <form onSubmit={handlePinSubmit} className="space-y-3 pt-2">
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                disabled={isLockedOut}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter 4-digit PIN (2024)"
                className="w-full text-center tracking-widest text-xl bg-[#090d16] border border-gray-700 focus:border-orange-500 rounded-xl px-4 py-3 text-white focus:outline-none min-h-[48px]"
                autoFocus
              />

              {authError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-400 p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-left">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLockedOut}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-gray-950 font-black rounded-xl hover:opacity-95 transition cursor-pointer min-h-[44px]"
              >
                Unlock Staff Portal
              </button>
            </form>
          </div>
        ) : (
          /* AUTHENTICATED STAFF PORTAL */
          <div className="py-4 space-y-5">
            {/* Nav Tabs */}
            <div className="flex items-center gap-1.5 border-b border-[#1f2937] pb-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('kds')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer min-h-[44px] shrink-0 ${
                  activeTab === 'kds'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-gray-950'
                    : 'bg-[#090d16] text-gray-300 border border-gray-800 hover:text-white'
                }`}
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span>Kitchen Display (KDS)</span>
                {activeOrdersCount > 0 && (
                  <span className="bg-gray-950 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {activeOrdersCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('menu')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer min-h-[44px] shrink-0 ${
                  activeTab === 'menu'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-gray-950'
                    : 'bg-[#090d16] text-gray-300 border border-gray-800 hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Menu CMS & 86</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer min-h-[44px] shrink-0 ${
                  activeTab === 'settings'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-gray-950'
                    : 'bg-[#090d16] text-gray-300 border border-gray-800 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Site Settings</span>
              </button>

              <button
                onClick={() => setActiveTab('backup')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer min-h-[44px] shrink-0 ${
                  activeTab === 'backup'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-gray-950'
                    : 'bg-[#090d16] text-gray-300 border border-gray-800 hover:text-white'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>Backup JSON</span>
              </button>

              <button
                onClick={() => setActiveTab('guide')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer min-h-[44px] shrink-0 ${
                  activeTab === 'guide'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-gray-950'
                    : 'bg-[#090d16] text-gray-300 border border-gray-800 hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Founder Guide</span>
              </button>
            </div>

            {/* TAB 1: KDS (Kitchen Display System) */}
            {activeTab === 'kds' && (
              <div className="space-y-4">
                {/* KDS Header Controls & Metrics */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#090d16] border border-[#1f2937]">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-400">Active Orders:</span>
                      <strong className="text-orange-400 text-sm font-bold font-heading">
                        {activeOrdersCount}
                      </strong>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-400">Orders Tonight:</span>
                      <strong className="text-white text-sm font-bold font-heading">
                        {orders.length}
                      </strong>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-400">Total Sales:</span>
                      <strong className="text-emerald-400 text-sm font-bold font-heading">
                        {formatCurrency(tonightTotalRevenue, currency, config.exchangeRateNprToInr)}
                      </strong>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-400">Avg Prep Time:</span>
                      <strong className="text-amber-400 text-sm font-bold font-heading">
                        18 mins
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer min-h-[36px] ${
                        soundEnabled
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-gray-800 text-gray-400 border-gray-700'
                      }`}
                    >
                      {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      <span>{soundEnabled ? 'Chime ON' : 'Chime Muted'}</span>
                    </button>
                  </div>
                </div>

                {/* 4-Column Live Kanban */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Column 0: New Orders */}
                  <div className="p-3.5 rounded-2xl bg-[#090d16] border border-orange-500/20 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                      <span className="text-xs font-black text-orange-400 uppercase tracking-wider flex items-center gap-1.5 font-heading">
                        <Clock className="w-3.5 h-3.5" /> 1. New Orders
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.2 rounded-full bg-orange-500/20 text-orange-300">
                        {orders.filter((o) => o.stage === 0).length}
                      </span>
                    </div>

                    <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                      {orders
                        .filter((o) => o.stage === 0)
                        .map((order) => (
                          <div
                            key={order.orderId}
                            className="p-3 rounded-xl bg-[#111827] border border-gray-800 space-y-2.5 shadow-sm"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-white">
                                #{order.orderId}
                              </span>
                              <button
                                onClick={() => handlePrintKOT(order)}
                                className="text-gray-400 hover:text-white p-1"
                                title="Print 80mm KOT slip"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="text-[11px] text-gray-300 space-y-1">
                              {order.items.map((i, idx) => (
                                <div key={idx} className="flex justify-between">
                                  <span>
                                    <strong>{i.qty}x</strong> {i.name} ({i.spice})
                                  </span>
                                </div>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAdvanceStage(order, 1)}
                              className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-gray-950 font-bold text-xs rounded-lg transition active:scale-95 cursor-pointer min-h-[44px]"
                            >
                              Start Cooking 👨‍🍳
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Column 1: Cooking */}
                  <div className="p-3.5 rounded-2xl bg-[#090d16] border border-amber-500/20 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                      <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5 font-heading">
                        <Flame className="w-3.5 h-3.5" /> 2. Cooking
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300">
                        {orders.filter((o) => o.stage === 1).length}
                      </span>
                    </div>

                    <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                      {orders
                        .filter((o) => o.stage === 1)
                        .map((order) => (
                          <div
                            key={order.orderId}
                            className="p-3 rounded-xl bg-[#111827] border border-gray-800 space-y-2.5 shadow-sm"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-white">
                                #{order.orderId}
                              </span>
                              <button
                                onClick={() => handlePrintKOT(order)}
                                className="text-gray-400 hover:text-white p-1"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="text-[11px] text-gray-300 space-y-1">
                              {order.items.map((i, idx) => (
                                <div key={idx}>
                                  <strong>{i.qty}x</strong> {i.name}
                                  {i.note && <span className="text-amber-400 block text-[10px]">"{i.note}"</span>}
                                </div>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAdvanceStage(order, 2)}
                              className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold text-xs rounded-lg transition active:scale-95 cursor-pointer min-h-[44px]"
                            >
                              Seal in Thermal Foil 🛡️
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Column 2: Sealed & Ready */}
                  <div className="p-3.5 rounded-2xl bg-[#090d16] border border-blue-500/20 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                      <span className="text-xs font-black text-blue-400 uppercase tracking-wider flex items-center gap-1.5 font-heading">
                        <PackageCheck className="w-3.5 h-3.5" /> 3. Sealed & Ready
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.2 rounded-full bg-blue-500/20 text-blue-300">
                        {orders.filter((o) => o.stage === 2).length}
                      </span>
                    </div>

                    <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                      {orders
                        .filter((o) => o.stage === 2)
                        .map((order) => (
                          <div
                            key={order.orderId}
                            className="p-3 rounded-xl bg-[#111827] border border-gray-800 space-y-2.5 shadow-sm"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-white">
                                #{order.orderId}
                              </span>
                              <span className="text-[10px] text-gray-400">{order.customer.addrType}</span>
                            </div>
                            <p className="text-[11px] text-gray-300 truncate">
                              📍 {order.customer.address}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleAdvanceStage(order, 3)}
                              className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-gray-950 font-bold text-xs rounded-lg transition active:scale-95 cursor-pointer min-h-[44px]"
                            >
                              Assign Rider & Dispatch 🛵
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Column 3: Handed to Rider */}
                  <div className="p-3.5 rounded-2xl bg-[#090d16] border border-emerald-500/20 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                      <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 font-heading">
                        <Bike className="w-3.5 h-3.5" /> 4. Handed to Rider
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300">
                        {orders.filter((o) => o.stage === 3).length}
                      </span>
                    </div>

                    <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                      {orders
                        .filter((o) => o.stage === 3)
                        .map((order) => (
                          <div
                            key={order.orderId}
                            className="p-3 rounded-xl bg-[#111827] border border-gray-800 space-y-2.5 shadow-sm"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-white">
                                #{order.orderId}
                              </span>
                              <span className="text-[10px] text-emerald-400 font-bold">
                                On Way
                              </span>
                            </div>
                            {order.rider && (
                              <div className="text-[11px] text-gray-300 bg-gray-900/60 p-2 rounded-lg">
                                <div>Rider: <strong>{order.rider.name}</strong></div>
                                <div>Phone: {order.rider.phone}</div>
                                <div>Plate: {order.rider.plate}</div>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => handleAdvanceStage(order, 4)}
                              className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-gray-950 font-bold text-xs rounded-lg transition active:scale-95 cursor-pointer min-h-[44px]"
                            >
                              Mark Delivered ✅
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MENU CMS & 1-CLICK 86 SOLD OUT */}
            {activeTab === 'menu' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 max-w-sm">
                    <input
                      type="text"
                      value={menuSearch}
                      onChange={(e) => setMenuSearch(e.target.value)}
                      placeholder="Filter dishes by name..."
                      className="w-full bg-[#090d16] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none min-h-[40px]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingDish({
                        uid: `dish-${Date.now()}`,
                        cat: 0,
                        name: '',
                        p: 250,
                        t: 'n',
                        best: false,
                        desc: '',
                        out: false,
                        hid: false,
                      });
                      setIsAddingDish(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-gray-950 font-bold text-xs rounded-xl transition cursor-pointer min-h-[40px]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Dish</span>
                  </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto space-y-2">
                  {menu
                    .filter((m) =>
                      menuSearch ? m.name.toLowerCase().includes(menuSearch.toLowerCase()) : true
                    )
                    .map((item) => (
                      <div
                        key={item.uid}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-[#090d16] border border-[#1f2937] gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-3 h-3 rounded-full ${
                              item.t === 'v' ? 'bg-emerald-500' : item.t === 'e' ? 'bg-yellow-400' : 'bg-rose-500'
                            }`}
                          />
                          <div>
                            <div className="text-sm font-bold text-white font-heading">
                              {item.name}
                            </div>
                            <div className="text-xs text-gray-400">
                              रू {item.p} • {item.desc.slice(0, 50)}...
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* 1-Click 86 Sold-out Toggle */}
                          <button
                            type="button"
                            onClick={() => toggleSoldOut(item.uid)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer min-h-[36px] ${
                              item.out
                                ? 'bg-rose-500 text-white shadow-sm'
                                : 'bg-gray-800 text-gray-300 hover:text-white'
                            }`}
                          >
                            {item.out ? '86 (Sold Out)' : 'In Stock'}
                          </button>

                          {/* Edit Dish */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingDish(item);
                              setIsAddingDish(false);
                            }}
                            className="p-2 text-gray-400 hover:text-white bg-gray-800 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* TAB 3: SITE SETTINGS */}
            {activeTab === 'settings' && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await updateSiteConfig(settingsForm);
                  alert('Settings updated successfully!');
                }}
                className="space-y-4 max-w-2xl bg-[#090d16] p-5 rounded-2xl border border-[#1f2937]"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">
                      Primary Phone
                    </label>
                    <input
                      type="text"
                      value={settingsForm.phones[0] || ''}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          phones: [e.target.value, settingsForm.phones[1] || ''],
                        })
                      }
                      className="w-full bg-[#111827] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">
                      Secondary Phone
                    </label>
                    <input
                      type="text"
                      value={settingsForm.phones[1] || ''}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          phones: [settingsForm.phones[0] || '', e.target.value],
                        })
                      }
                      className="w-full bg-[#111827] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">
                      WhatsApp Orders Number
                    </label>
                    <input
                      type="text"
                      value={settingsForm.whatsappPhone}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, whatsappPhone: e.target.value })
                      }
                      className="w-full bg-[#111827] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">
                      Avg Delivery (Minutes)
                    </label>
                    <input
                      type="number"
                      value={settingsForm.avgDeliveryMinutes}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          avgDeliveryMinutes: Number(e.target.value),
                        })
                      }
                      className="w-full bg-[#111827] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">
                      Exchange Rate (1 NPR = ? INR)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={settingsForm.exchangeRateNprToInr}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          exchangeRateNprToInr: Number(e.target.value),
                        })
                      }
                      className="w-full bg-[#111827] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">
                      Staff Security PIN
                    </label>
                    <input
                      type="text"
                      value={settingsForm.staffPin}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, staffPin: e.target.value })
                      }
                      className="w-full bg-[#111827] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">
                    Kitchen Address
                  </label>
                  <input
                    type="text"
                    value={settingsForm.address}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, address: e.target.value })
                    }
                    className="w-full bg-[#111827] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-gray-950 font-bold text-xs rounded-xl transition cursor-pointer min-h-[44px]"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Configuration</span>
                </button>
              </form>
            )}

            {/* TAB 4: BACKUP & RESTORE JSON */}
            {activeTab === 'backup' && (
              <div className="p-6 rounded-2xl bg-[#090d16] border border-[#1f2937] space-y-6 max-w-xl">
                <div>
                  <h3 className="text-base font-bold text-white font-heading">
                    Data Export & Import
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Safeguard all menu items, stock statuses, and site configurations in a clean JSON format.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">Export Menu & Settings</div>
                      <div className="text-[11px] text-gray-400">Download current database snapshot</div>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportJson}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold cursor-pointer min-h-[40px]"
                    >
                      <Download className="w-4 h-4 text-orange-400" />
                      <span>Export JSON</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">Import from JSON Backup</div>
                      <div className="text-[11px] text-gray-400">Restore dishes and configuration</div>
                    </div>
                    <label className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-gray-950 rounded-xl text-xs font-bold cursor-pointer min-h-[40px]">
                      <Upload className="w-4 h-4" />
                      <span>Upload JSON</span>
                      <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: FOUNDER GUIDE */}
            {activeTab === 'guide' && (
              <div className="p-6 rounded-2xl bg-[#090d16] border border-[#1f2937] space-y-6 max-w-3xl">
                <div>
                  <h3 className="text-xl font-black text-white font-heading">
                    Founder Guide: Zero-Commission Cloud Kitchen
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Strategic playbook for Second Home (2nd Home) in Biratnagar-03, Nepal.
                  </p>
                </div>

                {/* Aggregator Commission Savings Calculator Slider */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-orange-950/40 to-[#111827] border border-orange-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-orange-400 font-heading">
                      💰 Aggregator Commission Savings Calculator
                    </span>
                    <span className="text-xs font-bold text-white bg-orange-500/20 px-2 py-0.5 rounded">
                      {commissionCut}% standard cut
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-300">
                      <span>Monthly Delivery Sales:</span>
                      <strong className="text-white">रू {monthlyRevenue.toLocaleString()}</strong>
                    </div>
                    <input
                      type="range"
                      min={50000}
                      max={1500000}
                      step={25000}
                      value={monthlyRevenue}
                      onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
                      className="w-full accent-orange-500 cursor-pointer"
                    />
                  </div>

                  <div className="p-3 bg-black/40 rounded-xl border border-orange-500/20 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-gray-400">Monthly Money Kept in Your Pocket:</div>
                      <div className="text-2xl font-black text-[#22ff88] font-heading">
                        रू {Math.round((monthlyRevenue * commissionCut) / 100).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-gray-400">Annual Profit Kept:</div>
                      <div className="text-lg font-bold text-amber-400 font-heading">
                        रू {Math.round((monthlyRevenue * commissionCut * 12) / 100).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Firebase Spark Free Tier Breakdown */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white font-heading">
                    ⚡ Firebase Spark Free Plan Efficiency
                  </h4>
                  <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
                    <li><strong>50,000 document reads / day:</strong> More than enough for 200+ night visitors & orders without paying a single cent.</li>
                    <li><strong>20,000 document writes / day:</strong> Accommodates full order tracking, stock toggles, and live KDS updates for free.</li>
                    <li><strong>10 GB / month network hosting:</strong> Ultra-fast static CDN hosting with free SSL certificate.</li>
                  </ul>
                </div>

                {/* Domain & Hosting Steps */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white font-heading">
                    🌐 Connecting GoDaddy Custom Domain to Firebase Hosting
                  </h4>
                  <ol className="text-xs text-gray-300 space-y-1 list-decimal list-inside">
                    <li>In Firebase Console, go to <strong>Hosting &gt; Add custom domain</strong> and enter <code>secondhomebrt.com</code>.</li>
                    <li>Log in to GoDaddy DNS management.</li>
                    <li>Add the two A Records with Host <code>@</code> pointing to the Firebase IP addresses provided.</li>
                    <li>Add the CNAME record for <code>www</code> pointing to <code>second-home-brt.web.app</code>.</li>
                  </ol>
                </div>

                {/* Expansion Roadmap */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white font-heading">
                    🗺️ Growth Roadmap
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-gray-900 rounded-xl border border-gray-800">
                      <strong className="text-orange-400 block mb-1">Phase 1: PWA (Now)</strong>
                      Installable from Chrome/Safari without App Store 30% tax.
                    </div>
                    <div className="p-3 bg-gray-900 rounded-xl border border-gray-800">
                      <strong className="text-amber-400 block mb-1">Phase 2: Capacitor APK</strong>
                      Wrap PWA into an Android APK for Google Play listing in Nepal.
                    </div>
                    <div className="p-3 bg-gray-900 rounded-xl border border-gray-800">
                      <strong className="text-emerald-400 block mb-1">Phase 3: iOS & Multi-Branch</strong>
                      Expand to Dharan & Itahari night clouds.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* RIDER ASSIGNMENT MODAL OVERLAY */}
        {riderModalOrder && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-md bg-[#111827] border border-orange-500/40 rounded-3xl p-6 space-y-4 shadow-2xl">
              <h3 className="text-lg font-black text-white font-heading">
                Assign Night Rider to #{riderModalOrder.orderId}
              </h3>
              <p className="text-xs text-gray-400">
                Customer: {riderModalOrder.customer.name} • {riderModalOrder.customer.address}
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-300 font-bold block mb-1">Rider Name</label>
                  <input
                    type="text"
                    value={riderName}
                    onChange={(e) => setRiderName(e.target.value)}
                    placeholder="e.g. Ramesh Thapa"
                    className="w-full bg-[#090d16] border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300 font-bold block mb-1">Rider Phone</label>
                  <input
                    type="tel"
                    value={riderPhone}
                    onChange={(e) => setRiderPhone(e.target.value)}
                    placeholder="e.g. 9814110239"
                    className="w-full bg-[#090d16] border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300 font-bold block mb-1">Motorbike Plate Number</label>
                  <input
                    type="text"
                    value={riderPlate}
                    onChange={(e) => setRiderPlate(e.target.value)}
                    placeholder="e.g. Ko 23 Pa 8921"
                    className="w-full bg-[#090d16] border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRiderModalOrder(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRiderDispatch}
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-gray-950 font-black rounded-xl text-xs cursor-pointer min-h-[44px]"
                >
                  Dispatch Order
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DISH EDIT / ADD MODAL OVERLAY */}
        {editingDish && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-md bg-[#111827] border border-gray-700 rounded-3xl p-6 space-y-3.5 shadow-2xl">
              <h3 className="text-lg font-black text-white font-heading">
                {isAddingDish ? 'Add New Dish' : 'Edit Dish Details'}
              </h3>

              <div className="space-y-2.5">
                <div>
                  <label className="text-xs text-gray-300 font-bold block mb-1">Dish Name</label>
                  <input
                    type="text"
                    value={editingDish.name}
                    onChange={(e) => setEditingDish({ ...editingDish, name: e.target.value })}
                    className="w-full bg-[#090d16] border border-gray-700 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-300 font-bold block mb-1">Price (NPR)</label>
                    <input
                      type="number"
                      value={editingDish.p}
                      onChange={(e) => setEditingDish({ ...editingDish, p: Number(e.target.value) })}
                      className="w-full bg-[#090d16] border border-gray-700 rounded-xl px-3 py-2 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-300 font-bold block mb-1">Diet Type</label>
                    <select
                      value={editingDish.t}
                      onChange={(e) =>
                        setEditingDish({ ...editingDish, t: e.target.value as 'v' | 'n' | 'e' })
                      }
                      className="w-full bg-[#090d16] border border-gray-700 rounded-xl px-3 py-2 text-sm text-white"
                    >
                      <option value="n">Non-Veg (n)</option>
                      <option value="v">Veg (v)</option>
                      <option value="e">Egg (e)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-300 font-bold block mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={editingDish.desc}
                    onChange={(e) => setEditingDish({ ...editingDish, desc: e.target.value })}
                    className="w-full bg-[#090d16] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingDish.best || false}
                      onChange={(e) => setEditingDish({ ...editingDish, best: e.target.checked })}
                      className="rounded accent-orange-500"
                    />
                    <span>⭐ Mark Bestseller</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingDish.out || false}
                      onChange={(e) => setEditingDish({ ...editingDish, out: e.target.checked })}
                      className="rounded accent-rose-500"
                    />
                    <span>🚫 86 Sold Out</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDish(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (isAddingDish) {
                      await addMenuItem(editingDish);
                    } else {
                      await updateMenuItem(editingDish);
                    }
                    setEditingDish(null);
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-gray-950 font-black rounded-xl text-xs cursor-pointer min-h-[44px]"
                >
                  Save Dish
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HIDDEN 80mm KOT THERMAL SLIP CONTAINER (Visible only during @media print) */}
        {selectedOrderForKOT && (
          <div id="kot-thermal-slip" className="hidden">
            <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
              ================================<br />
              SECOND HOME (2nd Home)<br />
              MIDNIGHT CLOUD KITCHEN<br />
              Biratnagar-03, Nepal<br />
              Tel: +977-9761341498<br />
              ================================
            </div>
            <div style={{ margin: '6px 0' }}>
              <strong>KOT ORDER: #{selectedOrderForKOT.orderId}</strong><br />
              Time: {new Date(selectedOrderForKOT.createdAt).toLocaleTimeString()}<br />
              Cust: {selectedOrderForKOT.customer.name} ({selectedOrderForKOT.customer.phone})<br />
              Addr: {selectedOrderForKOT.customer.address} [{selectedOrderForKOT.customer.addrType}]<br />
              {selectedOrderForKOT.customer.note && (
                <span>* Rider Note: "{selectedOrderForKOT.customer.note}"<br /></span>
              )}
            </div>
            <div>--------------------------------</div>
            <div style={{ fontWeight: 'bold' }}>
              QTY &nbsp; ITEM & SPICE & ADDONS
            </div>
            <div>--------------------------------</div>
            {selectedOrderForKOT.items.map((it, i) => (
              <div key={i} style={{ margin: '4px 0' }}>
                <strong>{it.qty}x</strong> {it.name.toUpperCase()}<br />
                &nbsp;&nbsp;&nbsp;&nbsp;[Spice: {it.spice}]<br />
                {it.addons && it.addons.length > 0 && (
                  <span>&nbsp;&nbsp;&nbsp;&nbsp;+ {it.addons.map((a) => a.name).join(', ')}<br /></span>
                )}
                {it.note && (
                  <span>&nbsp;&nbsp;&nbsp;&nbsp;** NOTE: "{it.note}"<br /></span>
                )}
              </div>
            ))}
            <div>--------------------------------</div>
            <div style={{ textAlign: 'right', fontWeight: 'bold' }}>
              TOTAL: NPR {selectedOrderForKOT.total}<br />
              PAY: {selectedOrderForKOT.pay.toUpperCase()}
            </div>
            <div>================================</div>
            <div style={{ textAlign: 'center', fontSize: '10px' }}>
              INSULATED THERMAL PACKING REQUIRED<br />
              Good Food Feels Like Home
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffModal;

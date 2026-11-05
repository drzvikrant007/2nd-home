import React, { useEffect } from 'react';
import Navbar from './components/Navbar';
import StatusBanner from './components/StatusBanner';
import Hero from './components/Hero';
import CategoryBar from './components/CategoryBar';
import MenuGrid from './components/MenuGrid';
import DishSheet from './components/DishSheet';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import LiveTrackingModal from './components/LiveTrackingModal';
import MyOrdersModal from './components/MyOrdersModal';
import StaffModal from './components/StaffModal';
import FloatingAiChat from './components/FloatingAiChat';
import Footer from './components/Footer';
import { useKitchenStore } from './store/useKitchenStore';

export default function App() {
  const { init, selectedDish, closeDishModal, openDishModal } = useKitchenStore();

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-[#f3f4f6]">
      {/* 1. Sticky Navbar */}
      <Navbar />

      {/* 2. Status Badge Banner */}
      <StatusBanner />

      <main className="flex-1">
        {/* 3. Hero Section */}
        <Hero />

        {/* 4. Sticky Category Bar & Search */}
        <CategoryBar />

        {/* 5. Menu Grid Grouped by Category */}
        <MenuGrid onSelectDish={openDishModal} />
      </main>

      {/* 6. Footer */}
      <Footer />

      {/* Modals, Sheets & Overlays */}
      <DishSheet dish={selectedDish} onClose={closeDishModal} />
      <CartDrawer />
      <CheckoutModal />
      <LiveTrackingModal />
      <MyOrdersModal />
      <StaffModal />
      <FloatingAiChat />
    </div>
  );
}

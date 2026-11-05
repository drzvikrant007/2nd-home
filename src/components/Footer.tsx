import React from 'react';
import {
  PhoneCall,
  MapPin,
  Clock,
  Lock,
  BookOpen,
  Facebook,
  ShieldCheck,
  Heart,
  MessageCircle,
} from 'lucide-react';
import BrandLogo from './BrandLogo';
import { useKitchenStore } from '../store/useKitchenStore';

export const Footer: React.FC = () => {
  const { config, setStaffOpen } = useKitchenStore();

  return (
    <footer className="w-full bg-[#070a11] border-t border-[#1f2937] pt-12 pb-16 px-4 sm:px-6 lg:px-8 text-gray-400 text-xs">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
        {/* Col 1: Brand Info & Tagline */}
        <div className="space-y-4">
          <BrandLogo size={46} showText={true} />
          <p className="text-gray-400 text-xs leading-relaxed max-w-sm">
            "Good Food Feels Like Home" • Biratnagar's premier late-night cloud kitchen. Every meal is cooked fresh to order and double sealed in insulated thermal foil.
          </p>
          <div className="flex items-center gap-2 text-orange-400 font-semibold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>100% Insulated Thermal Foil Packing</span>
          </div>
        </div>

        {/* Col 2: Operating Hours & Delivery */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
            Midnight Hours
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-white font-bold block">Every Night</span>
                <span className="text-gray-300">6:00 PM – 3:00 AM (Daily)</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-white font-bold block">Kitchen Location</span>
                <span className="text-gray-300">{config.address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Col 3: Tap-to-Call Phone Numbers & WhatsApp */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
            Direct Kitchen Contact
          </h4>
          <div className="space-y-2">
            <a
              href={`tel:${config.phones[0]}`}
              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#111827] border border-[#1f2937] hover:border-orange-500 text-white font-bold transition min-h-[44px]"
            >
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <span>{config.phones[0]}</span>
            </a>

            <a
              href={`tel:${config.phones[1]}`}
              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#111827] border border-[#1f2937] hover:border-orange-500 text-white font-bold transition min-h-[44px]"
            >
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <span>{config.phones[1]}</span>
            </a>

            <a
              href={`https://wa.me/977${config.whatsappPhone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 hover:border-emerald-500 text-emerald-300 font-bold transition min-h-[44px]"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp: {config.whatsappPhone}</span>
            </a>
          </div>
        </div>

        {/* Col 4: Social, Payments & Staff Access */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
            Connect & Management
          </h4>
          <div className="space-y-2">
            <a
              href={`https://facebook.com/${config.socialHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-300 hover:text-white transition py-1"
            >
              <Facebook className="w-4 h-4 text-blue-400" />
              <span>fb.com/{config.socialHandle}</span>
            </a>

            <div className="pt-2 flex flex-wrap gap-1.5 text-[10px] font-bold text-gray-400">
              <span className="px-2 py-1 bg-gray-900 border border-gray-800 rounded">eSewa</span>
              <span className="px-2 py-1 bg-gray-900 border border-gray-800 rounded">Fonepay</span>
              <span className="px-2 py-1 bg-gray-900 border border-gray-800 rounded">Khalti</span>
              <span className="px-2 py-1 bg-gray-900 border border-gray-800 rounded">COD</span>
            </div>

            <div className="pt-3 border-t border-gray-800 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setStaffOpen(true)}
                className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-bold cursor-pointer transition min-h-[36px]"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Founder Guide & Unit Economics</span>
              </button>

              <button
                type="button"
                onClick={() => setStaffOpen(true)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white cursor-pointer transition min-h-[36px]"
              >
                <Lock className="w-3.5 h-3.5 text-gray-500" />
                <span>Staff Portal & KDS Login</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal / Safe-area padding */}
      <div className="max-w-7xl mx-auto pt-6 border-t border-gray-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div>
          © {new Date().getFullYear()} Second Home (2nd Home) Midnight Cloud Kitchen, Biratnagar-03, Nepal.
        </div>
        <div className="flex items-center gap-1 text-gray-400">
          <span>Crafted with</span>
          <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" />
          <span>for late-night food lovers.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

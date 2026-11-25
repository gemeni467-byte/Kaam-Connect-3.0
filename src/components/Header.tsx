import React from 'react';
import { MapPin, ChevronDown, HardHat } from 'lucide-react';
import type { ActiveTab } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  selectedState: string;
  selectedCity: string;
  onOpenLocationModal: () => void;
}

const DESKTOP_TABS: Array<{ id: ActiveTab; label: string }> = [
  { id: 'live', label: 'लाइव काम' },
  { id: 'jobs', label: 'काम खोजें' },
  { id: 'workers', label: 'कारीगर' },
  { id: 'account', label: 'मेरा खाता' },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  selectedState,
  selectedCity,
  onOpenLocationModal,
}) => {
  const shortCity = selectedCity.split('(')[0].trim() || selectedState;

  return (
    <header
      className="sticky top-0 z-40 bg-[#0f172a] text-white border-b border-slate-800"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 32px)' }}
    >
      <div className="max-w-6xl mx-auto px-4 pb-2 flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Brand */}
        <button
          type="button"
          onClick={() => onTabChange('live')}
          className="flex items-center gap-2.5 text-left shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 rounded-lg"
        >
          <span className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center shrink-0">
            <HardHat className="w-4 h-4" />
          </span>
          <span className="font-bold text-base sm:text-lg tracking-tight text-white whitespace-nowrap shrink-0">
            Kaam Connect
          </span>
        </button>

        {/* Zone 2: Desktop Navigation */}
        <nav
          aria-label="मुख्य नेविगेशन"
          className="hidden md:flex items-center gap-6"
        >
          {DESKTOP_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`py-1.5 text-sm font-semibold whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                  isActive
                    ? 'text-orange-400 border-orange-400'
                    : 'text-slate-300 border-transparent hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Location Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenLocationModal}
            aria-label={`स्थान बदलें: ${shortCity}, ${selectedState}`}
            className="inline-flex items-center gap-1.5 min-h-[38px] rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 max-w-[180px]"
          >
            <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span className="truncate">{shortCity}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          </button>
        </div>
      </div>
    </header>
  );
};

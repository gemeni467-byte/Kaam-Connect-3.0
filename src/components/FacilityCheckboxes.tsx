import React from 'react';
import { Home, Utensils, Bus } from 'lucide-react';
import type { FacilityFlags } from '../types';

interface FacilityCheckboxesProps {
  facilities: FacilityFlags;
  onToggle: (key: keyof FacilityFlags) => void;
}

export const FacilityCheckboxes: React.FC<FacilityCheckboxesProps> = ({
  facilities,
  onToggle,
}) => {
  const items: Array<{
    key: keyof FacilityFlags;
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
  }> = [
    { key: 'stayFree', label: 'Free Stay', Icon: Home },
    { key: 'foodFree', label: 'Free Food', Icon: Utensils },
    { key: 'travelAllowance', label: 'Travel Allowance', Icon: Bus },
  ];

  return (
    <div className="space-y-2">
      <span className="block text-sm font-semibold text-slate-800">
        Site Facilities Provided
      </span>
      <div className="flex flex-wrap gap-2">
        {items.map(({ key, label, Icon }) => {
          const active = facilities[key];
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(key)}
              className={`inline-flex items-center gap-1.5 min-h-[44px] rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

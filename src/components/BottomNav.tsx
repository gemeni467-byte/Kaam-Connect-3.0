import React from 'react';
import { Radio, Briefcase, Users, UserCircle } from 'lucide-react';
import type { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  liveCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  liveCount,
}) => {
  const tabs: Array<{
    id: ActiveTab;
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { id: 'live', label: 'Live Duty', Icon: Radio, badge: liveCount },
    { id: 'workers', label: 'Workers List', Icon: Users },
    { id: 'contractors', label: 'Contractors List', Icon: Briefcase },
    { id: 'account', label: 'My Account', Icon: UserCircle },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 safe-bottom-nav"
    >
      <div className="grid grid-cols-4 h-14 max-w-lg mx-auto">
        {tabs.map(({ id, label, Icon, badge }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-0.5 min-h-[44px] px-1 transition-colors ${
                isActive ? 'text-orange-600' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.9]'}`} />
                {typeof badge === 'number' && badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-orange-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold whitespace-nowrap leading-tight">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

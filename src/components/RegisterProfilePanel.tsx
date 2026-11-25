import React, { useState } from 'react';
import { HardHat, Briefcase, X } from 'lucide-react';
import type { UserAccount } from '../types';
import { WorkerProfileForm } from './WorkerProfileForm';
import { ContractorProfileForm } from './ContractorProfileForm';

interface RegisterProfilePanelProps {
  defaultRole: 'worker' | 'contractor';
  currentUser: UserAccount | null;
  selectedState: string;
  selectedCity: string;
  onSaved: (saved: { name: string; phone: string; state: string; city: string }) => void;
  onClose: () => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

export const RegisterProfilePanel: React.FC<RegisterProfilePanelProps> = ({
  defaultRole,
  currentUser,
  selectedState,
  selectedCity,
  onSaved,
  onClose,
  onNotify,
}) => {
  const [role, setRole] = useState<'worker' | 'contractor'>(defaultRole);

  return (
    <div className="bg-slate-100 rounded-2xl border border-slate-200 p-3 md:p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          role="tablist"
          aria-label="Choose profile type to register"
          className="inline-flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-200"
        >
          <button
            type="button"
            role="tab"
            aria-selected={role === 'worker'}
            onClick={() => setRole('worker')}
            className={`min-h-[40px] rounded-lg px-3.5 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              role === 'worker'
                ? 'bg-orange-600 text-white'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <HardHat className="w-3.5 h-3.5" />
            <span>Worker</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={role === 'contractor'}
            onClick={() => setRole('contractor')}
            className={`min-h-[40px] rounded-lg px-3.5 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              role === 'contractor'
                ? 'bg-slate-900 text-white'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Contractor</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close registration form"
          className="min-h-[40px] min-w-[40px] rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {role === 'worker' ? (
        <WorkerProfileForm
          currentUser={currentUser}
          existingProfile={null}
          selectedState={selectedState}
          selectedCity={selectedCity}
          startBlank
          onSaved={(saved) => {
            onSaved(saved);
            onClose();
          }}
          onCancel={onClose}
          onNotify={onNotify}
        />
      ) : (
        <ContractorProfileForm
          currentUser={currentUser}
          existingProfile={null}
          selectedState={selectedState}
          selectedCity={selectedCity}
          startBlank
          onSaved={(saved) => {
            onSaved(saved);
            onClose();
          }}
          onCancel={onClose}
          onNotify={onNotify}
        />
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Save, Briefcase, Check } from 'lucide-react';
import {
  CUSTOM_SKILL_OPTION,
  INDIA_STATES,
  QUICK_CITIES_BY_STATE,
  SKILLS_LIST,
} from '../data/constants';
import { saveContractorProfile } from '../firebase';
import type {
  ContractorProfile,
  FacilityFlags,
  UserAccount,
} from '../types';
import {
  isValidIndianMobile,
  normalizePhone,
  resolveTradesList,
  splitTradesToSelection,
} from '../utils/matching';
import { FacilityCheckboxes } from './FacilityCheckboxes';

interface ContractorProfileFormProps {
  currentUser: UserAccount | null;
  existingProfile: ContractorProfile | null;
  selectedState: string;
  selectedCity: string;
  startBlank?: boolean;
  onSaved: (savedUser: { name: string; phone: string; state: string; city: string }) => void;
  onCancel?: () => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

interface ContractorFormState {
  name: string;
  companyName: string;
  phone: string;
  selectedTrades: string[];
  customTrade: string;
  state: string;
  city: string;
  facilities: FacilityFlags;
  isHiring: boolean;
}

export const ContractorProfileForm: React.FC<ContractorProfileFormProps> = ({
  currentUser,
  existingProfile,
  selectedState,
  selectedCity,
  startBlank = false,
  onSaved,
  onCancel,
  onNotify,
}) => {
  const initialProfile = startBlank ? null : existingProfile;
  const initialTrades = initialProfile
    ? splitTradesToSelection(initialProfile.tradesHired, SKILLS_LIST)
    : { selected: [SKILLS_LIST[0]], custom: '' };

  const [form, setForm] = useState<ContractorFormState>({
    name: initialProfile?.name || (startBlank ? '' : currentUser?.name || ''),
    companyName: initialProfile?.companyName || '',
    phone: initialProfile?.phone || (startBlank ? '' : currentUser?.phone || ''),
    selectedTrades: initialTrades.selected,
    customTrade: initialTrades.custom,
    state: initialProfile?.state || selectedState,
    city: initialProfile?.city || selectedCity,
    facilities: initialProfile?.facilities || {
      stayFree: false,
      foodFree: false,
      travelAllowance: false,
    },
    isHiring: initialProfile?.isHiring ?? true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!startBlank && existingProfile) {
      const parsed = splitTradesToSelection(existingProfile.tradesHired, SKILLS_LIST);
      setForm({
        name: existingProfile.name,
        companyName: existingProfile.companyName || '',
        phone: existingProfile.phone,
        selectedTrades: parsed.selected,
        customTrade: parsed.custom,
        state: existingProfile.state,
        city: existingProfile.city,
        facilities: existingProfile.facilities || {
          stayFree: false,
          foodFree: false,
          travelAllowance: false,
        },
        isHiring: existingProfile.isHiring,
      });
    } else if (!startBlank && currentUser) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || currentUser.name,
        phone: prev.phone || currentUser.phone,
      }));
    }
  }, [existingProfile, currentUser, startBlank]);

  const handleUseMyDetails = () => {
    if (!currentUser) return;
    setForm((prev) => ({
      ...prev,
      name: currentUser.name,
      phone: currentUser.phone,
    }));
  };

  const handleToggleTrade = (trade: string) => {
    setForm((prev) => {
      const exists = prev.selectedTrades.includes(trade);
      return {
        ...prev,
        selectedTrades: exists
          ? prev.selectedTrades.filter((t) => t !== trade)
          : [...prev.selectedTrades, trade],
      };
    });
  };

  const handleToggleFacility = (key: keyof FacilityFlags) => {
    setForm((prev) => ({
      ...prev,
      facilities: {
        ...prev.facilities,
        [key]: !prev.facilities[key],
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = normalizePhone(form.phone);
    const resolvedTrades = resolveTradesList(form.selectedTrades, form.customTrade);

    if (!form.name.trim()) {
      onNotify('Please enter contractor name', true);
      return;
    }
    if (!isValidIndianMobile(cleanPhone)) {
      onNotify('Please enter a valid 10-digit Indian mobile number', true);
      return;
    }
    if (resolvedTrades.length === 0) {
      onNotify('Please select at least one trade / worker type hired', true);
      return;
    }
    if (!form.city.trim()) {
      onNotify('Please enter city / site area', true);
      return;
    }

    setSubmitting(true);
    try {
      const isEditingSelf =
        !startBlank &&
        existingProfile &&
        normalizePhone(existingProfile.phone) === cleanPhone;

      await saveContractorProfile({
        name: form.name.trim(),
        companyName: form.companyName.trim(),
        phone: cleanPhone,
        tradesHired: resolvedTrades,
        state: form.state,
        city: form.city.trim(),
        facilities: form.facilities,
        isHiring: form.isHiring,
        createdAt: isEditingSelf ? existingProfile.createdAt : undefined,
      });

      onNotify('Contractor profile saved to directory!');
      onSaved({
        name: form.name.trim(),
        phone: cleanPhone,
        state: form.state,
        city: form.city.trim(),
      });
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : 'Failed to save contractor profile',
        true,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const hasCustomSelected = form.selectedTrades.includes(CUSTOM_SKILL_OPTION);

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 space-y-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            {!startBlank && existingProfile
              ? 'Update Contractor Profile'
              : 'Register Contractor Profile'}
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Register yourself or any contractor on the spot. Turn Hiring OFF anytime to hide your phone number.
          </p>
        </div>

        {startBlank && currentUser && (
          <button
            type="button"
            onClick={handleUseMyDetails}
            className="min-h-[36px] px-3 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 whitespace-nowrap"
          >
            Fill My Details
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div>
          <label
            htmlFor="contractor-name"
            className="block text-sm font-semibold text-slate-800 mb-1"
          >
            Contractor Name <span className="text-orange-600">*</span>
          </label>
          <input
            id="contractor-name"
            type="text"
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="e.g. Rajesh Singh"
            className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900"
            required
          />
        </div>

        <div>
          <label
            htmlFor="contractor-company"
            className="block text-sm font-semibold text-slate-800 mb-1"
          >
            Company / Firm Name (Optional)
          </label>
          <input
            id="contractor-company"
            type="text"
            value={form.companyName}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, companyName: e.target.value }))
            }
            placeholder="e.g. Jai Ambe Engineering"
            className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900"
          />
        </div>

        <div>
          <label
            htmlFor="contractor-phone"
            className="block text-sm font-semibold text-slate-800 mb-1"
          >
            10-Digit Mobile Number <span className="text-orange-600">*</span>
          </label>
          <input
            id="contractor-phone"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={form.phone}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                phone: normalizePhone(e.target.value),
              }))
            }
            placeholder="9876543210"
            className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-mono tabular-nums text-slate-900"
            required
          />
        </div>
      </div>

      {/* Multi-select Trades / Workers Usually Hired */}
      <div className="space-y-2">
        <span className="block text-sm font-semibold text-slate-800">
          Trades / Workers Usually Hired <span className="text-orange-600">*</span>
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {SKILLS_LIST.map((skill) => {
            const checked = form.selectedTrades.includes(skill);
            return (
              <button
                key={skill}
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => handleToggleTrade(skill)}
                className={`min-h-[44px] rounded-xl border px-3 py-2 text-left text-xs font-semibold flex items-center gap-2 transition-colors ${
                  checked
                    ? 'border-orange-600 bg-orange-50 text-orange-900'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                    checked
                      ? 'bg-orange-600 border-orange-600 text-white'
                      : 'border-slate-400 bg-white'
                  }`}
                >
                  {checked && <Check className="w-3 h-3" />}
                </span>
                <span className="leading-tight">{skill}</span>
              </button>
            );
          })}
        </div>

        {hasCustomSelected && (
          <div className="pt-1">
            <label htmlFor="contractor-custom-trade" className="sr-only">
              Enter custom trade / skill hired
            </label>
            <input
              id="contractor-custom-trade"
              type="text"
              value={form.customTrade}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, customTrade: e.target.value }))
              }
              placeholder="Enter custom trade / skill (e.g. Crane Operator)"
              className="w-full min-h-[44px] rounded-xl border border-orange-300 bg-orange-50/40 px-3.5 py-2 text-sm text-slate-900"
            />
          </div>
        )}
      </div>

      {/* State & City */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label
            htmlFor="contractor-state"
            className="block text-sm font-semibold text-slate-800 mb-1"
          >
            State
          </label>
          <select
            id="contractor-state"
            value={form.state}
            onChange={(e) => {
              const st = e.target.value;
              setForm((prev) => ({
                ...prev,
                state: st,
                city: QUICK_CITIES_BY_STATE[st]?.[0] || '',
              }));
            }}
            className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900"
          >
            {INDIA_STATES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="contractor-city"
            className="block text-sm font-semibold text-slate-800 mb-1"
          >
            City / Site Area <span className="text-orange-600">*</span>
          </label>
          <input
            id="contractor-city"
            type="text"
            list="contractor-city-suggestions"
            value={form.city}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, city: e.target.value }))
            }
            placeholder="Rourkela"
            className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900"
            required
          />
          <datalist id="contractor-city-suggestions">
            {(QUICK_CITIES_BY_STATE[form.state] || []).map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </div>

      <FacilityCheckboxes
        facilities={form.facilities}
        onToggle={handleToggleFacility}
      />

      {/* Hiring Status Toggle */}
      <button
        type="button"
        aria-pressed={form.isHiring}
        onClick={() =>
          setForm((prev) => ({ ...prev, isHiring: !prev.isHiring }))
        }
        className={`w-full min-h-[50px] rounded-xl border px-4 py-2.5 text-left flex items-center justify-between gap-3 transition-colors ${
          form.isHiring
            ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
            : 'border-slate-300 bg-slate-100 text-slate-800'
        }`}
      >
        <span className="flex items-center gap-2 text-xs sm:text-sm font-bold">
          <Briefcase className="w-4 h-4 shrink-0" />
          <span>
            {form.isHiring
              ? 'Hiring ON (Need Workers) — Call & WhatsApp buttons visible'
              : 'Hiring OFF (No Vacancy) — Phone number & call buttons hidden'}
          </span>
        </span>
        <span
          className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${
            form.isHiring
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-600 text-white'
          }`}
        >
          {form.isHiring ? 'Hiring ON' : 'Hiring OFF'}
        </span>
      </button>

      <div className="flex gap-3 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 min-h-[46px] rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 min-h-[46px] rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-sm font-bold text-white inline-flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{submitting ? 'Saving...' : 'Save Contractor Profile'}</span>
        </button>
      </div>
    </form>
  );
};

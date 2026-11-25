import React, { useState, useEffect } from 'react';
import { X, MapPin, Check } from 'lucide-react';
import {
  ALL_QUICK_CITY_SUGGESTIONS,
  INDIA_STATES,
  QUICK_CITIES_BY_STATE,
} from '../data/constants';

interface LocationSelectorModalProps {
  isOpen: boolean;
  currentState: string;
  currentCity: string;
  onClose: () => void;
  onApply: (state: string, city: string) => void;
}

export const LocationSelectorModal: React.FC<LocationSelectorModalProps> = ({
  isOpen,
  currentState,
  currentCity,
  onClose,
  onApply,
}) => {
  const [form, setForm] = useState({
    state: currentState,
    city: currentCity,
  });

  useEffect(() => {
    if (isOpen) {
      setForm({ state: currentState, city: currentCity });
    }
  }, [isOpen, currentState, currentCity]);

  if (!isOpen) return null;

  const stateCities = QUICK_CITIES_BY_STATE[form.state] || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(form.state, form.city.trim() || stateCities[0] || form.state);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
    >
      <div className="w-full max-w-lg bg-white rounded-t-3xl md:rounded-2xl border border-slate-200 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-600" />
            <h2 id="location-modal-title" className="text-base font-bold text-slate-900">
              Select Your State &amp; City (All India)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close location selector"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-200/70"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label
              htmlFor="modal-state-select"
              className="block text-sm font-semibold text-slate-800 mb-1.5"
            >
              State
            </label>
            <select
              id="modal-state-select"
              value={form.state}
              onChange={(e) => {
                const nextState = e.target.value;
                const suggested = QUICK_CITIES_BY_STATE[nextState]?.[0] || '';
                setForm((prev) => ({ ...prev, state: nextState, city: suggested }));
              }}
              className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-orange-500 focus:outline-none"
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
              htmlFor="modal-city-input"
              className="block text-sm font-semibold text-slate-800 mb-1.5"
            >
              City / Site Area
            </label>
            <input
              id="modal-city-input"
              type="text"
              value={form.city}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, city: e.target.value }))
              }
              placeholder="Enter city or industrial area"
              className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
              required
            />
            {stateCities.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {stateCities.map((cityOption) => (
                  <button
                    key={cityOption}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, city: cityOption }))
                    }
                    className={`min-h-[36px] rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                      form.city === cityOption
                        ? 'border-orange-600 bg-orange-50 text-orange-800'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {cityOption}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <span className="block text-xs font-semibold text-slate-600 mb-2">
              Major Industrial Hubs (Quick Select)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {ALL_QUICK_CITY_SUGGESTIONS.map((item) => (
                <button
                  key={`${item.state}-${item.city}`}
                  type="button"
                  onClick={() =>
                    setForm({ state: item.state, city: item.city })
                  }
                  className="min-h-[34px] rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 hover:border-slate-400"
                >
                  {item.city}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[46px] rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[46px] rounded-xl bg-orange-600 hover:bg-orange-700 text-sm font-bold text-white inline-flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Apply Location</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

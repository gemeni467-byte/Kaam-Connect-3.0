import React, { useState } from 'react';
import {
  Phone,
  MessageCircle,
  Share2,
  Flag,
  MapPin,
  Building2,
  UserPlus,
  Briefcase,
  ShieldCheck,
  Home,
  Utensils,
  Bus,
} from 'lucide-react';
import { INDIA_STATES, QUICK_CITIES_BY_STATE } from '../data/constants';
import { setContractorHiringStatus } from '../firebase';
import type {
  ContractorProfile,
  LocationFilterMode,
  UserAccount,
} from '../types';
import {
  buildDirectWhatsAppUrl,
  buildTelUrl,
  buildWhatsAppShareUrl,
  formatFacilitiesText,
  getAppShareLink,
  matchesDirectoryLocationFilter,
  resolveSkill,
} from '../utils/matching';
import { SkillSelectField } from './SkillSelectField';
import { RegisterProfilePanel } from './RegisterProfilePanel';
import type { ReportTarget } from './ReportModal';

interface ContractorDirectoryTabProps {
  currentUser: UserAccount | null;
  myContractorProfile: ContractorProfile | null;
  contractors: ContractorProfile[];
  selectedState: string;
  selectedCity: string;
  onUserSynced: (user: { name: string; phone: string; state: string; city: string }) => void;
  onReport: (target: ReportTarget) => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

export const ContractorDirectoryTab: React.FC<ContractorDirectoryTabProps> = ({
  currentUser,
  myContractorProfile,
  contractors,
  selectedState,
  selectedCity,
  onUserSynced,
  onReport,
  onNotify,
}) => {
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [locationFilter, setLocationFilter] = useState<LocationFilterMode>('city');
  const [filterState, setFilterState] = useState<string>(selectedState);
  const [filterCity, setFilterCity] = useState<string>(selectedCity);
  const [tradeFilter, setTradeFilter] = useState<string>('ALL');
  const [customTradeFilter, setCustomTradeFilter] = useState<string>('');
  const [onlyActivelyHiring, setOnlyActivelyHiring] = useState(false);
  const [togglingMyHiring, setTogglingMyHiring] = useState(false);

  React.useEffect(() => {
    if (locationFilter === 'city') {
      setFilterState(selectedState);
      setFilterCity(selectedCity);
    }
  }, [locationFilter, selectedState, selectedCity]);

  const resolvedTrade =
    tradeFilter === 'ALL' ? '' : resolveSkill(tradeFilter, customTradeFilter).toLowerCase();

  const handleSelectLocationMode = (mode: LocationFilterMode) => {
    setLocationFilter(mode);
    if (mode === 'city') {
      setFilterState(selectedState);
      setFilterCity(selectedCity);
    } else {
      setFilterState('ALL');
      setFilterCity('');
    }
  };

  const handleToggleMyHiring = async () => {
    if (!myContractorProfile) return;
    setTogglingMyHiring(true);
    try {
      const next = !myContractorProfile.isHiring;
      await setContractorHiringStatus(myContractorProfile, next);
      onNotify(
        next
          ? 'Hiring ON! Workers can now see your Call & WhatsApp buttons.'
          : 'Hiring OFF! Your phone number and call buttons are now hidden.',
      );
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : 'Failed to update hiring status',
        true,
      );
    } finally {
      setTogglingMyHiring(false);
    }
  };

  const filteredContractors = contractors.filter((c) => {
    if (
      !matchesDirectoryLocationFilter({
        itemState: c.state,
        itemCity: c.city,
        mode: locationFilter,
        selectedState,
        selectedCity,
        filterState,
        filterCity,
      })
    ) {
      return false;
    }
    if (onlyActivelyHiring && !c.isHiring) return false;
    if (
      resolvedTrade &&
      !c.tradesHired.some((t) => t.toLowerCase().includes(resolvedTrade))
    ) {
      return false;
    }
    return true;
  });

  const handleShareContractor = (contractor: ContractorProfile) => {
    if (!contractor.isHiring) return;
    const facilities = formatFacilitiesText(contractor.facilities);
    const appLink = getAppShareLink();
    const text = `Active Contractor Hiring on Kaam Connect:\nContractor: ${contractor.name}${
      contractor.companyName ? ` (${contractor.companyName})` : ''
    }\nTrades Hired: ${contractor.tradesHired.join(', ')}\nLocation: ${contractor.city}, ${contractor.state}${
      facilities ? `\nFacilities: ${facilities}` : ''
    }\nCall Directly: +91 ${contractor.phone}\n\nOpen Kaam Connect:\n${appLink}`;
    window.open(buildWhatsAppShareUrl(text), '_blank', 'noopener,noreferrer');
  };

  const activeStateForSuggestions =
    filterState !== 'ALL' ? filterState : selectedState;
  const citySuggestions = QUICK_CITIES_BY_STATE[activeStateForSuggestions] || [];

  return (
    <div className="space-y-4">
      {/* 1-Tap Hiring ON/OFF Bar for Logged-In Contractor */}
      {myContractorProfile && (
        <div
          className={`rounded-2xl border p-3.5 md:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
            myContractorProfile.isHiring
              ? 'bg-emerald-50 border-emerald-300'
              : 'bg-slate-100 border-slate-300'
          }`}
        >
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-600">
              My Contractor Hiring Status ({myContractorProfile.name})
            </div>
            <div
              className={`text-sm font-bold ${
                myContractorProfile.isHiring ? 'text-emerald-900' : 'text-slate-800'
              }`}
            >
              {myContractorProfile.isHiring
                ? 'Hiring ON (Need Workers) — Call & WhatsApp buttons visible'
                : 'Hiring OFF (No Vacancy) — Phone number hidden from workers'}
            </div>
          </div>

          <button
            type="button"
            disabled={togglingMyHiring}
            onClick={handleToggleMyHiring}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-white inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
              myContractorProfile.isHiring
                ? 'bg-emerald-700 hover:bg-emerald-800'
                : 'bg-slate-700 hover:bg-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>
              {togglingMyHiring
                ? 'Updating...'
                : myContractorProfile.isHiring
                ? 'Turn Hiring OFF'
                : 'Turn Hiring ON'}
            </span>
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 md:p-4 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start">
            <button
              type="button"
              onClick={() => handleSelectLocationMode('city')}
              className={`min-h-[40px] rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors whitespace-nowrap ${
                locationFilter === 'city'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My City
            </button>
            <button
              type="button"
              onClick={() => handleSelectLocationMode('all_india')}
              className={`min-h-[40px] rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors whitespace-nowrap ${
                locationFilter === 'all_india'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All India
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowRegisterForm((prev) => !prev)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>{showRegisterForm ? 'Close Form' : '+ Register Profile'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
          <div>
            <label
              htmlFor="contractors-filter-state"
              className="block text-sm font-semibold text-slate-800 mb-1.5"
            >
              State
            </label>
            <select
              id="contractors-filter-state"
              value={filterState}
              onChange={(e) => {
                const val = e.target.value;
                setLocationFilter('all_india');
                setFilterState(val);
                setFilterCity('');
              }}
              className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900"
            >
              <option value="ALL">All States (India)</option>
              {INDIA_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="contractors-filter-city"
              className="block text-sm font-semibold text-slate-800 mb-1.5"
            >
              City / Site Area
            </label>
            <input
              id="contractors-filter-city"
              type="text"
              list="contractors-filter-city-list"
              value={filterCity}
              onChange={(e) => {
                const nextCity = e.target.value;
                setFilterCity(nextCity);
                if (locationFilter === 'city' && nextCity !== selectedCity) {
                  setLocationFilter('all_india');
                }
              }}
              placeholder="Any city (e.g. Rourkela, Surat)"
              className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900"
            />
            <datalist id="contractors-filter-city-list">
              {citySuggestions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <SkillSelectField
            id="contractors-filter-trade"
            label="Trade Needed"
            selectedSkill={tradeFilter}
            customSkill={customTradeFilter}
            onSelectSkill={setTradeFilter}
            onCustomSkillChange={setCustomTradeFilter}
            includeAllOption
            allOptionLabel="All Trades Hired"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <button
            type="button"
            aria-pressed={onlyActivelyHiring}
            onClick={() => setOnlyActivelyHiring((prev) => !prev)}
            className={`min-h-[42px] rounded-xl border px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
              onlyActivelyHiring
                ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Show Only Actively Hiring</span>
          </button>

          <span className="text-xs font-semibold text-slate-600 tabular-nums">
            {filteredContractors.length} Contractors Found
          </span>
        </div>
      </div>

      {showRegisterForm && (
        <RegisterProfilePanel
          defaultRole="contractor"
          currentUser={currentUser}
          selectedState={selectedState}
          selectedCity={selectedCity}
          onSaved={onUserSynced}
          onClose={() => setShowRegisterForm(false)}
          onNotify={onNotify}
        />
      )}

      {filteredContractors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <h3 className="text-base font-bold text-slate-900">
            No Contractors Found for This Filter
          </h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            {locationFilter === 'city'
              ? 'Switch to "All India" to browse contractors across India, or tap "+ Register Profile" above.'
              : 'No registered contractors match these filters yet. Tap "+ Register Profile" above to add a contractor.'}
          </p>
          {locationFilter === 'city' && (
            <button
              type="button"
              onClick={() => handleSelectLocationMode('all_india')}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800"
            >
              View All India Contractors
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredContractors.map((contractor) => (
            <article
              key={contractor.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900">
                        {contractor.name}
                      </h3>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
                          contractor.isHiring
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-300'
                        }`}
                      >
                        {contractor.isHiring ? 'Hiring ON' : 'Hiring OFF'}
                      </span>
                    </div>
                    {contractor.companyName && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{contractor.companyName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-700 border-t border-slate-100 pt-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>
                        {contractor.city}, {contractor.state}
                      </span>
                    </div>
                    {contractor.isHiring && (
                      <span className="font-mono tabular-nums font-semibold text-slate-800">
                        +91 {contractor.phone}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Trades / Workers Hired:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {contractor.tradesHired.map((trade) => (
                        <span
                          key={trade}
                          className="inline-flex items-center px-2 py-0.5 rounded-md bg-orange-50 border border-orange-200 text-[11px] font-semibold text-orange-800"
                        >
                          {trade}
                        </span>
                      ))}
                    </div>
                  </div>

                  {(contractor.facilities.stayFree ||
                    contractor.facilities.foodFree ||
                    contractor.facilities.travelAllowance) && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {contractor.facilities.stayFree && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800">
                          <Home className="w-3 h-3" />
                          <span>Free Stay</span>
                        </span>
                      )}
                      {contractor.facilities.foodFree && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800">
                          <Utensils className="w-3 h-3" />
                          <span>Free Food</span>
                        </span>
                      )}
                      {contractor.facilities.travelAllowance && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800">
                          <Bus className="w-3 h-3" />
                          <span>Travel Allowance</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                {contractor.isHiring ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={buildTelUrl(contractor.phone)}
                        className="min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Call Now</span>
                      </a>
                      <a
                        href={buildDirectWhatsAppUrl(
                          contractor.phone,
                          `Hello ${contractor.name}, I saw your contractor profile on Kaam Connect and I am looking for work.`,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[44px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>WhatsApp</span>
                      </a>
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleShareContractor(contractor)}
                        className="min-h-[38px] px-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 inline-flex items-center gap-1.5"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share on WhatsApp</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onReport({
                            targetType: 'contractor',
                            targetId: contractor.id,
                            targetName: contractor.companyName
                              ? `${contractor.name} (${contractor.companyName})`
                              : contractor.name,
                            targetPhone: contractor.phone,
                          })
                        }
                        className="min-h-[38px] px-2.5 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 inline-flex items-center gap-1"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        <span>Report</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 flex items-center gap-2 text-xs font-medium text-slate-600">
                      <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>
                        Hiring OFF — Contact hidden to protect contractor from unwanted calls
                      </span>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          onReport({
                            targetType: 'contractor',
                            targetId: contractor.id,
                            targetName: contractor.companyName
                              ? `${contractor.name} (${contractor.companyName})`
                              : contractor.name,
                            targetPhone: '',
                            hidePhone: true,
                          })
                        }
                        className="min-h-[38px] px-2.5 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 inline-flex items-center gap-1"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        <span>Report</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

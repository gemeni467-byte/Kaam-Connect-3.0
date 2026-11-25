import React, { useState } from 'react';
import {
  Phone,
  MessageCircle,
  Share2,
  Flag,
  MapPin,
  Users,
  Plane,
  UserPlus,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { INDIA_STATES, QUICK_CITIES_BY_STATE } from '../data/constants';
import { setWorkerAvailabilityStatus } from '../firebase';
import type { LocationFilterMode, UserAccount, WorkerProfile } from '../types';
import {
  buildDirectWhatsAppUrl,
  buildTelUrl,
  buildWhatsAppShareUrl,
  getAppShareLink,
  matchesDirectoryLocationFilter,
  resolveSkill,
} from '../utils/matching';
import { SkillSelectField } from './SkillSelectField';
import { RegisterProfilePanel } from './RegisterProfilePanel';
import type { ReportTarget } from './ReportModal';

interface WorkerDirectoryTabProps {
  currentUser: UserAccount | null;
  myWorkerProfile: WorkerProfile | null;
  workers: WorkerProfile[];
  selectedState: string;
  selectedCity: string;
  onUserSynced: (user: { name: string; phone: string; state: string; city: string }) => void;
  onReport: (target: ReportTarget) => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

export const WorkerDirectoryTab: React.FC<WorkerDirectoryTabProps> = ({
  currentUser,
  myWorkerProfile,
  workers,
  selectedState,
  selectedCity,
  onUserSynced,
  onReport,
  onNotify,
}) => {
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [locationFilter, setLocationFilter] = useState<LocationFilterMode>('city');
  const [filterState, setFilterState] = useState<string>('ALL');
  const [filterCity, setFilterCity] = useState<string>('');
  const [skillFilter, setSkillFilter] = useState<string>('ALL');
  const [customSkillFilter, setCustomSkillFilter] = useState<string>('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlyOutstation, setOnlyOutstation] = useState(false);
  const [togglingMyStatus, setTogglingMyStatus] = useState(false);

  const resolvedSkill =
    skillFilter === 'ALL' ? '' : resolveSkill(skillFilter, customSkillFilter).toLowerCase();

  const handleSelectLocationMode = (mode: LocationFilterMode) => {
    setLocationFilter(mode);
    if (mode === 'city') {
      setFilterState('ALL');
      setFilterCity('');
    }
  };

  const handleToggleMyAvailability = async () => {
    if (!myWorkerProfile) return;
    setTogglingMyStatus(true);
    try {
      const next = !myWorkerProfile.isAvailable;
      await setWorkerAvailabilityStatus(myWorkerProfile, next);
      onNotify(
        next
          ? 'Your status is now Available for Work.'
          : 'Your status is now Currently Working / Busy.',
      );
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : 'Failed to update availability',
        true,
      );
    } finally {
      setTogglingMyStatus(false);
    }
  };

  const filteredWorkers = workers.filter((w) => {
    if (
      !matchesDirectoryLocationFilter({
        itemState: w.state,
        itemCity: w.city,
        mode: locationFilter,
        selectedState,
        selectedCity,
        filterState,
        filterCity,
      })
    ) {
      return false;
    }
    if (onlyAvailable && !w.isAvailable) return false;
    if (onlyOutstation && !w.outstationReady) return false;
    if (resolvedSkill && !w.skill.toLowerCase().includes(resolvedSkill)) {
      return false;
    }
    return true;
  });

  const handleShareWorker = (worker: WorkerProfile) => {
    const teamText =
      worker.workerType === 'team_leader'
        ? `Team Leader (${worker.teamSize} Workers)`
        : 'Individual Worker';
    const appLink = getAppShareLink();
    const text = `Skilled Worker on Kaam Connect:\nName: ${worker.name}\nSkill / Trade: ${worker.skill}\nStatus: ${
      worker.isAvailable ? 'Available for Work' : 'Busy / On Site'
    }\nType: ${teamText}\nExpected Rate: ₹${worker.dailyRate}/day\nLocation: ${worker.city}, ${worker.state}${
      worker.outstationReady ? '\nReady to work in other cities / states' : ''
    }\nCall Directly: +91 ${worker.phone}\n\nOpen Kaam Connect:\n${appLink}`;
    window.open(buildWhatsAppShareUrl(text), '_blank', 'noopener,noreferrer');
  };

  const activeStateForSuggestions =
    filterState !== 'ALL' ? filterState : selectedState;
  const citySuggestions = QUICK_CITIES_BY_STATE[activeStateForSuggestions] || [];

  return (
    <div className="space-y-4">
      {/* 1-Tap Availability Toggle Bar for Logged-In Worker */}
      {myWorkerProfile && (
        <div
          className={`rounded-2xl border p-3.5 md:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
            myWorkerProfile.isAvailable
              ? 'bg-emerald-50 border-emerald-300'
              : 'bg-rose-50 border-rose-200'
          }`}
        >
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-600">
              My Worker Directory Status ({myWorkerProfile.name})
            </div>
            <div
              className={`text-sm font-bold ${
                myWorkerProfile.isAvailable ? 'text-emerald-900' : 'text-rose-900'
              }`}
            >
              {myWorkerProfile.isAvailable
                ? 'Available for Work (Shown in Green)'
                : 'Currently Working / Busy (Shown in Red)'}
            </div>
          </div>

          <button
            type="button"
            disabled={togglingMyStatus}
            onClick={handleToggleMyAvailability}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-white inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
              myWorkerProfile.isAvailable
                ? 'bg-emerald-700 hover:bg-emerald-800'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {myWorkerProfile.isAvailable ? (
              <>
                <Clock className="w-4 h-4" />
                <span>{togglingMyStatus ? 'Updating...' : 'Switch to Busy / On Site'}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{togglingMyStatus ? 'Updating...' : 'Switch to Available for Work'}</span>
              </>
            )}
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
              htmlFor="workers-filter-state"
              className="block text-sm font-semibold text-slate-800 mb-1.5"
            >
              State
            </label>
            <select
              id="workers-filter-state"
              value={locationFilter === 'city' && filterState === 'ALL' ? selectedState : filterState}
              onChange={(e) => {
                const val = e.target.value;
                setFilterState(val);
                if (val === 'ALL') {
                  setLocationFilter('all_india');
                  setFilterCity('');
                } else {
                  setLocationFilter('all_india');
                }
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
              htmlFor="workers-filter-city"
              className="block text-sm font-semibold text-slate-800 mb-1.5"
            >
              City / Site Area
            </label>
            <input
              id="workers-filter-city"
              type="text"
              list="workers-filter-city-list"
              value={locationFilter === 'city' && !filterCity ? selectedCity : filterCity}
              onChange={(e) => {
                setFilterCity(e.target.value);
                if (e.target.value.trim()) {
                  setLocationFilter('all_india');
                }
              }}
              placeholder="Any city (e.g. Rourkela, Patna)"
              className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900"
            />
            <datalist id="workers-filter-city-list">
              {citySuggestions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <SkillSelectField
            id="workers-filter-skill"
            label="Skill / Trade"
            selectedSkill={skillFilter}
            customSkill={customSkillFilter}
            onSelectSkill={setSkillFilter}
            onCustomSkillChange={setCustomSkillFilter}
            includeAllOption
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-pressed={onlyAvailable}
              onClick={() => setOnlyAvailable((prev) => !prev)}
              className={`min-h-[42px] rounded-xl border px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
                onlyAvailable
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Show Only Available Workers</span>
            </button>

            <button
              type="button"
              aria-pressed={onlyOutstation}
              onClick={() => setOnlyOutstation((prev) => !prev)}
              className={`min-h-[42px] rounded-xl border px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
                onlyOutstation
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Plane className="w-3.5 h-3.5" />
              <span>Outstation Ready Only</span>
            </button>
          </div>

          <span className="text-xs font-semibold text-slate-600 tabular-nums">
            {filteredWorkers.length} Workers Found
          </span>
        </div>
      </div>

      {showRegisterForm && (
        <RegisterProfilePanel
          defaultRole="worker"
          currentUser={currentUser}
          selectedState={selectedState}
          selectedCity={selectedCity}
          onSaved={onUserSynced}
          onClose={() => setShowRegisterForm(false)}
          onNotify={onNotify}
        />
      )}

      {filteredWorkers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <h3 className="text-base font-bold text-slate-900">
            No Workers Available for This Filter
          </h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            {locationFilter === 'city'
              ? 'Switch to "All India" to find skilled workers across India, or tap "+ Register Profile" above.'
              : 'No registered workers match these filters yet. Tap "+ Register Profile" above to add a worker profile.'}
          </p>
          {locationFilter === 'city' && (
            <button
              type="button"
              onClick={() => handleSelectLocationMode('all_india')}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800"
            >
              View All India Workers
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredWorkers.map((worker) => (
            <article
              key={worker.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900">
                        {worker.name}
                      </h3>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
                          worker.isAvailable
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border-rose-200'
                        }`}
                      >
                        {worker.isAvailable ? 'Available for Work' : 'Busy / On Site'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-orange-50 border border-orange-200 text-xs font-bold text-orange-800">
                        {worker.skill}
                      </span>
                      {worker.outstationReady && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-[11px] font-semibold text-slate-700">
                          <Plane className="w-3 h-3 text-emerald-700" />
                          <span>Outstation Ready</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-lg font-extrabold text-slate-900 tabular-nums">
                      ₹{worker.dailyRate}
                    </div>
                    <div className="text-[11px] font-medium text-slate-500">
                      ₹/day
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-700 border-t border-slate-100 pt-2.5">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>
                      {worker.city}, {worker.state} · Experience:{' '}
                      <strong className="tabular-nums">{worker.experienceYears} yrs</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>
                      {worker.workerType === 'team_leader'
                        ? `Team Leader (With Squad: ${worker.teamSize} Workers)`
                        : 'Individual Worker'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={buildTelUrl(worker.phone)}
                    className={`min-h-[44px] rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors ${
                      worker.isAvailable
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                    }`}
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Now</span>
                  </a>
                  <a
                    href={buildDirectWhatsAppUrl(
                      worker.phone,
                      `Hello ${worker.name}, I saw your "${worker.skill}" profile on Kaam Connect.`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`min-h-[44px] rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors ${
                      worker.isAvailable
                        ? 'bg-slate-900 hover:bg-slate-800 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </a>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleShareWorker(worker)}
                    className="min-h-[38px] px-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 inline-flex items-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share on WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onReport({
                        targetType: 'worker',
                        targetId: worker.id,
                        targetName: `${worker.name} (${worker.skill})`,
                        targetPhone: worker.phone,
                      })
                    }
                    className="min-h-[38px] px-2.5 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 inline-flex items-center gap-1"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>Report</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Phone,
  MessageCircle,
  Share2,
  Flag,
  Power,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Users,
  MapPin,
  Clock,
  Send,
} from 'lucide-react';
import {
  CONTRACTOR_QUICK_CHATS,
  CUSTOM_SKILL_OPTION,
  INDIA_STATES,
  LIVE_REQUEST_MAX_AGE_HOURS,
  QUICK_CITIES_BY_STATE,
  SKILLS_LIST,
  WORKER_COUNT_PRESETS,
  WORKER_QUICK_CHATS,
} from '../data/constants';
import {
  acceptLiveRequestTransaction,
  closeLiveRequest,
  createLiveRequest,
  sendQuickChatMessage,
  setWorkerDutyStatus,
} from '../firebase';
import type {
  FacilityFlags,
  LiveRequest,
  LocationFilterMode,
  UserAccount,
  WorkerProfile,
} from '../types';
import {
  buildDirectWhatsAppUrl,
  buildTelUrl,
  buildWhatsAppShareUrl,
  canWorkerAcceptRequest,
  formatFacilitiesText,
  formatRelativeTime,
  getAppShareLink,
  isValidIndianMobile,
  isWithinHours,
  matchesLocationFilter,
  normalizePhone,
  resolveSkill,
} from '../utils/matching';
import { FacilityCheckboxes } from './FacilityCheckboxes';
import { SkillSelectField } from './SkillSelectField';
import type { ReportTarget } from './ReportModal';

interface LiveBookingFormProps {
  currentUser: UserAccount | null;
  selectedState: string;
  selectedCity: string;
  onCreated: () => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

interface LiveBookingFormState {
  contractorName: string;
  contractorPhone: string;
  selectedSkill: string;
  customSkill: string;
  requiredCount: number;
  customCountInput: string;
  dailyRate: string;
  state: string;
  city: string;
  siteAddress: string;
  facilities: FacilityFlags;
}

const LiveBookingForm: React.FC<LiveBookingFormProps> = ({
  currentUser,
  selectedState,
  selectedCity,
  onCreated,
  onNotify,
}) => {
  const [form, setForm] = useState<LiveBookingFormState>({
    contractorName: currentUser?.name || '',
    contractorPhone: currentUser?.phone || '',
    selectedSkill: SKILLS_LIST[0],
    customSkill: '',
    requiredCount: 1,
    customCountInput: '',
    dailyRate: '650',
    state: selectedState,
    city: selectedCity,
    siteAddress: '',
    facilities: {
      stayFree: false,
      foodFree: false,
      travelAllowance: false,
    },
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      contractorName: prev.contractorName || currentUser?.name || '',
      contractorPhone: prev.contractorPhone || currentUser?.phone || '',
    }));
  }, [currentUser]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      state: selectedState,
      city: selectedCity,
    }));
  }, [selectedState, selectedCity]);

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
    const skill = resolveSkill(form.selectedSkill, form.customSkill);
    const cleanPhone = normalizePhone(form.contractorPhone);
    const countVal = form.customCountInput.trim()
      ? Number(form.customCountInput)
      : form.requiredCount;

    if (!form.contractorName.trim()) {
      onNotify('Please enter contractor name', true);
      return;
    }
    if (!isValidIndianMobile(cleanPhone)) {
      onNotify('Please enter a valid 10-digit mobile number', true);
      return;
    }
    if (!skill) {
      onNotify('Please select or enter a skill / trade', true);
      return;
    }
    if (!Number.isFinite(countVal) || countVal < 1) {
      onNotify('Worker count must be at least 1', true);
      return;
    }

    setSubmitting(true);
    try {
      await createLiveRequest({
        contractorName: form.contractorName.trim(),
        contractorPhone: cleanPhone,
        skill,
        requiredCount: Math.round(countVal),
        dailyRate: Number(form.dailyRate) || 600,
        state: form.state,
        city: form.city.trim() || selectedCity,
        siteAddress: form.siteAddress.trim(),
        facilities: form.facilities,
      });
      onNotify('Live request published! Nearby online workers can see it now.');
      setForm((prev) => ({
        ...prev,
        siteAddress: '',
        customCountInput: '',
        customSkill: prev.selectedSkill === CUSTOM_SKILL_OPTION ? '' : prev.customSkill,
      }));
      onCreated();
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : 'Failed to publish live request',
        true,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const stateCities = QUICK_CITIES_BY_STATE[form.state] || [];

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 space-y-4"
    >
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Hire Workers Instantly (Live Booking)
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Online workers on Duty ON receive your live request immediately
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div>
          <label
            htmlFor="live-contractor-name"
            className="block text-sm font-semibold text-slate-800 mb-1"
          >
            Contractor / Company Name <span className="text-orange-600">*</span>
          </label>
          <input
            id="live-contractor-name"
            type="text"
            value={form.contractorName}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, contractorName: e.target.value }))
            }
            placeholder="e.g. Ramesh Verma"
            className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label
            htmlFor="live-contractor-phone"
            className="block text-sm font-semibold text-slate-800 mb-1"
          >
            10-Digit Mobile Number <span className="text-orange-600">*</span>
          </label>
          <input
            id="live-contractor-phone"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={form.contractorPhone}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                contractorPhone: normalizePhone(e.target.value),
              }))
            }
            placeholder="9876543210"
            className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-orange-500 focus:outline-none"
            required
          />
        </div>
      </div>

      <SkillSelectField
        id="live-skill-select"
        label="Skill / Trade Needed"
        selectedSkill={form.selectedSkill}
        customSkill={form.customSkill}
        onSelectSkill={(val) =>
          setForm((prev) => ({ ...prev, selectedSkill: val }))
        }
        onCustomSkillChange={(val) =>
          setForm((prev) => ({ ...prev, customSkill: val }))
        }
        required
      />

      <div className="space-y-2">
        <span className="block text-sm font-semibold text-slate-800">
          How many workers needed? <span className="text-orange-600">*</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {WORKER_COUNT_PRESETS.map((preset) => {
            const active =
              !form.customCountInput && form.requiredCount === preset.value;
            return (
              <button
                key={preset.value}
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    requiredCount: preset.value,
                    customCountInput: '',
                  }))
                }
                className={`min-h-[42px] rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                  active
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
          <input
            type="number"
            min={1}
            max={500}
            aria-label="Enter custom worker count"
            value={form.customCountInput}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, customCountInput: e.target.value }))
            }
            placeholder="Custom count"
            className="w-32 min-h-[42px] rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold tabular-nums text-slate-900 focus:border-orange-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div>
          <label
            htmlFor="live-daily-rate"
            className="block text-sm font-semibold text-slate-800 mb-1"
          >
            Daily Wage (₹/day) <span className="text-orange-600">*</span>
          </label>
          <input
            id="live-daily-rate"
            type="number"
            min={100}
            value={form.dailyRate}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, dailyRate: e.target.value }))
            }
            placeholder="650"
            className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-orange-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label
            htmlFor="live-state-select"
            className="block text-sm font-semibold text-slate-800 mb-1"
          >
            State
          </label>
          <select
            id="live-state-select"
            value={form.state}
            onChange={(e) => {
              const st = e.target.value;
              setForm((prev) => ({
                ...prev,
                state: st,
                city: QUICK_CITIES_BY_STATE[st]?.[0] || '',
              }));
            }}
            className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
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
            htmlFor="live-city-input"
            className="block text-sm font-semibold text-slate-800 mb-1"
          >
            City / Site Area <span className="text-orange-600">*</span>
          </label>
          <input
            id="live-city-input"
            type="text"
            list="live-city-suggestions"
            value={form.city}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, city: e.target.value }))
            }
            placeholder="Rourkela"
            className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
            required
          />
          <datalist id="live-city-suggestions">
            {stateCities.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </div>

      <div>
        <label
          htmlFor="live-site-address"
          className="block text-sm font-semibold text-slate-800 mb-1"
        >
          Site Address
        </label>
        <input
          id="live-site-address"
          type="text"
          value={form.siteAddress}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, siteAddress: e.target.value }))
          }
          placeholder="e.g. Sector 19, near Steel Plant Gate No. 2"
          className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
        />
      </div>

      <FacilityCheckboxes
        facilities={form.facilities}
        onToggle={handleToggleFacility}
      />

      <button
        type="submit"
        disabled={submitting}
        className="w-full min-h-[48px] rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-bold text-sm inline-flex items-center justify-center gap-2 transition-colors"
      >
        <PlusCircle className="w-4 h-4" />
        <span>
          {submitting ? 'Sending Request...' : 'Send Instant Request'}
        </span>
      </button>
    </form>
  );
};

interface LiveMatchingTabProps {
  currentUser: UserAccount | null;
  myWorkerProfile: WorkerProfile | null;
  workers: WorkerProfile[];
  liveRequests: LiveRequest[];
  selectedState: string;
  selectedCity: string;
  onGoToAccount: () => void;
  onReport: (target: ReportTarget) => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

export const LiveMatchingTab: React.FC<LiveMatchingTabProps> = ({
  currentUser,
  myWorkerProfile,
  workers,
  liveRequests,
  selectedState,
  selectedCity,
  onGoToAccount,
  onReport,
  onNotify,
}) => {
  const [roleMode, setRoleMode] = useState<'worker' | 'contractor'>('worker');
  const [locationFilter, setLocationFilter] = useState<LocationFilterMode>('city');
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [togglingDuty, setTogglingDuty] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [sendingMsgKey, setSendingMsgKey] = useState<string | null>(null);
  const [customChatText, setCustomChatText] = useState<Record<string, string>>({});
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const isDutyOn = Boolean(myWorkerProfile?.isOnline);

  const onlineWorkersCount = workers.filter(
    (w) =>
      w.isOnline &&
      matchesLocationFilter(w.state, w.city, selectedState, selectedCity, locationFilter),
  ).length;

  const activeLiveRequests = liveRequests.filter(
    (req) =>
      req.status === 'open' &&
      isWithinHours(req.createdAt, LIVE_REQUEST_MAX_AGE_HOURS, now) &&
      !dismissedIds.includes(req.id) &&
      matchesLocationFilter(
        req.state,
        req.city,
        selectedState,
        selectedCity,
        locationFilter,
      ),
  );

  const myContractorRequests = currentUser
    ? liveRequests.filter(
        (req) =>
          normalizePhone(req.contractorPhone) === normalizePhone(currentUser.phone) &&
          isWithinHours(req.createdAt, LIVE_REQUEST_MAX_AGE_HOURS, now),
      )
    : [];

  const handleToggleDuty = async () => {
    if (!currentUser || !isValidIndianMobile(currentUser.phone)) {
      onNotify('Please join with your mobile number first to turn Duty ON', true);
      onGoToAccount();
      return;
    }

    setTogglingDuty(true);
    try {
      const nextOnline = !isDutyOn;
      await setWorkerDutyStatus({
        phone: currentUser.phone,
        name: currentUser.name,
        state: selectedState,
        city: selectedCity,
        isOnline: nextOnline,
        existingProfile: myWorkerProfile,
      });
      onNotify(
        nextOnline
          ? 'Duty ON! You are now online and can see live work requests.'
          : 'You are now Offline (Duty OFF).',
      );
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : 'Failed to update Duty status',
        true,
      );
    } finally {
      setTogglingDuty(false);
    }
  };

  const handleAcceptRequest = async (req: LiveRequest) => {
    if (!currentUser || !isValidIndianMobile(currentUser.phone)) {
      onNotify('Please join with your mobile number first to accept jobs', true);
      onGoToAccount();
      return;
    }

    setAcceptingId(req.id);
    try {
      await acceptLiveRequestTransaction({
        requestId: req.id,
        user: { name: currentUser.name, phone: currentUser.phone },
        workerProfile: myWorkerProfile,
      });
      onNotify('Job Confirmed! Call or message the contractor directly.');
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : 'Unable to accept this job',
        true,
      );
    } finally {
      setAcceptingId(null);
    }
  };

  const handleQuickChat = async (
    requestId: string,
    text: string,
    role: 'worker' | 'contractor',
  ) => {
    if (!currentUser || !text.trim()) return;
    const key = `${requestId}-${text}`;
    setSendingMsgKey(key);
    try {
      await sendQuickChatMessage({
        requestId,
        senderPhone: currentUser.phone,
        senderName: currentUser.name,
        senderRole: role,
        text,
      });
      setCustomChatText((prev) => ({ ...prev, [requestId]: '' }));
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : 'Failed to send message',
        true,
      );
    } finally {
      setSendingMsgKey(null);
    }
  };

  const handleCloseRequest = async (requestId: string) => {
    try {
      await closeLiveRequest(requestId);
      onNotify('Live request closed.');
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : 'Failed to close request',
        true,
      );
    }
  };

  const shareLiveRequestOnWhatsApp = (req: LiveRequest) => {
    const facilities = formatFacilitiesText(req.facilities);
    const appLink = getAppShareLink();
    const text = `Urgent Work on Kaam Connect:\nTrade / Skill: ${req.skill}\nDaily Wage: ₹${req.dailyRate}/day\nWorkers Needed: ${req.requiredCount}\nLocation: ${req.city}, ${req.state}${
      req.siteAddress ? ` (${req.siteAddress})` : ''
    }${facilities ? `\nFacilities: ${facilities}` : ''}\nContractor: ${req.contractorName} (+91 ${req.contractorPhone})\nApply directly — No Middleman: ${appLink}`;
    window.open(buildWhatsAppShareUrl(text), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-5">
      {/* Mode Switch + Location Filter Row */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 md:p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div
          role="tablist"
          aria-label="Select Role Mode"
          className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl"
        >
          <button
            type="button"
            role="tab"
            aria-selected={roleMode === 'worker'}
            onClick={() => setRoleMode('worker')}
            className={`min-h-[44px] rounded-lg px-2 sm:px-3 py-2 text-[11px] sm:text-sm font-bold transition-colors whitespace-nowrap truncate ${
              roleMode === 'worker'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Worker (Find Work)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={roleMode === 'contractor'}
            onClick={() => setRoleMode('contractor')}
            className={`min-h-[44px] rounded-lg px-2 sm:px-3 py-2 text-[11px] sm:text-sm font-bold transition-colors whitespace-nowrap truncate ${
              roleMode === 'contractor'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Contractor (Hire Workers)
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setLocationFilter('city')}
              className={`min-h-[40px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                locationFilter === 'city'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My City
            </button>
            <button
              type="button"
              onClick={() => setLocationFilter('all_india')}
              className={`min-h-[40px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                locationFilter === 'all_india'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All India
            </button>
          </div>

          <span className="text-xs font-semibold text-slate-600 tabular-nums px-1">
            Online Workers: <strong className="text-emerald-700">{onlineWorkersCount}</strong>
          </span>
        </div>
      </div>

      {roleMode === 'worker' ? (
        <div className="space-y-4">
          {/* Worker Duty ON / OFF Control Card */}
          <div
            className={`rounded-2xl border p-4 md:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors ${
              isDutyOn
                ? 'bg-emerald-50 border-emerald-300'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-bold ${
                    isDutyOn ? 'text-emerald-900' : 'text-slate-900'
                  }`}
                >
                  {isDutyOn
                    ? 'Duty ON / Online (Available for Work)'
                    : 'Duty OFF — Turn Duty ON to receive live jobs'}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                {currentUser
                  ? `${currentUser.name} · ${currentUser.phone} · You can accept live jobs immediately even without a separate profile`
                  : 'Join with your name and 10-digit mobile number first'}
              </p>
            </div>

            <button
              type="button"
              disabled={togglingDuty}
              onClick={handleToggleDuty}
              className={`min-h-[48px] px-5 py-2.5 rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
                isDutyOn
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>
                {togglingDuty
                  ? 'Updating...'
                  : isDutyOn
                  ? 'Duty ON / Online (Turn OFF)'
                  : 'Duty ON / Online (Available for Work)'}
              </span>
            </button>
          </div>

          {!isDutyOn ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-3">
              <h3 className="text-base font-bold text-slate-900">
                Turn Duty ON to View Live Bookings
              </h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Once you turn Duty ON, live contractor requests in {selectedCity} and across India will appear here automatically.
              </p>
              <button
                type="button"
                onClick={handleToggleDuty}
                className="min-h-[46px] px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold inline-flex items-center gap-2"
              >
                <Power className="w-4 h-4" />
                <span>Go Online (Duty ON)</span>
              </button>
            </div>
          ) : activeLiveRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                No Active Live Requests Right Now
              </h3>
              <p className="text-sm text-slate-600">
                No live requests found in the last 6 hours for this filter. Try switching to &quot;All India&quot; or check the &quot;Contractors List&quot; tab.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {activeLiveRequests.map((req) => {
                const eligibility = canWorkerAcceptRequest(
                  req,
                  currentUser?.phone || '',
                  now,
                );
                const isAcceptedByMe = Boolean(eligibility.alreadyAccepted);
                const isOwn = Boolean(eligibility.isOwnRequest);
                const isFull =
                  req.confirmedCount >= req.requiredCount && !isAcceptedByMe;
                const facilitiesText = formatFacilitiesText(req.facilities);

                return (
                  <article
                    key={req.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-slate-900 leading-snug">
                            {req.skill}
                          </h3>
                          <p className="text-xs text-slate-600 mt-1">
                            {req.contractorName} · {formatRelativeTime(req.createdAt, now)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-lg font-extrabold text-emerald-700 tabular-nums">
                            ₹{req.dailyRate}
                          </div>
                          <div className="text-[11px] font-medium text-slate-500">
                            ₹/day
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-700 border-t border-slate-100 pt-3">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>
                            {req.city}, {req.state}
                            {req.siteAddress ? ` · ${req.siteAddress}` : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 tabular-nums">
                          <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>
                            Needed: <strong>{req.requiredCount}</strong> · Confirmed:{' '}
                            <strong>
                              {req.confirmedCount} / {req.requiredCount}
                            </strong>
                          </span>
                        </div>
                        {facilitiesText && (
                          <div className="text-emerald-800 font-semibold pt-0.5">
                            Facilities: {facilitiesText}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Area */}
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      {isAcceptedByMe ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>✅ Job Confirmed! Contact contractor directly</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <a
                              href={buildTelUrl(req.contractorPhone)}
                              className="min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
                            >
                              <Phone className="w-4 h-4" />
                              <span>Call Now</span>
                            </a>
                            <a
                              href={buildDirectWhatsAppUrl(
                                req.contractorPhone,
                                `Hello ${req.contractorName}, I accepted your "${req.skill}" live request on Kaam Connect.`,
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="min-h-[44px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span>WhatsApp</span>
                            </a>
                          </div>

                          {/* In-App 1-Tap Quick Chat */}
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
                            <span className="block text-xs font-bold text-slate-800">
                              Quick Chat (1-Tap Message to Contractor)
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {WORKER_QUICK_CHATS.map((msgText) => (
                                <button
                                  key={msgText}
                                  type="button"
                                  disabled={sendingMsgKey === `${req.id}-${msgText}`}
                                  onClick={() =>
                                    handleQuickChat(req.id, msgText, 'worker')
                                  }
                                  className="min-h-[36px] rounded-lg border border-slate-300 bg-white hover:bg-orange-50 hover:border-orange-300 px-2.5 py-1 text-xs font-medium text-slate-800 transition-colors text-left"
                                >
                                  {msgText}
                                </button>
                              ))}
                            </div>

                            {req.messages.length > 0 && (
                              <div className="space-y-1.5 max-h-32 overflow-y-auto pt-1 border-t border-slate-200">
                                {req.messages.map((m) => (
                                  <div
                                    key={m.id}
                                    className="text-xs bg-white rounded-lg border border-slate-200 px-2.5 py-1.5"
                                  >
                                    <span className="font-bold text-slate-900">
                                      {m.senderName}:
                                    </span>{' '}
                                    <span className="text-slate-700">{m.text}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                aria-label="Write custom message"
                                value={customChatText[req.id] || ''}
                                onChange={(e) =>
                                  setCustomChatText((prev) => ({
                                    ...prev,
                                    [req.id]: e.target.value,
                                  }))
                                }
                                placeholder="Write a message..."
                                className="flex-1 min-h-[38px] rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-900"
                              />
                              <button
                                type="button"
                                aria-label="Send message"
                                onClick={() =>
                                  handleQuickChat(
                                    req.id,
                                    customChatText[req.id] || '',
                                    'worker',
                                  )
                                }
                                className="min-h-[38px] min-w-[40px] rounded-lg bg-orange-600 text-white flex items-center justify-center"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {isOwn ? (
                            <button
                              type="button"
                              disabled
                              className="w-full min-h-[44px] rounded-xl bg-slate-100 text-slate-500 border border-slate-200 text-xs font-bold cursor-not-allowed"
                            >
                              This is your own request
                            </button>
                          ) : isFull ? (
                            <button
                              type="button"
                              disabled
                              className="w-full min-h-[44px] rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold cursor-not-allowed"
                            >
                              All required workers have been confirmed
                            </button>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={acceptingId === req.id}
                                onClick={() => handleAcceptRequest(req)}
                                className="flex-1 min-h-[46px] rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-bold transition-colors"
                              >
                                {acceptingId === req.id
                                  ? 'Confirming...'
                                  : 'Accept Job'}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDismissedIds((prev) => [...prev, req.id])
                                }
                                className="min-h-[46px] px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold"
                              >
                                Skip
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => shareLiveRequestOnWhatsApp(req)}
                          className="min-h-[38px] px-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 inline-flex items-center gap-1.5"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Share on WhatsApp</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onReport({
                              targetType: 'live_request',
                              targetId: req.id,
                              targetName: `${req.contractorName} (${req.skill})`,
                              targetPhone: req.contractorPhone,
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
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Contractor Live Mode */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-7">
            <LiveBookingForm
              currentUser={currentUser}
              selectedState={selectedState}
              selectedCity={selectedCity}
              onCreated={() => {}}
              onNotify={onNotify}
            />
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">
                  My Live Booking Status
                </h3>
                <span className="text-xs font-semibold text-emerald-700 tabular-nums">
                  {onlineWorkersCount} Workers Online
                </span>
              </div>

              {myContractorRequests.length === 0 ? (
                <p className="text-xs text-slate-600 py-3">
                  You have no active live requests right now. Fill out the form to hire workers instantly.
                </p>
              ) : (
                <div className="space-y-4">
                  {myContractorRequests.map((req) => (
                    <div
                      key={req.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-bold text-slate-900">
                            {req.skill}
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            <span>
                              {formatRelativeTime(req.createdAt, now)} · ₹{req.dailyRate}/day
                            </span>
                          </div>
                        </div>
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-lg ${
                            req.status === 'open'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {req.status === 'open' ? 'Open' : 'Closed'}
                        </span>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-xl p-3">
                        <div className="text-sm font-extrabold text-slate-900 tabular-nums">
                          {req.confirmedCount} / {req.requiredCount} Workers Confirmed
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 transition-all"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round(
                                  (req.confirmedCount / Math.max(1, req.requiredCount)) *
                                    100,
                                ),
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      {req.acceptedWorkers.length > 0 ? (
                        <div className="space-y-2">
                          <span className="block text-xs font-bold text-slate-700">
                            Confirmed Workers:
                          </span>
                          {req.acceptedWorkers.map((worker, idx) => (
                            <div
                              key={`${worker.phone}-${idx}`}
                              className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-2"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-bold text-slate-900">
                                    {worker.name}
                                  </span>
                                  <span className="text-slate-500 mx-1">·</span>
                                  <span className="text-slate-600">{worker.skill}</span>
                                </div>
                                <span className="font-mono tabular-nums text-slate-600">
                                  {worker.phone}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <a
                                  href={buildTelUrl(worker.phone)}
                                  className="flex-1 min-h-[38px] rounded-lg bg-emerald-600 text-white text-xs font-bold inline-flex items-center justify-center gap-1"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                  <span>Call Now</span>
                                </a>
                                <a
                                  href={buildDirectWhatsAppUrl(
                                    worker.phone,
                                    `Hello ${worker.name}, your "${req.skill}" booking on Kaam Connect is confirmed.`,
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 min-h-[38px] rounded-lg bg-slate-900 text-white text-xs font-bold inline-flex items-center justify-center gap-1"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span>WhatsApp</span>
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-600">
                          Waiting for workers to accept...
                        </p>
                      )}

                      {/* Contractor Quick Chat Replies */}
                      {req.status === 'open' && (
                        <div className="space-y-2 pt-1">
                          <div className="flex flex-wrap gap-1.5">
                            {CONTRACTOR_QUICK_CHATS.map((msg) => (
                              <button
                                key={msg}
                                type="button"
                                onClick={() =>
                                  handleQuickChat(req.id, msg, 'contractor')
                                }
                                className="min-h-[34px] rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-800 hover:bg-orange-50 text-left"
                              >
                                {msg}
                              </button>
                            ))}
                          </div>

                          {req.messages.length > 0 && (
                            <div className="space-y-1 max-h-28 overflow-y-auto">
                              {req.messages.map((m) => (
                                <div
                                  key={m.id}
                                  className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1"
                                >
                                  <span className="font-bold">{m.senderName}:</span>{' '}
                                  <span>{m.text}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => shareLiveRequestOnWhatsApp(req)}
                              className="flex-1 min-h-[42px] rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 inline-flex items-center justify-center gap-1.5"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>Share on WhatsApp</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCloseRequest(req.id)}
                              className="flex-1 min-h-[42px] rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white inline-flex items-center justify-center gap-1.5"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Close Request</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

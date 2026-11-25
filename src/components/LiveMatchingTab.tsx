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
  formatRelativeTimeHindi,
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
      onNotify('ठेकेदार का नाम लिखें', true);
      return;
    }
    if (!isValidIndianMobile(cleanPhone)) {
      onNotify('सही 10 अंकों का मोबाइल नंबर लिखें', true);
      return;
    }
    if (!skill) {
      onNotify('कृपया काम (Skill) लिखें', true);
      return;
    }
    if (!Number.isFinite(countVal) || countVal < 1) {
      onNotify('मजदूरों की संख्या कम से कम 1 रखें', true);
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
      onNotify('लाइव रिक्वेस्ट पोस्ट हो गई! आसपास के मजदूरों को अभी दिख रही है।');
      setForm((prev) => ({
        ...prev,
        siteAddress: '',
        customCountInput: '',
        customSkill: prev.selectedSkill === CUSTOM_SKILL_OPTION ? '' : prev.customSkill,
      }));
      onCreated();
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : 'रिक्वेस्ट भेजने में समस्या हुई',
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
            तुरंत मजदूर बुलाएं (Live Booking)
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            रिक्वेस्ट डालते ही Duty ON कारीगरों को तुरंत नोटिफिकेशन दिखेगा
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div>
          <label
            htmlFor="live-contractor-name"
            className="block text-sm font-semibold text-slate-800 mb-1"
          >
            ठेकेदार / आपका नाम <span className="text-orange-600">*</span>
          </label>
          <input
            id="live-contractor-name"
            type="text"
            value={form.contractorName}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, contractorName: e.target.value }))
            }
            placeholder="जैसे: रमेश वर्मा"
            className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label
            htmlFor="live-contractor-phone"
            className="block text-sm font-semibold text-slate-800 mb-1"
          >
            10 अंकों का मोबाइल नंबर <span className="text-orange-600">*</span>
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
        label="कौन-सा कारीगर / मजदूर चाहिए"
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
          कितने मजदूर चाहिए <span className="text-orange-600">*</span>
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
            aria-label="अन्य संख्या लिखें"
            value={form.customCountInput}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, customCountInput: e.target.value }))
            }
            placeholder="अन्य संख्या"
            className="w-28 min-h-[42px] rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold tabular-nums text-slate-900 focus:border-orange-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div>
          <label
            htmlFor="live-daily-rate"
            className="block text-sm font-semibold text-slate-800 mb-1"
          >
            रोज़ाना रेट (₹ प्रति दिन) <span className="text-orange-600">*</span>
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
            राज्य (State)
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
            शहर / क्षेत्र <span className="text-orange-600">*</span>
          </label>
          <input
            id="live-city-input"
            type="text"
            list="live-city-suggestions"
            value={form.city}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, city: e.target.value }))
            }
            placeholder="राउरकेला (Rourkela)"
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
          साइट का पूरा पता (Site Address)
        </label>
        <input
          id="live-site-address"
          type="text"
          value={form.siteAddress}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, siteAddress: e.target.value }))
          }
          placeholder="जैसे: सेक्टर 19, स्टील प्लांट गेट नंबर 2 के पास"
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
          {submitting ? 'पोस्ट हो रहा है...' : 'लाइव रिक्वेस्ट भेजें (तुरंत बुलाएं)'}
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
      onNotify('Duty ON करने के लिए पहले अपना मोबाइल नंबर जोड़ें', true);
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
          ? 'Duty ON हो गई! अब आपको लाइव काम की रिक्वेस्ट दिखेंगी।'
          : 'आपकी Duty अब Offline है।',
      );
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : 'Duty स्थिति बदलने में समस्या हुई',
        true,
      );
    } finally {
      setTogglingDuty(false);
    }
  };

  const handleAcceptRequest = async (req: LiveRequest) => {
    if (!currentUser || !isValidIndianMobile(currentUser.phone)) {
      onNotify('काम लेने के लिए पहले मोबाइल नंबर से जुड़ें', true);
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
      onNotify('बधाई हो! काम कन्फर्म हो गया — अब ठेकेदार को सीधे कॉल या मैसेज करें।');
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : 'काम Accept करने में समस्या हुई',
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
        err instanceof Error ? err.message : 'मैसेज भेजने में समस्या हुई',
        true,
      );
    } finally {
      setSendingMsgKey(null);
    }
  };

  const handleCloseRequest = async (requestId: string) => {
    try {
      await closeLiveRequest(requestId);
      onNotify('रिक्वेस्ट बंद कर दी गई है।');
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : 'रिक्वेस्ट बंद करने में समस्या हुई',
        true,
      );
    }
  };

  const shareLiveRequestOnWhatsApp = (req: LiveRequest) => {
    const facilities = formatFacilitiesText(req.facilities);
    const text = `Kaam Connect पर तुरंत काम:\nकाम: ${req.skill}\nरेट: ₹${req.dailyRate}/दिन\nसंख्या: ${req.requiredCount} मजदूर\nजगह: ${req.city}, ${req.state}${
      req.siteAddress ? ` (${req.siteAddress})` : ''
    }${facilities ? `\nसुविधाएं: ${facilities}` : ''}\nठेकेदार: ${req.contractorName} (+91 ${req.contractorPhone})\nबिना बिचौलिए के सीधे कॉल करें!`;
    window.open(buildWhatsAppShareUrl(text), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-5">
      {/* Mode Switch + Location Filter Row */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 md:p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div
          role="tablist"
          aria-label="मोड चुनें"
          className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl"
        >
          <button
            type="button"
            role="tab"
            aria-selected={roleMode === 'worker'}
            onClick={() => setRoleMode('worker')}
            className={`min-h-[44px] rounded-lg px-3 py-2 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
              roleMode === 'worker'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            मजदूर हैं (काम लें)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={roleMode === 'contractor'}
            onClick={() => setRoleMode('contractor')}
            className={`min-h-[44px] rounded-lg px-3 py-2 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
              roleMode === 'contractor'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ठेकेदार हैं (मजदूर बुलाएं)
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
              मेरे शहर में
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
              पूरे India में (All India)
            </button>
          </div>

          <span className="text-xs font-semibold text-slate-600 tabular-nums px-1">
            Online कारीगर: <strong className="text-emerald-700">{onlineWorkersCount}</strong>
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
                    ? 'Duty ON — आप काम के लिए Online हैं'
                    : 'Duty OFF — काम लेने के लिए Duty ON करें'}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                {currentUser
                  ? `${currentUser.name} · ${currentUser.phone} · बिना अलग प्रोफाइल भरे भी आप तुरंत काम Accept कर सकते हैं`
                  : 'पहले अपने नाम और 10 अंकों के मोबाइल नंबर से जुड़ें'}
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
                  ? 'अपडेट हो रहा है...'
                  : isDutyOn
                  ? 'Duty ON (Online) · बंद करें'
                  : 'Duty ON / Online करें'}
              </span>
            </button>
          </div>

          {!isDutyOn ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-3">
              <h3 className="text-base font-bold text-slate-900">
                लाइव बुकिंग देखने के लिए Duty ON करें
              </h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                जैसे ही आप Duty ON करेंगे, आपके क्षेत्र ({selectedCity.split('(')[0].trim()}) और पूरे India की नई लाइव रिक्वेस्ट यहाँ दिखेंगी।
              </p>
              <button
                type="button"
                onClick={handleToggleDuty}
                className="min-h-[46px] px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold inline-flex items-center gap-2"
              >
                <Power className="w-4 h-4" />
                <span>अभी Duty ON करें</span>
              </button>
            </div>
          ) : activeLiveRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                अभी कोई सक्रिय लाइव रिक्वेस्ट नहीं है
              </h3>
              <p className="text-sm text-slate-600">
                पिछले 6 घंटों में कोई नई लाइव रिक्वेस्ट नहीं मिली। आप "पूरे India में (All India)" फ़िल्टर या "काम खोजें" टैब भी देख सकते हैं।
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
                            {req.contractorName} · {formatRelativeTimeHindi(req.createdAt, now)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-lg font-extrabold text-emerald-700 tabular-nums">
                            ₹{req.dailyRate}
                          </div>
                          <div className="text-[11px] font-medium text-slate-500">
                            प्रति दिन
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
                            जरूरत: <strong>{req.requiredCount}</strong> मजदूर · कन्फर्म हुए:{' '}
                            <strong>
                              {req.confirmedCount} / {req.requiredCount}
                            </strong>
                          </span>
                        </div>
                        {facilitiesText && (
                          <div className="text-emerald-800 font-semibold pt-0.5">
                            सुविधाएं: {facilitiesText}
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
                            <span>काम कन्फर्म! ठेकेदार से सीधे संपर्क करें</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <a
                              href={buildTelUrl(req.contractorPhone)}
                              className="min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
                            >
                              <Phone className="w-4 h-4" />
                              <span>सीधे कॉल करें</span>
                            </a>
                            <a
                              href={buildDirectWhatsAppUrl(
                                req.contractorPhone,
                                `नमस्ते ${req.contractorName} जी, मैंने Kaam Connect पर आपकी "${req.skill}" वाली लाइव रिक्वेस्ट Accept की है।`,
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
                              1-Tap Quick Chat (ठेकेदार को तुरंत भेजें)
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
                                  className="min-h-[36px] rounded-lg border border-slate-300 bg-white hover:bg-orange-50 hover:border-orange-300 px-2.5 py-1 text-xs font-medium text-slate-800 transition-colors"
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
                                aria-label="खुद का संदेश लिखें"
                                value={customChatText[req.id] || ''}
                                onChange={(e) =>
                                  setCustomChatText((prev) => ({
                                    ...prev,
                                    [req.id]: e.target.value,
                                  }))
                                }
                                placeholder="अन्य संदेश लिखें..."
                                className="flex-1 min-h-[38px] rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-900"
                              />
                              <button
                                type="button"
                                aria-label="संदेश भेजें"
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
                              यह आपकी अपनी रिक्वेस्ट है
                            </button>
                          ) : isFull ? (
                            <button
                              type="button"
                              disabled
                              className="w-full min-h-[44px] rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold cursor-not-allowed"
                            >
                              सभी मजदूर पूरे हो चुके हैं
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
                                  ? 'कन्फर्म हो रहा है...'
                                  : 'Accept करें (काम लें)'}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDismissedIds((prev) => [...prev, req.id])
                                }
                                className="min-h-[46px] px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold"
                              >
                                छोड़ें
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
                          <span>WhatsApp पर Share करें</span>
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
                          <span>रिपोर्ट</span>
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
                  मेरी लाइव बुकिंग स्थिति
                </h3>
                <span className="text-xs font-semibold text-emerald-700 tabular-nums">
                  {onlineWorkersCount} कारीगर Online
                </span>
              </div>

              {myContractorRequests.length === 0 ? (
                <p className="text-xs text-slate-600 py-3">
                  आपने अभी कोई सक्रिय लाइव रिक्वेस्ट नहीं डाली है। बाईं ओर फॉर्म भरकर तुरंत मजदूर बुलाएं।
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
                              {formatRelativeTimeHindi(req.createdAt, now)} · ₹{req.dailyRate}/दिन
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
                          {req.status === 'open' ? 'चालू है' : 'बंद'}
                        </span>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-xl p-3">
                        <div className="text-sm font-extrabold text-slate-900 tabular-nums">
                          {req.confirmedCount} / {req.requiredCount} मजदूर कन्फर्म हुए
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
                            जुड़े हुए कारीगर:
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
                                  <span>Call</span>
                                </a>
                                <a
                                  href={buildDirectWhatsAppUrl(
                                    worker.phone,
                                    `नमस्ते ${worker.name} जी, आपकी "${req.skill}" वाली Kaam Connect बुकिंग कन्फर्म है।`,
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
                          अभी कारीगरों के Accept करने का इंतज़ार है...
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
                                className="min-h-[34px] rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-800 hover:bg-orange-50"
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
                              <span>Share करें</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCloseRequest(req.id)}
                              className="flex-1 min-h-[42px] rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white inline-flex items-center justify-center gap-1.5"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Request बंद करें</span>
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

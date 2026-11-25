import React, { useState, useEffect } from 'react';
import {
  Phone,
  MessageCircle,
  Share2,
  Flag,
  Plus,
  MapPin,
  Users,
  X,
} from 'lucide-react';
import {
  CUSTOM_SKILL_OPTION,
  INDIA_STATES,
  JOB_POST_MAX_AGE_DAYS,
  QUICK_CITIES_BY_STATE,
  SKILLS_LIST,
} from '../data/constants';
import { createJobPost } from '../firebase';
import type {
  FacilityFlags,
  JobPost,
  LocationFilterMode,
  UserAccount,
} from '../types';
import {
  buildDirectWhatsAppUrl,
  buildTelUrl,
  buildWhatsAppShareUrl,
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

interface PostJobFormProps {
  currentUser: UserAccount | null;
  selectedState: string;
  selectedCity: string;
  onSuccess: () => void;
  onCancel: () => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

interface PostJobFormState {
  contractorName: string;
  contractorPhone: string;
  selectedSkill: string;
  customSkill: string;
  workersNeeded: string;
  dailyRate: string;
  state: string;
  city: string;
  siteAddress: string;
  description: string;
  facilities: FacilityFlags;
}

const PostJobForm: React.FC<PostJobFormProps> = ({
  currentUser,
  selectedState,
  selectedCity,
  onSuccess,
  onCancel,
  onNotify,
}) => {
  const [form, setForm] = useState<PostJobFormState>({
    contractorName: currentUser?.name || '',
    contractorPhone: currentUser?.phone || '',
    selectedSkill: SKILLS_LIST[0],
    customSkill: '',
    workersNeeded: '5',
    dailyRate: '650',
    state: selectedState,
    city: selectedCity,
    siteAddress: '',
    description: '',
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

    if (!form.contractorName.trim()) {
      onNotify('Please enter contractor or company name', true);
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

    setSubmitting(true);
    try {
      await createJobPost({
        contractorName: form.contractorName.trim(),
        contractorPhone: cleanPhone,
        skill,
        workersNeeded: Math.max(1, Number(form.workersNeeded) || 1),
        dailyRate: Math.max(100, Number(form.dailyRate) || 600),
        state: form.state,
        city: form.city.trim() || selectedCity,
        siteAddress: form.siteAddress.trim(),
        description: form.description.trim(),
        facilities: form.facilities,
      });
      onNotify('Job published successfully!');
      setForm((prev) => ({
        ...prev,
        siteAddress: '',
        description: '',
        customSkill: prev.selectedSkill === CUSTOM_SKILL_OPTION ? '' : prev.customSkill,
      }));
      onSuccess();
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : 'Failed to publish job',
        true,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 space-y-4"
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900">
          Post a Regular Job
        </h3>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close job form"
          className="min-h-[40px] min-w-[40px] rounded-xl text-slate-500 hover:bg-slate-100 flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div>
          <label
            htmlFor="job-contractor-name"
            className="block text-sm font-semibold text-slate-800 mb-1"
          >
            Contractor / Company Name <span className="text-orange-600">*</span>
          </label>
          <input
            id="job-contractor-name"
            type="text"
            value={form.contractorName}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, contractorName: e.target.value }))
            }
            placeholder="e.g. Jai Ambe Construction"
            className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900"
            required
          />
        </div>

        <div>
          <label
            htmlFor="job-contractor-phone"
            className="block text-sm font-semibold text-slate-800 mb-1"
          >
            10-Digit Mobile Number <span className="text-orange-600">*</span>
          </label>
          <input
            id="job-contractor-phone"
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
            className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-mono tabular-nums text-slate-900"
            required
          />
        </div>
      </div>

      <SkillSelectField
        id="job-skill-select"
        label="Skill / Trade Required"
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div>
          <label
            htmlFor="job-workers-needed"
            className="block text-sm font-semibold text-slate-800 mb-1"
          >
            Workers Needed
          </label>
          <input
            id="job-workers-needed"
            type="number"
            min={1}
            value={form.workersNeeded}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, workersNeeded: e.target.value }))
            }
            className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm tabular-nums text-slate-900"
            required
          />
        </div>

        <div>
          <label
            htmlFor="job-daily-rate"
            className="block text-sm font-semibold text-slate-800 mb-1"
          >
            Daily Wage (₹/day)
          </label>
          <input
            id="job-daily-rate"
            type="number"
            min={100}
            value={form.dailyRate}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, dailyRate: e.target.value }))
            }
            className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm tabular-nums text-slate-900"
            required
          />
        </div>

        <div>
          <label
            htmlFor="job-state-select"
            className="block text-sm font-semibold text-slate-800 mb-1"
          >
            State
          </label>
          <select
            id="job-state-select"
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
            htmlFor="job-city-input"
            className="block text-sm font-semibold text-slate-800 mb-1"
          >
            City / Site Area
          </label>
          <input
            id="job-city-input"
            type="text"
            list="job-city-suggestions"
            value={form.city}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, city: e.target.value }))
            }
            className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900"
            required
          />
          <datalist id="job-city-suggestions">
            {(QUICK_CITIES_BY_STATE[form.state] || []).map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </div>

      <div>
        <label
          htmlFor="job-site-address"
          className="block text-sm font-semibold text-slate-800 mb-1"
        >
          Site Address (Optional)
        </label>
        <input
          id="job-site-address"
          type="text"
          value={form.siteAddress}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, siteAddress: e.target.value }))
          }
          placeholder="e.g. Industrial Estate Phase 2"
          className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900"
        />
      </div>

      <div>
        <label
          htmlFor="job-description"
          className="block text-sm font-semibold text-slate-800 mb-1"
        >
          Job Details (Optional)
        </label>
        <textarea
          id="job-description"
          rows={2}
          value={form.description}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="e.g. 3-month plant shutdown project, overtime paid extra"
          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900"
        />
      </div>

      <FacilityCheckboxes
        facilities={form.facilities}
        onToggle={handleToggleFacility}
      />

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 min-h-[46px] rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 min-h-[46px] rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-sm font-bold text-white"
        >
          {submitting ? 'Publishing...' : 'Publish Job'}
        </button>
      </div>
    </form>
  );
};

interface JobBoardTabProps {
  currentUser: UserAccount | null;
  jobs: JobPost[];
  selectedState: string;
  selectedCity: string;
  onReport: (target: ReportTarget) => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

export const JobBoardTab: React.FC<JobBoardTabProps> = ({
  currentUser,
  jobs,
  selectedState,
  selectedCity,
  onReport,
  onNotify,
}) => {
  const [showPostForm, setShowPostForm] = useState(false);
  const [locationFilter, setLocationFilter] = useState<LocationFilterMode>('city');
  const [skillFilter, setSkillFilter] = useState<string>('ALL');
  const [customSkillFilter, setCustomSkillFilter] = useState<string>('');

  const now = Date.now();
  const resolvedFilterSkill =
    skillFilter === 'ALL' ? '' : resolveSkill(skillFilter, customSkillFilter).toLowerCase();

  const visibleJobs = jobs.filter((job) => {
    if (job.status !== 'open') return false;
    if (!isWithinHours(job.createdAt, JOB_POST_MAX_AGE_DAYS * 24, now)) return false;
    if (
      !matchesLocationFilter(
        job.state,
        job.city,
        selectedState,
        selectedCity,
        locationFilter,
      )
    ) {
      return false;
    }
    if (resolvedFilterSkill) {
      const target = job.skill.toLowerCase();
      if (!target.includes(resolvedFilterSkill)) return false;
    }
    return true;
  });

  const handleShareJob = (job: JobPost) => {
    const facilities = formatFacilitiesText(job.facilities);
    const appLink = getAppShareLink();
    const text = `Job Opening on Kaam Connect:\nTrade / Skill: ${job.skill}\nDaily Wage: ₹${job.dailyRate}/day\nWorkers Needed: ${job.workersNeeded}\nLocation: ${job.city}, ${job.state}${
      job.siteAddress ? ` (${job.siteAddress})` : ''
    }${facilities ? `\nFacilities: ${facilities}` : ''}\nContact: ${job.contractorName} (+91 ${job.contractorPhone})\nDirect Contact — No Middleman: ${appLink}`;
    window.open(buildWhatsAppShareUrl(text), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 md:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start">
            <button
              type="button"
              onClick={() => setLocationFilter('city')}
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
              onClick={() => setLocationFilter('all_india')}
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
            onClick={() => setShowPostForm((prev) => !prev)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{showPostForm ? 'Close Form' : 'Post a Regular Job'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
          <SkillSelectField
            id="jobs-filter-skill"
            label="Filter by Skill / Trade"
            selectedSkill={skillFilter}
            customSkill={customSkillFilter}
            onSelectSkill={setSkillFilter}
            onCustomSkillChange={setCustomSkillFilter}
            includeAllOption
          />
          <p className="text-xs text-slate-500 pb-2">
            Showing active jobs from the last 7 days ({visibleJobs.length} listings)
          </p>
        </div>
      </div>

      {showPostForm && (
        <PostJobForm
          currentUser={currentUser}
          selectedState={selectedState}
          selectedCity={selectedCity}
          onSuccess={() => setShowPostForm(false)}
          onCancel={() => setShowPostForm(false)}
          onNotify={onNotify}
        />
      )}

      {visibleJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <h3 className="text-base font-bold text-slate-900">
            No Job Posts Found for This Filter
          </h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            {locationFilter === 'city'
              ? 'Switch to "All India" to browse jobs across the country, or post a new job above.'
              : 'No recent job openings are listed yet. Contractors can publish a job above.'}
          </p>
          {locationFilter === 'city' && (
            <button
              type="button"
              onClick={() => setLocationFilter('all_india')}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800"
            >
              View All India Jobs
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visibleJobs.map((job) => {
            const facilitiesText = formatFacilitiesText(job.facilities);
            return (
              <article
                key={job.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {job.skill}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">
                        {job.contractorName} · {formatRelativeTime(job.createdAt, now)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-extrabold text-emerald-700 tabular-nums">
                        ₹{job.dailyRate}
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
                        {job.city}, {job.state}
                        {job.siteAddress ? ` · ${job.siteAddress}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 tabular-nums">
                      <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>
                        Workers Needed: <strong>{job.workersNeeded}</strong>
                      </span>
                    </div>
                    {job.description && (
                      <p className="text-xs text-slate-600 pt-0.5">{job.description}</p>
                    )}
                    {facilitiesText && (
                      <div className="text-emerald-800 font-semibold pt-0.5">
                        Facilities: {facilitiesText}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={buildTelUrl(job.contractorPhone)}
                      className="min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Call Now</span>
                    </a>
                    <a
                      href={buildDirectWhatsAppUrl(
                        job.contractorPhone,
                        `Hello ${job.contractorName}, I saw your "${job.skill}" job post on Kaam Connect.`,
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
                      onClick={() => handleShareJob(job)}
                      className="min-h-[38px] px-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 inline-flex items-center gap-1.5"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share on WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onReport({
                          targetType: 'job',
                          targetId: job.id,
                          targetName: `${job.contractorName} (${job.skill})`,
                          targetPhone: job.contractorPhone,
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
  );
};

import React, { useState, useEffect } from 'react';
import { Save, Users, User, Plane, CheckCircle2 } from 'lucide-react';
import {
  CUSTOM_SKILL_OPTION,
  INDIA_STATES,
  QUICK_CITIES_BY_STATE,
  SKILLS_LIST,
} from '../data/constants';
import { saveWorkerProfile } from '../firebase';
import type { UserAccount, WorkerProfile, WorkerType } from '../types';
import {
  isValidIndianMobile,
  normalizePhone,
  resolveSkill,
} from '../utils/matching';
import { SkillSelectField } from './SkillSelectField';

interface WorkerProfileFormProps {
  currentUser: UserAccount | null;
  existingProfile: WorkerProfile | null;
  selectedState: string;
  selectedCity: string;
  startBlank?: boolean;
  onSaved: (savedUser: { name: string; phone: string; state: string; city: string }) => void;
  onCancel?: () => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

interface WorkerFormState {
  name: string;
  phone: string;
  selectedSkill: string;
  customSkill: string;
  workerType: WorkerType;
  teamSize: string;
  outstationReady: boolean;
  dailyRate: string;
  experienceYears: string;
  state: string;
  city: string;
  isAvailable: boolean;
}

function getInitialSkillState(skill?: string): { selected: string; custom: string } {
  if (!skill) return { selected: SKILLS_LIST[0], custom: '' };
  if (SKILLS_LIST.includes(skill) && skill !== CUSTOM_SKILL_OPTION) {
    return { selected: skill, custom: '' };
  }
  return { selected: CUSTOM_SKILL_OPTION, custom: skill };
}

export const WorkerProfileForm: React.FC<WorkerProfileFormProps> = ({
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
  const initialSkill = getInitialSkillState(initialProfile?.skill);

  const [form, setForm] = useState<WorkerFormState>({
    name: initialProfile?.name || (startBlank ? '' : currentUser?.name || ''),
    phone: initialProfile?.phone || (startBlank ? '' : currentUser?.phone || ''),
    selectedSkill: initialSkill.selected,
    customSkill: initialSkill.custom,
    workerType: initialProfile?.workerType || 'individual',
    teamSize: String(initialProfile?.teamSize || 5),
    outstationReady: Boolean(initialProfile?.outstationReady),
    dailyRate: String(initialProfile?.dailyRate || 650),
    experienceYears: String(initialProfile?.experienceYears || 2),
    state: initialProfile?.state || selectedState,
    city: initialProfile?.city || selectedCity,
    isAvailable: initialProfile?.isAvailable ?? initialProfile?.isOnline ?? true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!startBlank && existingProfile) {
      const sk = getInitialSkillState(existingProfile.skill);
      setForm({
        name: existingProfile.name,
        phone: existingProfile.phone,
        selectedSkill: sk.selected,
        customSkill: sk.custom,
        workerType: existingProfile.workerType,
        teamSize: String(existingProfile.teamSize || 5),
        outstationReady: existingProfile.outstationReady,
        dailyRate: String(existingProfile.dailyRate || 650),
        experienceYears: String(existingProfile.experienceYears || 0),
        state: existingProfile.state,
        city: existingProfile.city,
        isAvailable: existingProfile.isAvailable ?? existingProfile.isOnline ?? true,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = normalizePhone(form.phone);
    const finalSkill = resolveSkill(form.selectedSkill, form.customSkill);

    if (!form.name.trim()) {
      onNotify('Please enter worker full name', true);
      return;
    }
    if (!isValidIndianMobile(cleanPhone)) {
      onNotify('Please enter a valid 10-digit Indian mobile number', true);
      return;
    }
    if (!finalSkill) {
      onNotify('Please select or enter a skill / trade', true);
      return;
    }

    setSubmitting(true);
    try {
      const isEditingSelf =
        !startBlank &&
        existingProfile &&
        normalizePhone(existingProfile.phone) === cleanPhone;

      await saveWorkerProfile({
        name: form.name.trim(),
        phone: cleanPhone,
        skill: finalSkill,
        workerType: form.workerType,
        teamSize:
          form.workerType === 'team_leader'
            ? Math.max(2, Number(form.teamSize) || 5)
            : 1,
        outstationReady: form.outstationReady,
        dailyRate: Math.max(100, Number(form.dailyRate) || 600),
        state: form.state,
        city: form.city.trim() || selectedCity,
        experienceYears: Math.max(0, Number(form.experienceYears) || 0),
        isOnline: form.isAvailable,
        isAvailable: form.isAvailable,
        createdAt: isEditingSelf ? existingProfile.createdAt : undefined,
      });

      onNotify('Worker profile saved to directory!');
      onSaved({
        name: form.name.trim(),
        phone: cleanPhone,
        state: form.state,
        city: form.city.trim() || selectedCity,
      });
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : 'Failed to save worker profile',
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
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            {!startBlank && existingProfile
              ? 'Update Worker Profile'
              : 'Register Worker Profile'}
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Register yourself or any worker on the spot with Name &amp; 10-digit Mobile Number
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div>
          <label
            htmlFor="worker-name"
            className="block text-sm font-semibold text-slate-800 mb-1"
          >
            Full Name <span className="text-orange-600">*</span>
          </label>
          <input
            id="worker-name"
            type="text"
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="e.g. Santosh Paswan"
            className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900"
            required
          />
        </div>

        <div>
          <label
            htmlFor="worker-phone"
            className="block text-sm font-semibold text-slate-800 mb-1"
          >
            10-Digit Mobile Number <span className="text-orange-600">*</span>
          </label>
          <input
            id="worker-phone"
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

      <SkillSelectField
        id="worker-skill-select"
        label="Primary Skill / Trade"
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

      {/* Individual vs Team Leader */}
      <div className="space-y-2">
        <span className="block text-sm font-semibold text-slate-800">
          Registration Type
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() =>
              setForm((prev) => ({ ...prev, workerType: 'individual' }))
            }
            className={`min-h-[48px] rounded-xl border px-3.5 py-2 text-xs font-bold flex items-center gap-2 transition-colors ${
              form.workerType === 'individual'
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            <span>Individual Worker</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setForm((prev) => ({ ...prev, workerType: 'team_leader' }))
            }
            className={`min-h-[48px] rounded-xl border px-3.5 py-2 text-xs font-bold flex items-center gap-2 transition-colors ${
              form.workerType === 'team_leader'
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Team Leader (With Squad)</span>
          </button>
        </div>

        {form.workerType === 'team_leader' && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <label
              htmlFor="worker-team-size"
              className="block text-xs font-bold text-slate-800"
            >
              Team Size (Number of Workers in Squad)
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {[5, 10, 20].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, teamSize: String(size) }))
                  }
                  className={`min-h-[38px] rounded-lg border px-3 py-1 text-xs font-bold tabular-nums ${
                    Number(form.teamSize) === size
                      ? 'border-orange-600 bg-orange-600 text-white'
                      : 'border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  {size} Workers
                </button>
              ))}
              <input
                id="worker-team-size"
                type="number"
                min={2}
                max={200}
                value={form.teamSize}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, teamSize: e.target.value }))
                }
                className="w-24 min-h-[38px] rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-bold tabular-nums text-slate-900"
              />
            </div>
          </div>
        )}
      </div>

      {/* Availability Status Toggle + Outstation Toggle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          type="button"
          aria-pressed={form.isAvailable}
          onClick={() =>
            setForm((prev) => ({
              ...prev,
              isAvailable: !prev.isAvailable,
            }))
          }
          className={`w-full min-h-[48px] rounded-xl border px-3.5 py-2.5 text-left flex items-center justify-between gap-2 transition-colors ${
            form.isAvailable
              ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
              : 'border-rose-300 bg-rose-50 text-rose-900'
          }`}
        >
          <span className="flex items-center gap-2 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              {form.isAvailable
                ? 'Available for Work'
                : 'Currently Working / Busy'}
            </span>
          </span>
          <span
            className={`px-2 py-0.5 rounded-md text-[11px] font-bold shrink-0 ${
              form.isAvailable
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            {form.isAvailable ? 'Available' : 'Busy'}
          </span>
        </button>

        <button
          type="button"
          aria-pressed={form.outstationReady}
          onClick={() =>
            setForm((prev) => ({
              ...prev,
              outstationReady: !prev.outstationReady,
            }))
          }
          className={`w-full min-h-[48px] rounded-xl border px-3.5 py-2.5 text-left flex items-center justify-between gap-2 transition-colors ${
            form.outstationReady
              ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
              : 'border-slate-300 bg-white text-slate-700'
          }`}
        >
          <span className="flex items-center gap-2 text-xs font-bold">
            <Plane className="w-4 h-4 shrink-0" />
            <span>Ready to work in other cities/states</span>
          </span>
          <span
            className={`px-2 py-0.5 rounded-md text-[11px] font-bold shrink-0 ${
              form.outstationReady
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {form.outstationReady ? 'Yes' : 'No'}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div>
          <label
            htmlFor="worker-daily-rate"
            className="block text-sm font-semibold text-slate-800 mb-1"
          >
            Expected Daily Rate (₹/day)
          </label>
          <input
            id="worker-daily-rate"
            type="number"
            min={100}
            value={form.dailyRate}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, dailyRate: e.target.value }))
            }
            className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm tabular-nums text-slate-900"
          />
        </div>

        <div>
          <label
            htmlFor="worker-experience"
            className="block text-sm font-semibold text-slate-800 mb-1"
          >
            Experience (Years)
          </label>
          <input
            id="worker-experience"
            type="number"
            min={0}
            max={50}
            value={form.experienceYears}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, experienceYears: e.target.value }))
            }
            className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm tabular-nums text-slate-900"
          />
        </div>

        <div>
          <label
            htmlFor="worker-state"
            className="block text-sm font-semibold text-slate-800 mb-1"
          >
            State
          </label>
          <select
            id="worker-state"
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
            htmlFor="worker-city"
            className="block text-sm font-semibold text-slate-800 mb-1"
          >
            City / Site Area
          </label>
          <input
            id="worker-city"
            type="text"
            list="worker-city-suggestions"
            value={form.city}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, city: e.target.value }))
            }
            className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900"
            required
          />
          <datalist id="worker-city-suggestions">
            {(QUICK_CITIES_BY_STATE[form.state] || []).map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </div>

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
          className="flex-1 min-h-[46px] rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-sm font-bold text-white inline-flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{submitting ? 'Saving...' : 'Save Worker Profile'}</span>
        </button>
      </div>
    </form>
  );
};

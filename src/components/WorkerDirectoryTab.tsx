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
} from 'lucide-react';
import type { LocationFilterMode, UserAccount, WorkerProfile } from '../types';
import {
  buildDirectWhatsAppUrl,
  buildTelUrl,
  buildWhatsAppShareUrl,
  getAppShareLink,
  matchesLocationFilter,
  resolveSkill,
} from '../utils/matching';
import { SkillSelectField } from './SkillSelectField';
import { WorkerProfileForm } from './WorkerProfileForm';
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
  const [skillFilter, setSkillFilter] = useState<string>('ALL');
  const [customSkillFilter, setCustomSkillFilter] = useState<string>('');
  const [onlyOutstation, setOnlyOutstation] = useState(false);

  const resolvedSkill =
    skillFilter === 'ALL' ? '' : resolveSkill(skillFilter, customSkillFilter).toLowerCase();

  const filteredWorkers = workers.filter((w) => {
    if (
      !matchesLocationFilter(
        w.state,
        w.city,
        selectedState,
        selectedCity,
        locationFilter,
      )
    ) {
      return false;
    }
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
    const text = `Skilled Worker on Kaam Connect:\nName: ${worker.name}\nSkill / Trade: ${worker.skill}\nType: ${teamText}\nDaily Wage: ₹${worker.dailyRate}/day\nLocation: ${worker.city}, ${worker.state}${
      worker.outstationReady ? '\nReady to work in other cities / states' : ''
    }\nCall Directly: +91 ${worker.phone}\nLink: ${appLink}`;
    window.open(buildWhatsAppShareUrl(text), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4">
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
            onClick={() => setShowRegisterForm((prev) => !prev)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>
              {showRegisterForm
                ? 'Close Form'
                : myWorkerProfile
                ? 'Update Worker Profile'
                : 'Register as Worker'}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
          <SkillSelectField
            id="workers-filter-skill"
            label="Filter Workers by Skill / Trade"
            selectedSkill={skillFilter}
            customSkill={customSkillFilter}
            onSelectSkill={setSkillFilter}
            onCustomSkillChange={setCustomSkillFilter}
            includeAllOption
          />

          <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
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
            <span className="text-xs text-slate-500 tabular-nums">
              {filteredWorkers.length} Workers Found
            </span>
          </div>
        </div>
      </div>

      {showRegisterForm && (
        <WorkerProfileForm
          currentUser={currentUser}
          existingProfile={myWorkerProfile}
          selectedState={selectedState}
          selectedCity={selectedCity}
          onSaved={(saved) => {
            onUserSynced(saved);
            setShowRegisterForm(false);
          }}
          onCancel={() => setShowRegisterForm(false)}
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
              ? 'Switch to "All India" to find skilled workers across the country, or register your own profile above.'
              : 'No registered workers found yet. Tap the button above to create the first worker profile.'}
          </p>
          {locationFilter === 'city' && (
            <button
              type="button"
              onClick={() => setLocationFilter('all_india')}
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
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900">
                        {worker.name}
                      </h3>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          worker.isOnline
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {worker.isOnline ? 'Duty ON' : 'Duty OFF'}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-orange-700 mt-0.5">
                      {worker.skill}
                    </p>
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
                      {worker.city}, {worker.state} · Experience: {worker.experienceYears} yrs
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
                  {worker.outstationReady && (
                    <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                      <Plane className="w-3.5 h-3.5 shrink-0" />
                      <span>Ready to work in other cities / states</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={buildTelUrl(worker.phone)}
                    className="min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
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
                    className="min-h-[44px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
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

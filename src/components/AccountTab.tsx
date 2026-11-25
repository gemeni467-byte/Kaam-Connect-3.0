import React, { useState } from 'react';
import {
  Phone,
  LogOut,
  CheckCircle2,
  XCircle,
  UserCheck,
  Briefcase,
  Radio,
  Share2,
  UserPlus,
  Clock,
} from 'lucide-react';
import {
  closeJobPost,
  closeLiveRequest,
  setContractorHiringStatus,
  setWorkerAvailabilityStatus,
} from '../firebase';
import type {
  ContractorProfile,
  JobPost,
  LiveRequest,
  UserAccount,
  WorkerProfile,
} from '../types';
import {
  formatFacilitiesText,
  formatRelativeTime,
  isValidIndianMobile,
  normalizePhone,
} from '../utils/matching';
import { WorkerProfileForm } from './WorkerProfileForm';
import { ContractorProfileForm } from './ContractorProfileForm';
import { RegisterProfilePanel } from './RegisterProfilePanel';

interface MobileLoginFormProps {
  selectedState: string;
  selectedCity: string;
  onLogin: (account: UserAccount) => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

const MobileLoginForm: React.FC<MobileLoginFormProps> = ({
  selectedState,
  selectedCity,
  onLogin,
  onNotify,
}) => {
  const [form, setForm] = useState({
    name: '',
    phone: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = normalizePhone(form.phone);
    if (!form.name.trim()) {
      onNotify('Please enter your full name', true);
      return;
    }
    if (!isValidIndianMobile(cleanPhone)) {
      onNotify('Please enter a valid 10-digit Indian mobile number (starting with 6-9)', true);
      return;
    }
    onLogin({
      name: form.name.trim(),
      phone: cleanPhone,
      state: selectedState,
      city: selectedCity,
      loggedInAt: Date.now(),
    });
    onNotify('Mobile number connected successfully!');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 max-w-lg mx-auto space-y-4"
    >
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-slate-900">
          Join / Login with Mobile Number
        </h2>
        <p className="text-xs text-slate-600">
          No password or email required. Your worker profile, contractor profile, and live bookings sync automatically with your mobile number.
        </p>
      </div>

      <div>
        <label
          htmlFor="login-name-input"
          className="block text-sm font-semibold text-slate-800 mb-1"
        >
          Full Name <span className="text-orange-600">*</span>
        </label>
        <input
          id="login-name-input"
          type="text"
          value={form.name}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="Enter your full name"
          className="w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
          required
        />
      </div>

      <div>
        <label
          htmlFor="login-phone-input"
          className="block text-sm font-semibold text-slate-800 mb-1"
        >
          10-Digit Mobile Number <span className="text-orange-600">*</span>
        </label>
        <div className="flex items-center">
          <span className="min-h-[48px] px-3.5 rounded-l-xl border border-r-0 border-slate-300 bg-slate-100 text-sm font-bold text-slate-700 flex items-center">
            +91
          </span>
          <input
            id="login-phone-input"
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
            className="flex-1 min-h-[48px] rounded-r-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-mono tabular-nums text-slate-900 focus:border-orange-500 focus:outline-none"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full min-h-[48px] rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm inline-flex items-center justify-center gap-2"
      >
        <Phone className="w-4 h-4" />
        <span>Save &amp; Continue</span>
      </button>
    </form>
  );
};

interface AccountTabProps {
  currentUser: UserAccount | null;
  myWorkerProfile: WorkerProfile | null;
  myContractorProfile: ContractorProfile | null;
  liveRequests: LiveRequest[];
  jobs: JobPost[];
  selectedState: string;
  selectedCity: string;
  onLogin: (account: UserAccount) => void;
  onLogout: () => void;
  onUserSynced: (saved: { name: string; phone: string; state: string; city: string }) => void;
  onNotify: (msg: string, isError?: boolean) => void;
  onShareApp: () => void;
}

export const AccountTab: React.FC<AccountTabProps> = ({
  currentUser,
  myWorkerProfile,
  myContractorProfile,
  liveRequests,
  jobs,
  selectedState,
  selectedCity,
  onLogin,
  onLogout,
  onUserSynced,
  onNotify,
  onShareApp,
}) => {
  const [editorMode, setEditorMode] = useState<'none' | 'worker' | 'contractor' | 'register'>('none');
  const [togglingWorker, setTogglingWorker] = useState(false);
  const [togglingContractor, setTogglingContractor] = useState(false);

  const handleToggleWorkerAvailability = async () => {
    if (!myWorkerProfile) return;
    setTogglingWorker(true);
    try {
      const next = !myWorkerProfile.isAvailable;
      await setWorkerAvailabilityStatus(myWorkerProfile, next);
      onNotify(
        next
          ? 'Worker status set to Available for Work.'
          : 'Worker status set to Currently Working / Busy.',
      );
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : 'Failed to update availability',
        true,
      );
    } finally {
      setTogglingWorker(false);
    }
  };

  const handleToggleContractorHiring = async () => {
    if (!myContractorProfile) return;
    setTogglingContractor(true);
    try {
      const next = !myContractorProfile.isHiring;
      await setContractorHiringStatus(myContractorProfile, next);
      onNotify(
        next
          ? 'Contractor Hiring ON — Call buttons visible.'
          : 'Contractor Hiring OFF — Phone number hidden.',
      );
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : 'Failed to update hiring status',
        true,
      );
    } finally {
      setTogglingContractor(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="py-2 space-y-4">
        <MobileLoginForm
          selectedState={selectedState}
          selectedCity={selectedCity}
          onLogin={onLogin}
          onNotify={onNotify}
        />

        <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 max-w-lg mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Register a Worker or Contractor
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Create a public directory profile right away
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setEditorMode((prev) => (prev === 'register' ? 'none' : 'register'))
            }
            className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>{editorMode === 'register' ? 'Close Form' : '+ Register Profile'}</span>
          </button>
        </div>

        {editorMode === 'register' && (
          <div className="max-w-3xl mx-auto">
            <RegisterProfilePanel
              defaultRole="worker"
              currentUser={null}
              selectedState={selectedState}
              selectedCity={selectedCity}
              onSaved={onUserSynced}
              onClose={() => setEditorMode('none')}
              onNotify={onNotify}
            />
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 max-w-lg mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Invite Workers &amp; Contractors
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Share Kaam Connect directly via WhatsApp or system share
            </p>
          </div>
          <button
            type="button"
            onClick={onShareApp}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Share2 className="w-4 h-4" />
            <span>Share App</span>
          </button>
        </div>
      </div>
    );
  }

  const cleanUserPhone = normalizePhone(currentUser.phone);

  const myPostedLiveRequests = liveRequests.filter(
    (r) => normalizePhone(r.contractorPhone) === cleanUserPhone,
  );
  const myAcceptedLiveRequests = liveRequests.filter((r) =>
    (r.acceptedPhones || []).includes(cleanUserPhone),
  );
  const myJobPosts = jobs.filter(
    (j) => normalizePhone(j.contractorPhone) === cleanUserPhone,
  );

  return (
    <div className="space-y-5">
      {/* User Summary Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">
              {currentUser.name}
            </h2>
          </div>
          <p className="text-sm font-mono tabular-nums text-slate-600">
            +91 {currentUser.phone} · {selectedCity}, {selectedState}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onShareApp}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Share2 className="w-4 h-4" />
            <span>Share App</span>
          </button>
          <button
            type="button"
            onClick={() =>
              setEditorMode((prev) => (prev === 'register' ? 'none' : 'register'))
            }
            className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>{editorMode === 'register' ? 'Close Form' : '+ Register Profile'}</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {editorMode === 'register' && (
        <RegisterProfilePanel
          defaultRole="worker"
          currentUser={currentUser}
          selectedState={selectedState}
          selectedCity={selectedCity}
          onSaved={onUserSynced}
          onClose={() => setEditorMode('none')}
          onNotify={onNotify}
        />
      )}

      {editorMode === 'worker' && (
        <WorkerProfileForm
          currentUser={currentUser}
          existingProfile={myWorkerProfile}
          selectedState={selectedState}
          selectedCity={selectedCity}
          onSaved={(saved) => {
            onUserSynced(saved);
            setEditorMode('none');
          }}
          onCancel={() => setEditorMode('none')}
          onNotify={onNotify}
        />
      )}

      {editorMode === 'contractor' && (
        <ContractorProfileForm
          currentUser={currentUser}
          existingProfile={myContractorProfile}
          selectedState={selectedState}
          selectedCity={selectedCity}
          onSaved={(saved) => {
            onUserSynced(saved);
            setEditorMode('none');
          }}
          onCancel={() => setEditorMode('none')}
          onNotify={onNotify}
        />
      )}

      {/* Synced Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* My Worker Profile + 1-Tap Availability Toggle */}
        <section className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-slate-900">
              My Worker Profile
            </h3>
            <button
              type="button"
              onClick={() =>
                setEditorMode((prev) => (prev === 'worker' ? 'none' : 'worker'))
              }
              className="min-h-[36px] px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800"
            >
              {myWorkerProfile ? 'Edit Profile' : 'Create Profile'}
            </button>
          </div>

          {myWorkerProfile ? (
            <div className="space-y-3">
              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-orange-700">
                    {myWorkerProfile.skill}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      myWorkerProfile.isAvailable
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : 'bg-rose-100 text-rose-800 border-rose-200'
                    }`}
                  >
                    {myWorkerProfile.isAvailable ? 'Available for Work' : 'Busy / On Site'}
                  </span>
                </div>
                <div>
                  Type:{' '}
                  <strong>
                    {myWorkerProfile.workerType === 'team_leader'
                      ? `Team Leader (${myWorkerProfile.teamSize} Workers)`
                      : 'Individual Worker'}
                  </strong>
                </div>
                <div>
                  Expected Rate:{' '}
                  <strong className="tabular-nums">₹{myWorkerProfile.dailyRate}/day</strong> ·{' '}
                  {myWorkerProfile.city}, {myWorkerProfile.state}
                </div>
                <div>
                  Outstation Ready:{' '}
                  <strong>{myWorkerProfile.outstationReady ? 'Yes' : 'No'}</strong>
                </div>
              </div>

              <button
                type="button"
                disabled={togglingWorker}
                onClick={handleToggleWorkerAvailability}
                className={`w-full min-h-[44px] rounded-xl text-xs font-bold text-white inline-flex items-center justify-center gap-1.5 transition-colors ${
                  myWorkerProfile.isAvailable
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {myWorkerProfile.isAvailable ? (
                  <>
                    <Clock className="w-4 h-4" />
                    <span>
                      {togglingWorker
                        ? 'Updating...'
                        : 'Available for Work (Tap to set Busy)'}
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {togglingWorker
                        ? 'Updating...'
                        : 'Busy / On Site (Tap to set Available)'}
                    </span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-600">
              You haven&apos;t created a worker directory profile yet. Tap &quot;Create Profile&quot; to list your skill and availability.
            </p>
          )}
        </section>

        {/* My Contractor Profile + 1-Tap Hiring ON/OFF Toggle */}
        <section className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-slate-900">
              My Contractor Profile
            </h3>
            <button
              type="button"
              onClick={() =>
                setEditorMode((prev) =>
                  prev === 'contractor' ? 'none' : 'contractor',
                )
              }
              className="min-h-[36px] px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800"
            >
              {myContractorProfile ? 'Edit Profile' : 'Create Profile'}
            </button>
          </div>

          {myContractorProfile ? (
            <div className="space-y-3">
              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-900">
                    {myContractorProfile.companyName || myContractorProfile.name}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      myContractorProfile.isHiring
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-300'
                    }`}
                  >
                    {myContractorProfile.isHiring ? 'Hiring ON' : 'Hiring OFF'}
                  </span>
                </div>
                <div>
                  Trades Hired:{' '}
                  <strong>{myContractorProfile.tradesHired.join(', ')}</strong>
                </div>
                <div>
                  Location: {myContractorProfile.city}, {myContractorProfile.state}
                </div>
                {formatFacilitiesText(myContractorProfile.facilities) && (
                  <div className="text-emerald-800 font-semibold">
                    Facilities: {formatFacilitiesText(myContractorProfile.facilities)}
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={togglingContractor}
                onClick={handleToggleContractorHiring}
                className={`w-full min-h-[44px] rounded-xl text-xs font-bold text-white inline-flex items-center justify-center gap-1.5 transition-colors ${
                  myContractorProfile.isHiring
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-slate-700 hover:bg-slate-800'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>
                  {togglingContractor
                    ? 'Updating...'
                    : myContractorProfile.isHiring
                    ? 'Hiring ON (Tap to hide phone & turn OFF)'
                    : 'Hiring OFF (Tap to turn Hiring ON)'}
                </span>
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-600">
              Contractors can list the trades they hire, site facilities, and turn Hiring ON/OFF anytime to avoid unwanted calls.
            </p>
          )}
        </section>

        {/* Accepted Live Jobs */}
        <section className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">
              Accepted Live Jobs ({myAcceptedLiveRequests.length})
            </h3>
          </div>
          {myAcceptedLiveRequests.length === 0 ? (
            <p className="text-xs text-slate-600">
              You have not accepted any live jobs yet.
            </p>
          ) : (
            <div className="space-y-2">
              {myAcceptedLiveRequests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">{req.skill}</div>
                    <div className="text-slate-600">
                      {req.contractorName} · ₹{req.dailyRate}/day · {req.city}
                    </div>
                  </div>
                  <a
                    href={`tel:+91${req.contractorPhone}`}
                    className="min-h-[38px] px-3 rounded-lg bg-emerald-600 text-white font-bold inline-flex items-center gap-1 shrink-0"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Now</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* My Posted Live Bookings & Regular Jobs */}
        <section className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-orange-600" />
            <h3 className="text-base font-bold text-slate-900">
              My Live Requests ({myPostedLiveRequests.length})
            </h3>
          </div>
          {myPostedLiveRequests.length === 0 && myJobPosts.length === 0 ? (
            <p className="text-xs text-slate-600">
              No live requests posted with this number yet.
            </p>
          ) : (
            <div className="space-y-2">
              {myPostedLiveRequests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      {req.skill} ({req.confirmedCount}/{req.requiredCount})
                    </div>
                    <div className="text-slate-600">
                      {req.city} · {formatRelativeTime(req.createdAt)} ·{' '}
                      {req.status === 'open' ? 'Open' : 'Closed'}
                    </div>
                  </div>
                  {req.status === 'open' && (
                    <button
                      type="button"
                      onClick={() => closeLiveRequest(req.id)}
                      className="min-h-[38px] px-3 rounded-lg bg-rose-600 text-white font-bold inline-flex items-center gap-1 shrink-0"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Close Request</span>
                    </button>
                  )}
                </div>
              ))}

              {myJobPosts.map((job) => (
                <div
                  key={job.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      {job.skill} ({job.workersNeeded} Workers)
                    </div>
                    <div className="text-slate-600">
                      ₹{job.dailyRate}/day · {job.city} ·{' '}
                      {job.status === 'open' ? 'Open' : 'Closed'}
                    </div>
                  </div>
                  {job.status === 'open' && (
                    <button
                      type="button"
                      onClick={() => closeJobPost(job.id)}
                      className="min-h-[38px] px-3 rounded-lg bg-rose-600 text-white font-bold inline-flex items-center gap-1 shrink-0"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Close</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

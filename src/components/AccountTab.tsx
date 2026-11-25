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
} from 'lucide-react';
import { closeJobPost, closeLiveRequest } from '../firebase';
import type {
  JobPost,
  LiveRequest,
  UserAccount,
  WorkerProfile,
} from '../types';
import {
  formatRelativeTime,
  isValidIndianMobile,
  normalizePhone,
} from '../utils/matching';
import { WorkerProfileForm } from './WorkerProfileForm';

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
          No password or email required. Your worker profile, job posts, and live bookings sync automatically with your mobile number.
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
  const [showWorkerEditor, setShowWorkerEditor] = useState(false);

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
            onClick={() => setShowWorkerEditor((prev) => !prev)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
          >
            {showWorkerEditor
              ? 'Close Editor'
              : myWorkerProfile
              ? 'Edit Worker Profile'
              : 'Create Worker Profile'}
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

      {showWorkerEditor && (
        <WorkerProfileForm
          currentUser={currentUser}
          existingProfile={myWorkerProfile}
          selectedState={selectedState}
          selectedCity={selectedCity}
          onSaved={(saved) => {
            onUserSynced(saved);
            setShowWorkerEditor(false);
          }}
          onCancel={() => setShowWorkerEditor(false)}
          onNotify={onNotify}
        />
      )}

      {/* Synced Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Worker Profile Status */}
        <section className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 space-y-3">
          <h3 className="text-base font-bold text-slate-900">
            My Worker Profile (Synced with Firestore)
          </h3>
          {myWorkerProfile ? (
            <div className="space-y-1.5 text-xs text-slate-700">
              <div className="text-sm font-bold text-orange-700">
                {myWorkerProfile.skill}
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
                Wage: <strong className="tabular-nums">₹{myWorkerProfile.dailyRate}/day</strong> ·{' '}
                Location: {myWorkerProfile.city}, {myWorkerProfile.state}
              </div>
              <div>
                Outstation Ready:{' '}
                <strong>{myWorkerProfile.outstationReady ? 'Yes' : 'No'}</strong>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-600">
              You haven&apos;t created a separate worker profile yet. You can create one above, or accept live jobs directly without one.
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

        {/* My Posted Live Bookings */}
        <section className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-orange-600" />
            <h3 className="text-base font-bold text-slate-900">
              My Live Requests ({myPostedLiveRequests.length})
            </h3>
          </div>
          {myPostedLiveRequests.length === 0 ? (
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
            </div>
          )}
        </section>

        {/* My Posted Jobs */}
        <section className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-slate-700" />
            <h3 className="text-base font-bold text-slate-900">
              My Job Posts ({myJobPosts.length})
            </h3>
          </div>
          {myJobPosts.length === 0 ? (
            <p className="text-xs text-slate-600">
              No regular jobs posted with this number yet.
            </p>
          ) : (
            <div className="space-y-2">
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

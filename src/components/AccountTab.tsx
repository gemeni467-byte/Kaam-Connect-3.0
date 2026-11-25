import React, { useState } from 'react';
import {
  Phone,
  LogOut,
  CheckCircle2,
  XCircle,
  UserCheck,
  Briefcase,
  Radio,
} from 'lucide-react';
import { closeJobPost, closeLiveRequest } from '../firebase';
import type {
  JobPost,
  LiveRequest,
  UserAccount,
  WorkerProfile,
} from '../types';
import {
  formatRelativeTimeHindi,
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
      onNotify('कृपया अपना नाम लिखें', true);
      return;
    }
    if (!isValidIndianMobile(cleanPhone)) {
      onNotify('सही 10 अंकों का भारतीय मोबाइल नंबर लिखें (6-9 से शुरू)', true);
      return;
    }
    onLogin({
      name: form.name.trim(),
      phone: cleanPhone,
      state: selectedState,
      city: selectedCity,
      loggedInAt: Date.now(),
    });
    onNotify('मोबाइल नंबर सफलतापूर्वक जुड़ गया!');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 max-w-lg mx-auto space-y-4"
    >
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-slate-900">
          मोबाइल नंबर से जुड़ें / लॉगिन करें
        </h2>
        <p className="text-xs text-slate-600">
          कोई पासवर्ड या ईमेल नहीं चाहिए। आपके मोबाइल नंबर से आपके सभी काम, लाइव बुकिंग और प्रोफाइल अपने आप जुड़ जाएंगे।
        </p>
      </div>

      <div>
        <label
          htmlFor="login-name-input"
          className="block text-sm font-semibold text-slate-800 mb-1"
        >
          आपका पूरा नाम <span className="text-orange-600">*</span>
        </label>
        <input
          id="login-name-input"
          type="text"
          value={form.name}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="जैसे: विजय कुमार / रामू ठेकेदार"
          className="w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
          required
        />
      </div>

      <div>
        <label
          htmlFor="login-phone-input"
          className="block text-sm font-semibold text-slate-800 mb-1"
        >
          10 अंकों का मोबाइल नंबर <span className="text-orange-600">*</span>
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
        <span>मोबाइल नंबर से जुड़ें / लॉगिन करें</span>
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
}) => {
  const [showWorkerEditor, setShowWorkerEditor] = useState(false);

  if (!currentUser) {
    return (
      <div className="py-2">
        <MobileLoginForm
          selectedState={selectedState}
          selectedCity={selectedCity}
          onLogin={onLogin}
          onNotify={onNotify}
        />
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
            +91 {currentUser.phone} · {selectedCity.split('(')[0].trim()}, {selectedState}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowWorkerEditor((prev) => !prev)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
          >
            {showWorkerEditor
              ? 'एडिटर बंद करें'
              : myWorkerProfile
              ? 'कारीगर प्रोफाइल बदलें'
              : 'कारीगर प्रोफाइल बनाएं'}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>लॉगआउट</span>
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
            मेरा कारीगर प्रोफाइल (Firestore से सिंक)
          </h3>
          {myWorkerProfile ? (
            <div className="space-y-1.5 text-xs text-slate-700">
              <div className="text-sm font-bold text-orange-700">
                {myWorkerProfile.skill}
              </div>
              <div>
                प्रकार:{' '}
                <strong>
                  {myWorkerProfile.workerType === 'team_leader'
                    ? `Team Leader (${myWorkerProfile.teamSize} मजदूर)`
                    : 'अकेला कारीगर (Individual)'}
                </strong>
              </div>
              <div>
                रेट: <strong className="tabular-nums">₹{myWorkerProfile.dailyRate}/दिन</strong> ·{' '}
                स्थान: {myWorkerProfile.city}, {myWorkerProfile.state}
              </div>
              <div>
                Outstation Ready:{' '}
                <strong>{myWorkerProfile.outstationReady ? 'हाँ' : 'नहीं'}</strong>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-600">
              आपने अभी अलग से कारीगर प्रोफाइल नहीं बनाया है। आप चाहें तो ऊपर बटन से प्रोफाइल जोड़ सकते हैं, या बिना प्रोफाइल के भी सीधे लाइव काम Accept कर सकते हैं।
            </p>
          )}
        </section>

        {/* Accepted Live Jobs */}
        <section className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">
              मैंने जो लाइव काम लिए ({myAcceptedLiveRequests.length})
            </h3>
          </div>
          {myAcceptedLiveRequests.length === 0 ? (
            <p className="text-xs text-slate-600">
              आपने अभी कोई लाइव काम Accept नहीं किया है।
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
                      {req.contractorName} · ₹{req.dailyRate}/दिन · {req.city}
                    </div>
                  </div>
                  <a
                    href={`tel:+91${req.contractorPhone}`}
                    className="min-h-[38px] px-3 rounded-lg bg-emerald-600 text-white font-bold inline-flex items-center gap-1 shrink-0"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>कॉल</span>
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
              मेरी लाइव रिक्वेस्ट ({myPostedLiveRequests.length})
            </h3>
          </div>
          {myPostedLiveRequests.length === 0 ? (
            <p className="text-xs text-slate-600">
              इस नंबर से कोई लाइव रिक्वेस्ट पोस्ट नहीं की गई है।
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
                      {req.city} · {formatRelativeTimeHindi(req.createdAt)} ·{' '}
                      {req.status === 'open' ? 'चालू' : 'बंद'}
                    </div>
                  </div>
                  {req.status === 'open' && (
                    <button
                      type="button"
                      onClick={() => closeLiveRequest(req.id)}
                      className="min-h-[38px] px-3 rounded-lg bg-rose-600 text-white font-bold inline-flex items-center gap-1 shrink-0"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>बंद करें</span>
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
              मेरी जॉब पोस्ट ({myJobPosts.length})
            </h3>
          </div>
          {myJobPosts.length === 0 ? (
            <p className="text-xs text-slate-600">
              इस नंबर से कोई जॉब पोस्ट नहीं की गई है।
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
                      {job.skill} ({job.workersNeeded} मजदूर)
                    </div>
                    <div className="text-slate-600">
                      ₹{job.dailyRate}/दिन · {job.city} ·{' '}
                      {job.status === 'open' ? 'चालू' : 'बंद'}
                    </div>
                  </div>
                  {job.status === 'open' && (
                    <button
                      type="button"
                      onClick={() => closeJobPost(job.id)}
                      className="min-h-[38px] px-3 rounded-lg bg-rose-600 text-white font-bold inline-flex items-center gap-1 shrink-0"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>बंद करें</span>
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

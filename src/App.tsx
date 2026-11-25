import React, { useState, useEffect, useCallback } from 'react';
import {
  DEFAULT_CITY,
  DEFAULT_STATE,
  LIVE_REQUEST_MAX_AGE_HOURS,
  LOCATION_STORAGE_KEY,
  USER_STORAGE_KEY,
} from './data/constants';
import { subscribeJobs, subscribeLiveRequests, subscribeWorkers } from './firebase';
import type {
  ActiveTab,
  JobPost,
  LiveRequest,
  UserAccount,
  WorkerProfile,
} from './types';
import { isWithinHours, normalizePhone } from './utils/matching';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { LocationSelectorModal } from './components/LocationSelectorModal';
import { ReportModal, type ReportTarget } from './components/ReportModal';
import { LiveMatchingTab } from './components/LiveMatchingTab';
import { JobBoardTab } from './components/JobBoardTab';
import { WorkerDirectoryTab } from './components/WorkerDirectoryTab';
import { AccountTab } from './components/AccountTab';

function loadStoredUser(): UserAccount | null {
  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserAccount;
    if (parsed && parsed.name && parsed.phone) {
      return {
        ...parsed,
        phone: normalizePhone(parsed.phone),
      };
    }
    return null;
  } catch {
    return null;
  }
}

function loadStoredLocation(): { state: string; city: string } {
  try {
    const raw = window.localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!raw) return { state: DEFAULT_STATE, city: DEFAULT_CITY };
    const parsed = JSON.parse(raw) as { state?: string; city?: string };
    return {
      state: parsed.state || DEFAULT_STATE,
      city: parsed.city || DEFAULT_CITY,
    };
  } catch {
    return { state: DEFAULT_STATE, city: DEFAULT_CITY };
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('live');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(loadStoredUser);
  const [location, setLocation] = useState<{ state: string; city: string }>(
    loadStoredLocation,
  );
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);

  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [liveRequests, setLiveRequests] = useState<LiveRequest[]>([]);
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  const [toast, setToast] = useState<{ msg: string; isError: boolean } | null>(
    null,
  );

  const showToast = useCallback((msg: string, isError = false) => {
    setToast({ msg, isError });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const unsubWorkers = subscribeWorkers(
      (list) => {
        setWorkers(list);
        setFirestoreError(null);
      },
      (err) => setFirestoreError(err.message),
    );

    const unsubLive = subscribeLiveRequests(
      (list) => {
        setLiveRequests(list);
        setFirestoreError(null);
      },
      (err) => setFirestoreError(err.message),
    );

    const unsubJobs = subscribeJobs(
      (list) => {
        setJobs(list);
        setFirestoreError(null);
      },
      (err) => setFirestoreError(err.message),
    );

    return () => {
      unsubWorkers();
      unsubLive();
      unsubJobs();
    };
  }, []);

  const handleLogin = (account: UserAccount) => {
    const cleanAccount: UserAccount = {
      ...account,
      phone: normalizePhone(account.phone),
    };
    setCurrentUser(cleanAccount);
    try {
      window.localStorage.setItem(
        USER_STORAGE_KEY,
        JSON.stringify(cleanAccount),
      );
    } catch {
      // Ignore storage quota errors
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      window.localStorage.removeItem(USER_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    showToast('आप लॉगआउट हो गए हैं।');
  };

  const handleApplyLocation = (state: string, city: string) => {
    const nextLoc = { state, city };
    setLocation(nextLoc);
    try {
      window.localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(nextLoc));
    } catch {
      // Ignore storage errors
    }
    if (currentUser) {
      handleLogin({ ...currentUser, state, city });
    }
  };

  const handleUserSyncedFromProfile = (saved: {
    name: string;
    phone: string;
    state: string;
    city: string;
  }) => {
    handleLogin({
      name: saved.name,
      phone: saved.phone,
      state: saved.state,
      city: saved.city,
      loggedInAt: currentUser?.loggedInAt || Date.now(),
    });
    handleApplyLocation(saved.state, saved.city);
  };

  const myWorkerProfile = currentUser
    ? workers.find(
        (w) => normalizePhone(w.phone) === normalizePhone(currentUser.phone),
      ) || null
    : null;

  const activeLiveCount = liveRequests.filter(
    (r) =>
      r.status === 'open' &&
      isWithinHours(r.createdAt, LIVE_REQUEST_MAX_AGE_HOURS),
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedState={location.state}
        selectedCity={location.city}
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
      />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 pt-4 pb-24 md:pb-10 space-y-4">
        {/* Crisp Tagline & Quick Account Prompt */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              सीधा काम, सीधा संपर्क — बिना किसी बिचौलिए के
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              वर्तमान क्षेत्र: <strong className="text-slate-800">{location.city}</strong>,{' '}
              {location.state}
            </p>
          </div>

          {!currentUser && activeTab !== 'account' && (
            <button
              type="button"
              onClick={() => setActiveTab('account')}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold self-start sm:self-auto whitespace-nowrap shrink-0"
            >
              मोबाइल नंबर से जुड़ें
            </button>
          )}
        </div>

        {firestoreError && (
          <div
            role="alert"
            className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900"
          >
            डेटाबेस से जुड़ने में समस्या: {firestoreError}
          </div>
        )}

        {activeTab === 'live' && (
          <LiveMatchingTab
            currentUser={currentUser}
            myWorkerProfile={myWorkerProfile}
            workers={workers}
            liveRequests={liveRequests}
            selectedState={location.state}
            selectedCity={location.city}
            onGoToAccount={() => setActiveTab('account')}
            onReport={setReportTarget}
            onNotify={showToast}
          />
        )}

        {activeTab === 'jobs' && (
          <JobBoardTab
            currentUser={currentUser}
            jobs={jobs}
            selectedState={location.state}
            selectedCity={location.city}
            onReport={setReportTarget}
            onNotify={showToast}
          />
        )}

        {activeTab === 'workers' && (
          <WorkerDirectoryTab
            currentUser={currentUser}
            myWorkerProfile={myWorkerProfile}
            workers={workers}
            selectedState={location.state}
            selectedCity={location.city}
            onUserSynced={handleUserSyncedFromProfile}
            onReport={setReportTarget}
            onNotify={showToast}
          />
        )}

        {activeTab === 'account' && (
          <AccountTab
            currentUser={currentUser}
            myWorkerProfile={myWorkerProfile}
            liveRequests={liveRequests}
            jobs={jobs}
            selectedState={location.state}
            selectedCity={location.city}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onUserSynced={handleUserSyncedFromProfile}
            onNotify={showToast}
          />
        )}
      </main>

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        liveCount={activeLiveCount}
      />

      <LocationSelectorModal
        isOpen={isLocationModalOpen}
        currentState={location.state}
        currentCity={location.city}
        onClose={() => setIsLocationModalOpen(false)}
        onApply={handleApplyLocation}
      />

      <ReportModal
        target={reportTarget}
        currentUser={currentUser}
        onClose={() => setReportTarget(null)}
        onSuccess={(msg) => showToast(msg)}
      />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[calc(100%-2rem)] rounded-xl px-4 py-3 text-xs font-bold shadow-lg border ${
            toast.isError
              ? 'bg-rose-950 text-white border-rose-800'
              : 'bg-slate-900 text-white border-slate-800'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

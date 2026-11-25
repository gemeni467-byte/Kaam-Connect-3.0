import { initializeApp, getApps } from 'firebase/app';
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getFirestore,
  onSnapshot,
  runTransaction,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import type {
  ContractorProfile,
  FraudReport,
  JobPost,
  LiveRequest,
  QuickChatMessage,
  WorkerProfile,
} from './types';
import {
  canWorkerAcceptRequest,
  computeAcceptTransactionUpdate,
  normalizePhone,
  sanitizeForFirestore,
} from './utils/matching';

const firebaseConfig = {
  apiKey: 'AIzaSyDcR-Ch_sWABCgieN_lbZ6ovjMrr476HIY',
  authDomain: 'kaam-connect-c4983.firebaseapp.com',
  projectId: 'kaam-connect-c4983',
  storageBucket: 'kaam-connect-c4983.firebasestorage.app',
  messagingSenderId: '1044094197345',
  appId: '1:1044094197345:web:22f2e7f36ac6415f22d420',
  measurementId: 'G-RD1CFM2J5E',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);

export const COLLECTIONS = {
  WORKERS: 'workers',
  CONTRACTORS: 'contractors',
  LIVE_REQUESTS: 'live_requests',
  JOBS: 'jobs',
  REPORTS: 'reports',
} as const;

export function subscribeWorkers(
  onData: (workers: WorkerProfile[]) => void,
  onError: (err: Error) => void,
) {
  return onSnapshot(
    collection(db, COLLECTIONS.WORKERS),
    (snapshot) => {
      const list: WorkerProfile[] = snapshot.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        const isAvailable =
          typeof data.isAvailable === 'boolean'
            ? data.isAvailable
            : typeof data.isOnline === 'boolean'
            ? data.isOnline
            : true;
        const isOnline =
          typeof data.isOnline === 'boolean' ? data.isOnline : isAvailable;
        return {
          id: d.id,
          name: String(data.name || ''),
          phone: normalizePhone(String(data.phone || d.id)),
          skill: String(data.skill || 'Helper / Labour'),
          workerType: data.workerType === 'team_leader' ? 'team_leader' : 'individual',
          teamSize: Number(data.teamSize || 1),
          outstationReady: Boolean(data.outstationReady),
          dailyRate: Number(data.dailyRate || 600),
          state: String(data.state || 'Odisha'),
          city: String(data.city || 'Rourkela'),
          experienceYears: Number(data.experienceYears || 0),
          isOnline,
          isAvailable,
          updatedAt: Number(data.updatedAt || 0),
          createdAt: Number(data.createdAt || data.updatedAt || 0),
        };
      });
      list.sort(
        (a, b) =>
          Number(b.isAvailable) - Number(a.isAvailable) ||
          Number(b.isOnline) - Number(a.isOnline) ||
          b.updatedAt - a.updatedAt,
      );
      onData(list);
    },
    (error) => onError(error),
  );
}

export function subscribeContractors(
  onData: (contractors: ContractorProfile[]) => void,
  onError: (err: Error) => void,
) {
  return onSnapshot(
    collection(db, COLLECTIONS.CONTRACTORS),
    (snapshot) => {
      const list: ContractorProfile[] = snapshot.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        const facilities = (data.facilities as Record<string, unknown>) || {};
        return {
          id: d.id,
          name: String(data.name || ''),
          companyName: String(data.companyName || ''),
          phone: normalizePhone(String(data.phone || d.id)),
          tradesHired: Array.isArray(data.tradesHired)
            ? (data.tradesHired as string[]).map((t) => String(t).trim()).filter(Boolean)
            : [],
          state: String(data.state || 'Odisha'),
          city: String(data.city || 'Rourkela'),
          facilities: {
            stayFree: Boolean(facilities.stayFree),
            foodFree: Boolean(facilities.foodFree),
            travelAllowance: Boolean(facilities.travelAllowance),
          },
          isHiring: typeof data.isHiring === 'boolean' ? data.isHiring : true,
          updatedAt: Number(data.updatedAt || 0),
          createdAt: Number(data.createdAt || data.updatedAt || 0),
        };
      });
      list.sort(
        (a, b) => Number(b.isHiring) - Number(a.isHiring) || b.updatedAt - a.updatedAt,
      );
      onData(list);
    },
    (error) => onError(error),
  );
}

export function subscribeLiveRequests(
  onData: (requests: LiveRequest[]) => void,
  onError: (err: Error) => void,
) {
  return onSnapshot(
    collection(db, COLLECTIONS.LIVE_REQUESTS),
    (snapshot) => {
      const list: LiveRequest[] = snapshot.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        const facilities = (data.facilities as Record<string, unknown>) || {};
        return {
          id: d.id,
          contractorName: String(data.contractorName || 'Contractor'),
          contractorPhone: normalizePhone(String(data.contractorPhone || '')),
          skill: String(data.skill || 'Helper / Labour'),
          requiredCount: Math.max(1, Number(data.requiredCount || 1)),
          confirmedCount: Math.max(0, Number(data.confirmedCount || 0)),
          dailyRate: Number(data.dailyRate || 0),
          state: String(data.state || 'Odisha'),
          city: String(data.city || ''),
          siteAddress: String(data.siteAddress || ''),
          facilities: {
            stayFree: Boolean(facilities.stayFree),
            foodFree: Boolean(facilities.foodFree),
            travelAllowance: Boolean(facilities.travelAllowance),
          },
          status: data.status === 'closed' ? 'closed' : 'open',
          acceptedWorkers: Array.isArray(data.acceptedWorkers)
            ? (data.acceptedWorkers as LiveRequest['acceptedWorkers'])
            : [],
          acceptedPhones: Array.isArray(data.acceptedPhones)
            ? (data.acceptedPhones as string[]).map((p) => normalizePhone(p))
            : [],
          messages: Array.isArray(data.messages)
            ? (data.messages as QuickChatMessage[])
            : [],
          createdAt: Number(data.createdAt || 0),
          updatedAt: Number(data.updatedAt || data.createdAt || 0),
        };
      });
      list.sort((a, b) => b.createdAt - a.createdAt);
      onData(list);
    },
    (error) => onError(error),
  );
}

export function subscribeJobs(
  onData: (jobs: JobPost[]) => void,
  onError: (err: Error) => void,
) {
  return onSnapshot(
    collection(db, COLLECTIONS.JOBS),
    (snapshot) => {
      const list: JobPost[] = snapshot.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        const facilities = (data.facilities as Record<string, unknown>) || {};
        return {
          id: d.id,
          contractorName: String(data.contractorName || 'Contractor'),
          contractorPhone: normalizePhone(String(data.contractorPhone || '')),
          skill: String(data.skill || 'Helper / Labour'),
          workersNeeded: Math.max(1, Number(data.workersNeeded || 1)),
          dailyRate: Number(data.dailyRate || 0),
          state: String(data.state || 'Odisha'),
          city: String(data.city || ''),
          siteAddress: String(data.siteAddress || ''),
          description: String(data.description || ''),
          facilities: {
            stayFree: Boolean(facilities.stayFree),
            foodFree: Boolean(facilities.foodFree),
            travelAllowance: Boolean(facilities.travelAllowance),
          },
          status: data.status === 'closed' ? 'closed' : 'open',
          createdAt: Number(data.createdAt || 0),
          updatedAt: Number(data.updatedAt || data.createdAt || 0),
        };
      });
      list.sort((a, b) => b.createdAt - a.createdAt);
      onData(list);
    },
    (error) => onError(error),
  );
}

export async function saveWorkerProfile(
  profile: Omit<WorkerProfile, 'id' | 'createdAt' | 'updatedAt'> & { createdAt?: number },
): Promise<void> {
  const cleanPhone = normalizePhone(profile.phone);
  const now = Date.now();
  const isAvailable = Boolean(profile.isAvailable);
  const payload = sanitizeForFirestore({
    name: profile.name.trim(),
    phone: cleanPhone,
    skill: profile.skill.trim() || 'Helper / Labour',
    workerType: profile.workerType || 'individual',
    teamSize: profile.workerType === 'team_leader' ? Math.max(2, Number(profile.teamSize || 5)) : 1,
    outstationReady: Boolean(profile.outstationReady),
    dailyRate: Math.max(0, Number(profile.dailyRate || 600)),
    state: profile.state,
    city: profile.city.trim(),
    experienceYears: Math.max(0, Number(profile.experienceYears || 0)),
    isOnline: isAvailable,
    isAvailable,
    createdAt: profile.createdAt || now,
    updatedAt: now,
  });

  await setDoc(doc(db, COLLECTIONS.WORKERS, cleanPhone), payload, { merge: true });
}

export async function setWorkerAvailabilityStatus(
  worker: WorkerProfile,
  isAvailable: boolean,
): Promise<void> {
  const cleanPhone = normalizePhone(worker.phone);
  const now = Date.now();
  await setDoc(
    doc(db, COLLECTIONS.WORKERS, cleanPhone),
    sanitizeForFirestore({
      isAvailable,
      isOnline: isAvailable,
      updatedAt: now,
    }),
    { merge: true },
  );
}

export async function setWorkerDutyStatus(params: {
  phone: string;
  name: string;
  state: string;
  city: string;
  isOnline: boolean;
  existingProfile?: WorkerProfile | null;
}): Promise<void> {
  const cleanPhone = normalizePhone(params.phone);
  const now = Date.now();
  const payload = sanitizeForFirestore({
    name: (params.existingProfile?.name || params.name || 'Worker').trim(),
    phone: cleanPhone,
    skill: params.existingProfile?.skill || 'Helper / Labour',
    workerType: params.existingProfile?.workerType || 'individual',
    teamSize: params.existingProfile?.teamSize || 1,
    outstationReady: params.existingProfile?.outstationReady ?? false,
    dailyRate: params.existingProfile?.dailyRate || 600,
    state: params.existingProfile?.state || params.state,
    city: params.existingProfile?.city || params.city,
    experienceYears: params.existingProfile?.experienceYears || 0,
    isOnline: params.isOnline,
    isAvailable: params.isOnline,
    createdAt: params.existingProfile?.createdAt || now,
    updatedAt: now,
  });
  await setDoc(doc(db, COLLECTIONS.WORKERS, cleanPhone), payload, { merge: true });
}

export async function saveContractorProfile(
  profile: Omit<ContractorProfile, 'id' | 'createdAt' | 'updatedAt'> & {
    createdAt?: number;
  },
): Promise<void> {
  const cleanPhone = normalizePhone(profile.phone);
  const now = Date.now();
  const payload = sanitizeForFirestore({
    name: profile.name.trim(),
    companyName: profile.companyName.trim(),
    phone: cleanPhone,
    tradesHired: profile.tradesHired.map((t) => t.trim()).filter(Boolean),
    state: profile.state,
    city: profile.city.trim(),
    facilities: {
      stayFree: Boolean(profile.facilities.stayFree),
      foodFree: Boolean(profile.facilities.foodFree),
      travelAllowance: Boolean(profile.facilities.travelAllowance),
    },
    isHiring: Boolean(profile.isHiring),
    createdAt: profile.createdAt || now,
    updatedAt: now,
  });

  await setDoc(doc(db, COLLECTIONS.CONTRACTORS, cleanPhone), payload, {
    merge: true,
  });
}

export async function setContractorHiringStatus(
  contractor: ContractorProfile,
  isHiring: boolean,
): Promise<void> {
  const cleanPhone = normalizePhone(contractor.phone);
  await setDoc(
    doc(db, COLLECTIONS.CONTRACTORS, cleanPhone),
    sanitizeForFirestore({
      isHiring,
      updatedAt: Date.now(),
    }),
    { merge: true },
  );
}

export async function createLiveRequest(
  input: Omit<
    LiveRequest,
    'id' | 'confirmedCount' | 'status' | 'acceptedWorkers' | 'acceptedPhones' | 'messages' | 'createdAt' | 'updatedAt'
  >,
): Promise<string> {
  const now = Date.now();
  const payload = sanitizeForFirestore({
    contractorName: input.contractorName.trim(),
    contractorPhone: normalizePhone(input.contractorPhone),
    skill: input.skill.trim(),
    requiredCount: Math.max(1, Number(input.requiredCount || 1)),
    confirmedCount: 0,
    dailyRate: Math.max(0, Number(input.dailyRate || 0)),
    state: input.state,
    city: input.city.trim(),
    siteAddress: input.siteAddress.trim(),
    facilities: {
      stayFree: Boolean(input.facilities.stayFree),
      foodFree: Boolean(input.facilities.foodFree),
      travelAllowance: Boolean(input.facilities.travelAllowance),
    },
    status: 'open',
    acceptedWorkers: [],
    acceptedPhones: [],
    messages: [],
    createdAt: now,
    updatedAt: now,
  });

  const docRef = await addDoc(collection(db, COLLECTIONS.LIVE_REQUESTS), payload);
  return docRef.id;
}

export async function acceptLiveRequestTransaction(params: {
  requestId: string;
  user: { name: string; phone: string };
  workerProfile?: WorkerProfile | null;
}): Promise<void> {
  const reqRef = doc(db, COLLECTIONS.LIVE_REQUESTS, params.requestId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(reqRef);
    if (!snap.exists()) {
      throw new Error('This live request no longer exists');
    }
    const raw = snap.data() as Record<string, unknown>;
    const currentReq: LiveRequest = {
      id: snap.id,
      contractorName: String(raw.contractorName || ''),
      contractorPhone: normalizePhone(String(raw.contractorPhone || '')),
      skill: String(raw.skill || 'Helper / Labour'),
      requiredCount: Math.max(1, Number(raw.requiredCount || 1)),
      confirmedCount: Math.max(0, Number(raw.confirmedCount || 0)),
      dailyRate: Number(raw.dailyRate || 0),
      state: String(raw.state || ''),
      city: String(raw.city || ''),
      siteAddress: String(raw.siteAddress || ''),
      facilities: {
        stayFree: Boolean((raw.facilities as Record<string, unknown>)?.stayFree),
        foodFree: Boolean((raw.facilities as Record<string, unknown>)?.foodFree),
        travelAllowance: Boolean((raw.facilities as Record<string, unknown>)?.travelAllowance),
      },
      status: raw.status === 'closed' ? 'closed' : 'open',
      acceptedWorkers: Array.isArray(raw.acceptedWorkers)
        ? (raw.acceptedWorkers as LiveRequest['acceptedWorkers'])
        : [],
      acceptedPhones: Array.isArray(raw.acceptedPhones)
        ? (raw.acceptedPhones as string[]).map((p) => normalizePhone(p))
        : [],
      messages: Array.isArray(raw.messages) ? (raw.messages as QuickChatMessage[]) : [],
      createdAt: Number(raw.createdAt || 0),
      updatedAt: Number(raw.updatedAt || 0),
    };

    const eligibility = canWorkerAcceptRequest(currentReq, params.user.phone, Date.now());
    if (!eligibility.allowed) {
      throw new Error(eligibility.reason || 'Unable to accept this job');
    }

    const nextUpdate = computeAcceptTransactionUpdate(
      currentReq,
      params.user,
      params.workerProfile,
      Date.now(),
    );

    tx.update(reqRef, nextUpdate);
  });
}

export async function closeLiveRequest(requestId: string): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.LIVE_REQUESTS, requestId), {
    status: 'closed',
    updatedAt: Date.now(),
  });
}

export async function sendQuickChatMessage(params: {
  requestId: string;
  senderPhone: string;
  senderName: string;
  senderRole: 'worker' | 'contractor';
  text: string;
}): Promise<void> {
  const now = Date.now();
  const message: QuickChatMessage = sanitizeForFirestore({
    id: `${now}-${Math.random().toString(36).slice(2, 7)}`,
    senderPhone: normalizePhone(params.senderPhone),
    senderName: (params.senderName || 'User').trim(),
    senderRole: params.senderRole,
    text: params.text.trim(),
    createdAt: now,
  });
  await updateDoc(doc(db, COLLECTIONS.LIVE_REQUESTS, params.requestId), {
    messages: arrayUnion(message),
    updatedAt: now,
  });
}

export async function createJobPost(
  input: Omit<JobPost, 'id' | 'status' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const now = Date.now();
  const payload = sanitizeForFirestore({
    contractorName: input.contractorName.trim(),
    contractorPhone: normalizePhone(input.contractorPhone),
    skill: input.skill.trim(),
    workersNeeded: Math.max(1, Number(input.workersNeeded || 1)),
    dailyRate: Math.max(0, Number(input.dailyRate || 0)),
    state: input.state,
    city: input.city.trim(),
    siteAddress: input.siteAddress.trim(),
    description: input.description.trim(),
    facilities: {
      stayFree: Boolean(input.facilities.stayFree),
      foodFree: Boolean(input.facilities.foodFree),
      travelAllowance: Boolean(input.facilities.travelAllowance),
    },
    status: 'open',
    createdAt: now,
    updatedAt: now,
  });
  const docRef = await addDoc(collection(db, COLLECTIONS.JOBS), payload);
  return docRef.id;
}

export async function closeJobPost(jobId: string): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.JOBS, jobId), {
    status: 'closed',
    updatedAt: Date.now(),
  });
}

export async function submitFraudReport(
  report: Omit<FraudReport, 'id' | 'createdAt'>,
): Promise<void> {
  const payload = sanitizeForFirestore({
    targetType: report.targetType,
    targetId: report.targetId,
    targetName: report.targetName.trim(),
    targetPhone: normalizePhone(report.targetPhone),
    reason: report.reason.trim(),
    details: report.details.trim(),
    reporterPhone: normalizePhone(report.reporterPhone),
    reporterName: report.reporterName.trim(),
    createdAt: Date.now(),
  });
  await addDoc(collection(db, COLLECTIONS.REPORTS), payload);
}

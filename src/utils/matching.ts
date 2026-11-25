import { CUSTOM_SKILL_OPTION, LIVE_REQUEST_MAX_AGE_HOURS } from '../data/constants';
import type {
  AcceptedWorkerEntry,
  FacilityFlags,
  LiveRequest,
  LocationFilterMode,
  WorkerProfile,
} from '../types';

export function normalizePhone(raw: string): string {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits.slice(0, 10);
}

export function isValidIndianMobile(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return /^[6-9]\d{9}$/.test(normalized);
}

export function resolveSkill(selectedSkill: string, customSkill: string): string {
  if (selectedSkill === CUSTOM_SKILL_OPTION) {
    return customSkill.trim();
  }
  return selectedSkill.trim();
}

export function isWithinHours(
  createdAt: number,
  maxHours: number,
  now: number = Date.now(),
): boolean {
  if (!Number.isFinite(createdAt) || createdAt <= 0) return false;
  const diffMs = now - createdAt;
  return diffMs >= -60_000 && diffMs <= maxHours * 60 * 60 * 1000;
}

function tokenizeCity(city: string): string[] {
  return String(city || '')
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .split(/[\s,/]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

export function matchesLocationFilter(
  itemState: string,
  itemCity: string,
  userState: string,
  userCity: string,
  mode: LocationFilterMode,
): boolean {
  if (mode === 'all_india') return true;

  const normItemCity = String(itemCity || '').trim().toLowerCase();
  const normUserCity = String(userCity || '').trim().toLowerCase();

  if (!normUserCity) {
    return (
      String(itemState || '').trim().toLowerCase() ===
      String(userState || '').trim().toLowerCase()
    );
  }

  if (normItemCity === normUserCity) return true;
  if (normItemCity.includes(normUserCity) || normUserCity.includes(normItemCity)) {
    return true;
  }

  const itemTokens = tokenizeCity(normItemCity);
  const userTokens = tokenizeCity(normUserCity);
  return userTokens.some((token) => itemTokens.includes(token));
}

export function sanitizeForFirestore<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const clean: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (val !== undefined) {
        clean[key] = sanitizeForFirestore(val);
      }
    }
    return clean as T;
  }
  return value;
}

export interface AcceptEligibilityResult {
  allowed: boolean;
  alreadyAccepted?: boolean;
  isOwnRequest?: boolean;
  isFull?: boolean;
  reason?: string;
}

export function canWorkerAcceptRequest(
  request: Pick<
    LiveRequest,
    'contractorPhone' | 'status' | 'createdAt' | 'acceptedPhones' | 'confirmedCount' | 'requiredCount'
  >,
  currentUserPhone: string,
  now: number = Date.now(),
): AcceptEligibilityResult {
  const cleanUserPhone = normalizePhone(currentUserPhone);
  const cleanContractorPhone = normalizePhone(request.contractorPhone || '');

  if (cleanUserPhone && cleanContractorPhone === cleanUserPhone) {
    return {
      allowed: false,
      isOwnRequest: true,
      reason: 'यह आपकी अपनी रिक्वेस्ट है',
    };
  }

  if (cleanUserPhone && (request.acceptedPhones || []).includes(cleanUserPhone)) {
    return {
      allowed: false,
      alreadyAccepted: true,
      reason: 'आपने यह काम Accept कर लिया है',
    };
  }

  if (request.status !== 'open') {
    return {
      allowed: false,
      reason: 'यह रिक्वेस्ट बंद हो चुकी है',
    };
  }

  if (!isWithinHours(request.createdAt, LIVE_REQUEST_MAX_AGE_HOURS, now)) {
    return {
      allowed: false,
      reason: 'यह रिक्वेस्ट 6 घंटे से पुरानी है',
    };
  }

  const confirmed = Number(request.confirmedCount || 0);
  const required = Math.max(1, Number(request.requiredCount || 1));
  if (confirmed >= required) {
    return {
      allowed: false,
      isFull: true,
      reason: 'सभी मजदूर पूरे हो चुके हैं',
    };
  }

  if (!isValidIndianMobile(cleanUserPhone)) {
    return {
      allowed: false,
      reason: 'काम लेने के लिए पहले मोबाइल नंबर से जुड़ें',
    };
  }

  return { allowed: true };
}

export function computeAcceptTransactionUpdate(
  request: LiveRequest,
  user: { name: string; phone: string },
  workerProfile: Pick<WorkerProfile, 'skill'> | null | undefined,
  now: number = Date.now(),
) {
  const cleanPhone = normalizePhone(user.phone);
  const fallbackSkill =
    (workerProfile?.skill && workerProfile.skill.trim()) ||
    (request.skill && request.skill.trim()) ||
    'सामान्य मजदूर';

  const newEntry: AcceptedWorkerEntry = sanitizeForFirestore({
    name: (user.name || 'कारीगर').trim(),
    phone: cleanPhone,
    skill: fallbackSkill,
    acceptedAt: now,
  });

  const existingWorkers = Array.isArray(request.acceptedWorkers)
    ? request.acceptedWorkers
    : [];
  const existingPhones = Array.isArray(request.acceptedPhones)
    ? request.acceptedPhones
    : [];

  const nextWorkers = [...existingWorkers, newEntry];
  const nextPhones = Array.from(new Set([...existingPhones, cleanPhone]));
  const nextConfirmedCount = Math.max(
    Number(request.confirmedCount || 0) + 1,
    nextWorkers.length,
  );

  return sanitizeForFirestore({
    acceptedWorkers: nextWorkers,
    acceptedPhones: nextPhones,
    confirmedCount: nextConfirmedCount,
    updatedAt: now,
  });
}

export function buildTelUrl(phone: string): string {
  const clean = normalizePhone(phone);
  return `tel:+91${clean}`;
}

export function buildDirectWhatsAppUrl(phone: string, message: string): string {
  const clean = normalizePhone(phone);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/91${clean}?text=${encoded}`;
}

export function buildWhatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function formatFacilitiesText(facilities?: FacilityFlags): string {
  if (!facilities) return '';
  const list: string[] = [];
  if (facilities.stayFree) list.push('रहना Free');
  if (facilities.foodFree) list.push('खाना Free');
  if (facilities.travelAllowance) list.push('आने-जाने का किराया');
  return list.join(' · ');
}

export function formatRelativeTimeHindi(timestamp: number, now: number = Date.now()): string {
  if (!timestamp || !Number.isFinite(timestamp)) return 'अभी';
  const diffSec = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (diffSec < 60) return 'अभी';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} मिनट पहले`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} घंटे पहले`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} दिन पहले`;
}

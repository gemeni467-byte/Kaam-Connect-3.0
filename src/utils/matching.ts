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

export function cleanCityLabel(city: string): string {
  const raw = String(city || '').trim();
  const parenMatch = raw.match(/\(([^)]+)\)/);
  if (parenMatch && /[\u0900-\u097F]/.test(raw)) {
    return parenMatch[1].trim();
  }
  if (/[\u0900-\u097F]/.test(raw)) {
    return 'Rourkela';
  }
  return raw;
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
      reason: 'This is your own request',
    };
  }

  if (cleanUserPhone && (request.acceptedPhones || []).includes(cleanUserPhone)) {
    return {
      allowed: false,
      alreadyAccepted: true,
      reason: 'You have already accepted this job',
    };
  }

  if (request.status !== 'open') {
    return {
      allowed: false,
      reason: 'This request is closed',
    };
  }

  if (!isWithinHours(request.createdAt, LIVE_REQUEST_MAX_AGE_HOURS, now)) {
    return {
      allowed: false,
      reason: 'This request is older than 6 hours',
    };
  }

  const confirmed = Number(request.confirmedCount || 0);
  const required = Math.max(1, Number(request.requiredCount || 1));
  if (confirmed >= required) {
    return {
      allowed: false,
      isFull: true,
      reason: 'All required workers have been confirmed',
    };
  }

  if (!isValidIndianMobile(cleanUserPhone)) {
    return {
      allowed: false,
      reason: 'Please join with your mobile number first to accept jobs',
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
    'Helper / Labour';

  const newEntry: AcceptedWorkerEntry = sanitizeForFirestore({
    name: (user.name || 'Worker').trim(),
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

export const LIVE_CLOUD_RUN_URL =
  'https://ais-pre-dka5gnxodntfhzxn7g7fyv-915210984650.asia-northeast1.run.app';

export function getAppShareLink(): string {
  if (
    typeof window !== 'undefined' &&
    window.location?.origin &&
    !window.location.origin.includes('localhost') &&
    !window.location.origin.startsWith('capacitor:')
  ) {
    return window.location.origin;
  }
  return LIVE_CLOUD_RUN_URL;
}

export function buildShareAppText(appUrl: string = LIVE_CLOUD_RUN_URL): string {
  return `Kaam Connect — Sidha Kaam, Sidha Sampark (100% Free)! Welder, Fitter, Rigger, Gas Cutter, Rajmistri aur Helper ke liye bina commission kaam payein ya bulayein. Abhi kholein: ${appUrl}`;
}

export async function shareKaamConnectApp(): Promise<'shared' | 'whatsapp' | 'cancelled'> {
  const shareText = buildShareAppText(LIVE_CLOUD_RUN_URL);

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: 'Kaam Connect',
        text: shareText,
      });
      return 'shared';
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return 'cancelled';
      }
      // Fall back to WhatsApp if navigator.share is blocked or unsupported
    }
  }

  window.open(buildWhatsAppShareUrl(shareText), '_blank', 'noopener,noreferrer');
  return 'whatsapp';
}

export function formatFacilitiesText(facilities?: FacilityFlags): string {
  if (!facilities) return '';
  const list: string[] = [];
  if (facilities.stayFree) list.push('Free Stay');
  if (facilities.foodFree) list.push('Free Food');
  if (facilities.travelAllowance) list.push('Travel Allowance');
  return list.join(' · ');
}

export function formatRelativeTime(timestamp: number, now: number = Date.now()): string {
  if (!timestamp || !Number.isFinite(timestamp)) return 'Just now';
  const diffSec = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

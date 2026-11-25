import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canWorkerAcceptRequest,
  computeAcceptTransactionUpdate,
  isValidIndianMobile,
  isWithinHours,
  matchesLocationFilter,
  normalizePhone,
  resolveSkill,
  sanitizeForFirestore,
} from './matching';
import { CUSTOM_SKILL_OPTION } from '../data/constants';
import type { LiveRequest } from '../types';

const BASE_TIME = 1_760_000_000_000;

function makeLiveRequest(overrides: Partial<LiveRequest> = {}): LiveRequest {
  return {
    id: 'req-1',
    contractorName: 'रमेश ठेकेदार',
    contractorPhone: '9876543210',
    skill: 'वेल्डर (Welder - Arc / MIG / TIG)',
    requiredCount: 3,
    confirmedCount: 0,
    dailyRate: 850,
    state: 'Odisha',
    city: 'राउरकेला (Rourkela)',
    siteAddress: 'सेक्टर 19, स्टील प्लांट गेट',
    facilities: { stayFree: true, foodFree: false, travelAllowance: true },
    status: 'open',
    acceptedWorkers: [],
    acceptedPhones: [],
    messages: [],
    createdAt: BASE_TIME - 30 * 60 * 1000,
    updatedAt: BASE_TIME - 30 * 60 * 1000,
    ...overrides,
  };
}

test('normalizes and validates 10-digit Indian mobile numbers', () => {
  assert.equal(normalizePhone('+91 98765-43210'), '9876543210');
  assert.equal(normalizePhone('09876543210'), '9876543210');
  assert.equal(isValidIndianMobile('9876543210'), true);
  assert.equal(isValidIndianMobile('5876543210'), false);
  assert.equal(isValidIndianMobile('12345'), false);
});

test('resolves custom skill when अन्य (खुद लिखें) is selected', () => {
  assert.equal(
    resolveSkill(CUSTOM_SKILL_OPTION, '  MIG वेल्डर  '),
    'MIG वेल्डर',
  );
  assert.equal(resolveSkill('फिटर (Pipe / Structural Fitter)', 'ignored'), 'फिटर (Pipe / Structural Fitter)');
});

test('enforces 6-hour live request and 7-day job post expiry windows', () => {
  const fiveHoursAgo = BASE_TIME - 5 * 60 * 60 * 1000;
  const sevenHoursAgo = BASE_TIME - 7 * 60 * 60 * 1000;
  assert.equal(isWithinHours(fiveHoursAgo, 6, BASE_TIME), true);
  assert.equal(isWithinHours(sevenHoursAgo, 6, BASE_TIME), false);

  const sixDaysAgo = BASE_TIME - 6 * 24 * 60 * 60 * 1000;
  const eightDaysAgo = BASE_TIME - 8 * 24 * 60 * 60 * 1000;
  assert.equal(isWithinHours(sixDaysAgo, 168, BASE_TIME), true);
  assert.equal(isWithinHours(eightDaysAgo, 168, BASE_TIME), false);
});

test('filters correctly between city and all_india modes', () => {
  assert.equal(
    matchesLocationFilter('Odisha', 'राउरकेला (Rourkela)', 'Odisha', 'राउरकेला (Rourkela)', 'city'),
    true,
  );
  assert.equal(
    matchesLocationFilter('Odisha', 'Rourkela', 'Odisha', 'राउरकेला (Rourkela)', 'city'),
    true,
  );
  assert.equal(
    matchesLocationFilter('Bihar', 'पटना (Patna)', 'Odisha', 'राउरकेला (Rourkela)', 'city'),
    false,
  );
  assert.equal(
    matchesLocationFilter('Bihar', 'पटना (Patna)', 'Odisha', 'राउरकेला (Rourkela)', 'all_india'),
    true,
  );
});

test('disables accept on contractor own request and shows full only when confirmedCount >= requiredCount', () => {
  const ownReq = makeLiveRequest({ contractorPhone: '9876543210' });
  const ownRes = canWorkerAcceptRequest(ownReq, '9876543210', BASE_TIME);
  assert.equal(ownRes.allowed, false);
  assert.equal(ownRes.isOwnRequest, true);
  assert.equal(ownRes.reason, 'यह आपकी अपनी रिक्वेस्ट है');

  const partialReq = makeLiveRequest({ confirmedCount: 2, requiredCount: 3 });
  assert.equal(canWorkerAcceptRequest(partialReq, '9123456789', BASE_TIME).allowed, true);

  const fullReq = makeLiveRequest({ confirmedCount: 3, requiredCount: 3 });
  const fullRes = canWorkerAcceptRequest(fullReq, '9123456789', BASE_TIME);
  assert.equal(fullRes.allowed, false);
  assert.equal(fullRes.isFull, true);
  assert.equal(fullRes.reason, 'सभी मजदूर पूरे हो चुके हैं');
});

test('computes accept transaction update without worker profile and strips undefined values', () => {
  const req = makeLiveRequest({ skill: 'गैस कटर' });
  const update = computeAcceptTransactionUpdate(
    req,
    { name: 'संतोष कुमार', phone: '9988776655' },
    null,
    BASE_TIME,
  );
  assert.equal(update.confirmedCount, 1);
  assert.deepEqual(update.acceptedPhones, ['9988776655']);
  assert.equal(update.acceptedWorkers[0].skill, 'गैस कटर');

  const cleaned = sanitizeForFirestore({ a: 1, b: undefined, nested: { c: undefined, d: 'ok' } });
  assert.deepEqual(cleaned, { a: 1, nested: { d: 'ok' } });
});

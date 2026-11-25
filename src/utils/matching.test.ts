import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildShareAppText,
  canWorkerAcceptRequest,
  cleanCityLabel,
  computeAcceptTransactionUpdate,
  isValidIndianMobile,
  isWithinHours,
  matchesDirectoryLocationFilter,
  matchesLocationFilter,
  normalizePhone,
  PUBLIC_APP_URL,
  resolveSkill,
  resolveTradesList,
  sanitizeForFirestore,
  splitTradesToSelection,
} from './matching';
import { CUSTOM_SKILL_OPTION, SKILLS_LIST } from '../data/constants';
import type { LiveRequest } from '../types';

const BASE_TIME = 1_760_000_000_000;

function makeLiveRequest(overrides: Partial<LiveRequest> = {}): LiveRequest {
  return {
    id: 'req-1',
    contractorName: 'Ramesh Contractor',
    contractorPhone: '9876543210',
    skill: 'MIG Welder',
    requiredCount: 3,
    confirmedCount: 0,
    dailyRate: 850,
    state: 'Odisha',
    city: 'Rourkela',
    siteAddress: 'Sector 19, Steel Plant Gate',
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

test('resolves custom skill when Other (Write Your Own) is selected', () => {
  assert.equal(
    resolveSkill(CUSTOM_SKILL_OPTION, '  TIG Welder  '),
    'TIG Welder',
  );
  assert.equal(resolveSkill('Pipe / Structure Fitter', 'ignored'), 'Pipe / Structure Fitter');
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

test('filters correctly between city and all_india modes and cleans legacy city labels', () => {
  assert.equal(cleanCityLabel('Rourkela'), 'Rourkela');
  assert.equal(
    matchesLocationFilter('Odisha', 'Rourkela', 'Odisha', 'Rourkela', 'city'),
    true,
  );
  assert.equal(
    matchesLocationFilter('Bihar', 'Patna', 'Odisha', 'Rourkela', 'city'),
    false,
  );
  assert.equal(
    matchesLocationFilter('Bihar', 'Patna', 'Odisha', 'Rourkela', 'all_india'),
    true,
  );
});

test('filters directory profiles by My City, All India, State, and City inputs', () => {
  assert.equal(
    matchesDirectoryLocationFilter({
      itemState: 'Odisha',
      itemCity: 'Rourkela',
      mode: 'city',
      selectedState: 'Odisha',
      selectedCity: 'Rourkela',
      filterState: 'ALL',
      filterCity: '',
    }),
    true,
  );
  assert.equal(
    matchesDirectoryLocationFilter({
      itemState: 'Gujarat',
      itemCity: 'Surat',
      mode: 'city',
      selectedState: 'Odisha',
      selectedCity: 'Rourkela',
      filterState: 'ALL',
      filterCity: '',
    }),
    false,
  );
  assert.equal(
    matchesDirectoryLocationFilter({
      itemState: 'Gujarat',
      itemCity: 'Surat',
      mode: 'all_india',
      selectedState: 'Odisha',
      selectedCity: 'Rourkela',
      filterState: 'Gujarat',
      filterCity: 'Surat',
    }),
    true,
  );
});

test('resolves and splits contractor multi-trade checkboxes including custom trade', () => {
  const trades = resolveTradesList(
    ['MIG Welder', CUSTOM_SKILL_OPTION],
    'Crane Operator',
  );
  assert.deepEqual(trades, ['MIG Welder', 'Crane Operator']);

  const parsed = splitTradesToSelection(trades, SKILLS_LIST);
  assert.deepEqual(parsed.selected, ['MIG Welder', CUSTOM_SKILL_OPTION]);
  assert.equal(parsed.custom, 'Crane Operator');
});

test('disables accept on contractor own request and shows full only when confirmedCount >= requiredCount', () => {
  const ownReq = makeLiveRequest({ contractorPhone: '9876543210' });
  const ownRes = canWorkerAcceptRequest(ownReq, '9876543210', BASE_TIME);
  assert.equal(ownRes.allowed, false);
  assert.equal(ownRes.isOwnRequest, true);
  assert.equal(ownRes.reason, 'This is your own request');

  const partialReq = makeLiveRequest({ confirmedCount: 2, requiredCount: 3 });
  assert.equal(canWorkerAcceptRequest(partialReq, '9123456789', BASE_TIME).allowed, true);

  const fullReq = makeLiveRequest({ confirmedCount: 3, requiredCount: 3 });
  const fullRes = canWorkerAcceptRequest(fullReq, '9123456789', BASE_TIME);
  assert.equal(fullRes.allowed, false);
  assert.equal(fullRes.isFull, true);
  assert.equal(fullRes.reason, 'All required workers have been confirmed');
});

test('computes accept transaction update without worker profile and strips undefined values', () => {
  const req = makeLiveRequest({ skill: 'Gas Cutter' });
  const update = computeAcceptTransactionUpdate(
    req,
    { name: 'Santosh Kumar', phone: '9988776655' },
    null,
    BASE_TIME,
  );
  assert.equal(update.confirmedCount, 1);
  assert.deepEqual(update.acceptedPhones, ['9988776655']);
  assert.equal(update.acceptedWorkers[0].skill, 'Gas Cutter');

  const cleaned = sanitizeForFirestore({ a: 1, b: undefined, nested: { c: undefined, d: 'ok' } });
  assert.deepEqual(cleaned, { a: 1, nested: { d: 'ok' } });
});

test('builds exact Share App message with PUBLIC_APP_URL on its own line', () => {
  const msg = buildShareAppText();
  assert.equal(PUBLIC_APP_URL, 'https://kaam-connect-2.ai.studio');
  assert.equal(
    msg,
    'Kaam Connect — Direct Work, Direct Contact (100% Free)\nWelder, Fitter, Rigger, Gas Cutter, Mason & Helper ke liye bina commission kaam payein ya bulayein.\n\nAbhi app kholein:\nhttps://kaam-connect-2.ai.studio',
  );
});

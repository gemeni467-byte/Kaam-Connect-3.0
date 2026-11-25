export const CUSTOM_SKILL_OPTION = 'Other (Write Your Own)';

export const SKILLS_LIST: string[] = [
  'MIG Welder',
  'Arc Welder',
  'Pipe / Structure Fitter',
  'Gas Cutter',
  'Rigger',
  'Mason (Rajmistri)',
  'Electrician',
  'Plumber',
  'Carpenter',
  'Painter',
  'Helper / Labour',
  CUSTOM_SKILL_OPTION,
];

export const INDIA_STATES: string[] = [
  'Odisha',
  'Bihar',
  'Jharkhand',
  'Uttar Pradesh',
  'Chhattisgarh',
  'West Bengal',
  'Maharashtra',
  'Gujarat',
  'Delhi NCR',
  'Tamil Nadu',
  'Karnataka',
  'Telangana',
  'Rajasthan',
  'Madhya Pradesh',
  'Other',
];

export const DEFAULT_STATE = 'Odisha';
export const DEFAULT_CITY = 'Rourkela';

export const QUICK_CITIES_BY_STATE: Record<string, string[]> = {
  Odisha: ['Rourkela', 'Angul', 'Jharsuguda', 'Bhubaneswar', 'Cuttack', 'Sambalpur'],
  Bihar: ['Bihar Sharif', 'Patna', 'Gaya', 'Muzaffarpur', 'Begusarai'],
  Jharkhand: ['Jamshedpur', 'Bokaro', 'Ranchi', 'Dhanbad'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi', 'Noida', 'Prayagraj'],
  Chhattisgarh: ['Raipur', 'Bhilai', 'Korba', 'Bilaspur'],
  'West Bengal': ['Kolkata', 'Durgapur', 'Haldia', 'Asansol'],
  Maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Thane'],
  Gujarat: ['Surat', 'Ahmedabad', 'Jamnagar', 'Vadodara'],
  'Delhi NCR': ['New Delhi', 'Gurugram', 'Faridabad', 'Ghaziabad'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Hosur'],
  Karnataka: ['Bengaluru', 'Hubballi', 'Mangaluru'],
  Telangana: ['Hyderabad', 'Warangal'],
  Rajasthan: ['Jaipur', 'Bhiwadi', 'Udaipur'],
  'Madhya Pradesh': ['Indore', 'Bhopal', 'Singrauli'],
  Other: ['Custom City'],
};

export const ALL_QUICK_CITY_SUGGESTIONS: Array<{ state: string; city: string }> = [
  { state: 'Odisha', city: 'Rourkela' },
  { state: 'Bihar', city: 'Bihar Sharif' },
  { state: 'Bihar', city: 'Patna' },
  { state: 'Jharkhand', city: 'Jamshedpur' },
  { state: 'Jharkhand', city: 'Bokaro' },
  { state: 'Chhattisgarh', city: 'Raipur' },
  { state: 'Odisha', city: 'Angul' },
  { state: 'Odisha', city: 'Jharsuguda' },
  { state: 'Gujarat', city: 'Surat' },
  { state: 'Maharashtra', city: 'Mumbai' },
  { state: 'Maharashtra', city: 'Pune' },
];

export const WORKER_COUNT_PRESETS: Array<{ label: string; value: number }> = [
  { label: '1 (Solo)', value: 1 },
  { label: '2', value: 2 },
  { label: '5', value: 5 },
  { label: '10', value: 10 },
  { label: '20', value: 20 },
];

export const WORKER_QUICK_CHATS: string[] = [
  'When does the work start?',
  'Are food and stay provided?',
  'I can reach the site tomorrow.',
  'Please share the exact site location.',
];

export const CONTRACTOR_QUICK_CHATS: string[] = [
  'Yes, please report at 8 AM tomorrow.',
  'Free food and stay are available at site.',
  'Please call when you reach the site gate.',
];

export const REPORT_REASONS: string[] = [
  'Fake job or misleading details',
  'Asking for money / advance / commission',
  'Phone number is wrong or unreachable',
  'Unfair wage or fraud',
  'Other issue',
];

export const LIVE_REQUEST_MAX_AGE_HOURS = 6;
export const JOB_POST_MAX_AGE_DAYS = 7;

export const USER_STORAGE_KEY = 'kaam_connect_user_v1';
export const LOCATION_STORAGE_KEY = 'kaam_connect_location_v1';

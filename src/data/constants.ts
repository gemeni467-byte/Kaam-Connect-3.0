export const CUSTOM_SKILL_OPTION = 'अन्य (खुद लिखें)';

export const SKILLS_LIST: string[] = [
  'सामान्य मजदूर (Helper)',
  'वेल्डर (Welder - Arc / MIG / TIG)',
  'फिटर (Pipe / Structural Fitter)',
  'रिगर (Rigger)',
  'गैस कटर (Gas Cutter)',
  'राजमिस्त्री (Mason)',
  'शटरिंग कारपेंटर (Shuttering Carpenter)',
  'सरिया बांधने वाला (Bar Bender)',
  'इलेक्ट्रीशियन (Electrician)',
  'प्लंबर (Plumber)',
  'पेंटर / पुट्टी (Painter)',
  'टाइल / मार्बल मिस्त्री (Tile Mason)',
  'क्रेन / जेसीबी ऑपरेटर (Operator)',
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
export const DEFAULT_CITY = 'राउरकेला (Rourkela)';

export const QUICK_CITIES_BY_STATE: Record<string, string[]> = {
  Odisha: ['राउरकेला (Rourkela)', 'अंगुल (Angul)', 'झारसुगुडा (Jharsuguda)', 'भुवनेश्वर (Bhubaneswar)', 'कटक (Cuttack)', 'संबलपुर (Sambalpur)'],
  Bihar: ['बिहार शरीफ (Bihar Sharif)', 'पटना (Patna)', 'गया (Gaya)', 'मुजफ्फरपुर (Muzaffarpur)', 'बेगूसराय (Begusarai)'],
  Jharkhand: ['जमशेदपुर (Jamshedpur)', 'बोकारो (Bokaro)', 'रांची (Ranchi)', 'धनबाद (Dhanbad)'],
  'Uttar Pradesh': ['लखनऊ (Lucknow)', 'कानपुर (Kanpur)', 'वाराणसी (Varanasi)', 'नोएडा (Noida)', 'प्रयागराज (Prayagraj)'],
  Chhattisgarh: ['रायपुर (Raipur)', 'भिलाई (Bhilai)', 'कोरबा (Korba)', 'बिलासपुर (Bilaspur)'],
  'West Bengal': ['कोलकाता (Kolkata)', 'दुर्गापुर (Durgapur)', 'हल्दिया (Haldia)', 'आसनसोल (Asansol)'],
  Maharashtra: ['मुंबई (Mumbai)', 'पुणे (Pune)', 'नागपुर (Nagpur)', 'ठाणे (Thane)'],
  Gujarat: ['सूरत (Surat)', 'अहमदाबाद (Ahmedabad)', 'जामनगर (Jamnagar)', 'वडोदरा (Vadodara)'],
  'Delhi NCR': ['नई दिल्ली (New Delhi)', 'गुड़गांव (Gurugram)', 'फरीदाबाद (Faridabad)', 'गाजियाबाद (Ghaziabad)'],
  'Tamil Nadu': ['चेन्नई (Chennai)', 'कोयंबटूर (Coimbatore)', 'होसूर (Hosur)'],
  Karnataka: ['बेंगलुरु (Bengaluru)', 'हुबली (Hubballi)', 'मंगलुरु (Mangaluru)'],
  Telangana: ['हैदराबाद (Hyderabad)', 'वारंगल (Warangal)'],
  Rajasthan: ['जयपुर (Jaipur)', 'भिवाड़ी (Bhiwadi)', 'उदयपुर (Udaipur)'],
  'Madhya Pradesh': ['इंदौर (Indore)', 'भोपाल (Bhopal)', 'सिंगरौली (Singrauli)'],
  Other: ['अन्य शहर (Custom City)'],
};

export const ALL_QUICK_CITY_SUGGESTIONS: Array<{ state: string; city: string }> = [
  { state: 'Odisha', city: 'राउरकेला (Rourkela)' },
  { state: 'Bihar', city: 'बिहार शरीफ (Bihar Sharif)' },
  { state: 'Bihar', city: 'पटना (Patna)' },
  { state: 'Jharkhand', city: 'जमशेदपुर (Jamshedpur)' },
  { state: 'Jharkhand', city: 'बोकारो (Bokaro)' },
  { state: 'Chhattisgarh', city: 'रायपुर (Raipur)' },
  { state: 'Odisha', city: 'अंगुल (Angul)' },
  { state: 'Odisha', city: 'झारसुगुडा (Jharsuguda)' },
  { state: 'Gujarat', city: 'सूरत (Surat)' },
  { state: 'Maharashtra', city: 'मुंबई (Mumbai)' },
  { state: 'Maharashtra', city: 'पुणे (Pune)' },
];

export const WORKER_COUNT_PRESETS: Array<{ label: string; value: number }> = [
  { label: '1 (Solo)', value: 1 },
  { label: '2', value: 2 },
  { label: '5', value: 5 },
  { label: '10', value: 10 },
  { label: '20', value: 20 },
];

export const WORKER_QUICK_CHATS: string[] = [
  'काम कब से शुरू है?',
  'रहना-खाना मिलेगा?',
  'मैं कल साइट पर पहुँच जाऊँगा',
];

export const CONTRACTOR_QUICK_CHATS: string[] = [
  'हाँ, कल सुबह 8 बजे आ जाएं',
  'रहना-खाना फ्री मिलेगा',
  'साइट पर आकर कॉल करें',
];

export const REPORT_REASONS: string[] = [
  'फर्जी काम / गलत जानकारी',
  'ठेकेदार / व्यक्ति पैसे मांग रहा है (कमीशन/एडवांस)',
  'फोन नंबर गलत या बंद है',
  'मजदूरी बहुत कम या धोखाधड़ी',
  'अन्य समस्या',
];

export const LIVE_REQUEST_MAX_AGE_HOURS = 6;
export const JOB_POST_MAX_AGE_DAYS = 7;

export const USER_STORAGE_KEY = 'kaam_connect_user_v1';
export const LOCATION_STORAGE_KEY = 'kaam_connect_location_v1';

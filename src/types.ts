export type ActiveTab = 'live' | 'workers' | 'contractors' | 'account';

export type LocationFilterMode = 'city' | 'all_india';

export type WorkerType = 'individual' | 'team_leader';

export interface UserAccount {
  name: string;
  phone: string;
  state: string;
  city: string;
  loggedInAt: number;
}

export interface FacilityFlags {
  stayFree: boolean;
  foodFree: boolean;
  travelAllowance: boolean;
}

export interface WorkerProfile {
  id: string;
  name: string;
  phone: string;
  skill: string;
  workerType: WorkerType;
  teamSize: number;
  outstationReady: boolean;
  dailyRate: number;
  state: string;
  city: string;
  experienceYears: number;
  isOnline: boolean;
  isAvailable: boolean;
  updatedAt: number;
  createdAt: number;
}

export interface ContractorProfile {
  id: string;
  name: string;
  companyName: string;
  phone: string;
  tradesHired: string[];
  state: string;
  city: string;
  facilities: FacilityFlags;
  isHiring: boolean;
  updatedAt: number;
  createdAt: number;
}

export interface AcceptedWorkerEntry {
  name: string;
  phone: string;
  skill: string;
  acceptedAt: number;
}

export interface QuickChatMessage {
  id: string;
  senderPhone: string;
  senderName: string;
  senderRole: 'worker' | 'contractor';
  text: string;
  createdAt: number;
}

export interface LiveRequest {
  id: string;
  contractorName: string;
  contractorPhone: string;
  skill: string;
  requiredCount: number;
  confirmedCount: number;
  dailyRate: number;
  state: string;
  city: string;
  siteAddress: string;
  facilities: FacilityFlags;
  status: 'open' | 'closed';
  acceptedWorkers: AcceptedWorkerEntry[];
  acceptedPhones: string[];
  messages: QuickChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface JobPost {
  id: string;
  contractorName: string;
  contractorPhone: string;
  skill: string;
  workersNeeded: number;
  dailyRate: number;
  state: string;
  city: string;
  siteAddress: string;
  description: string;
  facilities: FacilityFlags;
  status: 'open' | 'closed';
  createdAt: number;
  updatedAt: number;
}

export interface FraudReport {
  id?: string;
  targetType: 'live_request' | 'job' | 'worker' | 'contractor';
  targetId: string;
  targetName: string;
  targetPhone: string;
  reason: string;
  details: string;
  reporterPhone: string;
  reporterName: string;
  createdAt: number;
}

export type UserRole = 'patient' | 'doctor' | 'admin' | 'database';

export interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  password?: string;
  created_at: string;
  created_at_formatted?: string;
  last_login?: string;
  last_login_formatted?: string;
}

export interface ActivityLog {
  id: number;
  event_type: 'REGISTER' | 'LOGIN' | 'LOGOUT' | 'PASSWORD_RESET' | 'TOKEN_GENERATED' | 'TOKEN_CALLED' | 'TOKEN_COMPLETED' | 'TOKEN_STATUS_CHANGED' | 'DOCTOR_STATUS' | 'RESET';
  user_id?: number;
  user_name: string;
  user_role: string;
  details: string;
  date_time: string;
  created_at: string;
  ip_address?: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  room_number: string;
  floor: string;
  description: string;
  icon?: string;
}

export interface Doctor {
  id: number;
  user_id: number;
  department_id: number;
  full_name: string;
  email: string;
  phone: string;
  specialization: string;
  room_number: string;
  department_name: string;
  department_code: string;
  status: 'available' | 'busy' | 'offline';
}

export type TokenStatus = 'waiting' | 'calling' | 'in_consultation' | 'completed' | 'skipped' | 'cancelled';
export type TokenPriority = 'normal' | 'emergency';

export interface Token {
  id: number;
  token_number: string;
  patient_id: number;
  patient_name: string;
  patient_phone: string;
  department_id: number;
  department_name: string;
  doctor_id: number | null;
  doctor_name: string | null;
  room_number: string;
  priority: TokenPriority;
  symptoms: string;
  status: TokenStatus;
  created_at: string;
  created_at_formatted?: string;
  called_at: string | null;
  called_at_formatted?: string | null;
  completed_at: string | null;
  completed_at_formatted?: string | null;
}

export interface AdminStats {
  total_tokens: number;
  waiting_tokens: number;
  completed_tokens: number;
  calling_tokens: number;
  in_consultation_tokens: number;
  emergency_tokens: number;
  total_doctors: number;
  total_patients: number;
  total_users?: number;
  total_logs?: number;
}

export interface DatabaseOverview {
  users: User[];
  activity_logs: ActivityLog[];
  tokens: Token[];
  departments: Department[];
  doctors: Doctor[];
  stats: {
    total_users: number;
    total_logs: number;
    total_tokens: number;
    total_departments: number;
    total_doctors: number;
    last_activity_date_time: string;
  };
}

export interface SSEEventData {
  type: 'TOKEN_GENERATED' | 'TOKEN_CALLED' | 'TOKEN_STATUS_CHANGED' | 'QUEUE_RESET' | 'DOCTOR_UPDATED' | 'ACTIVITY_LOG' | 'USER_REGISTERED' | 'USER_LOGGED_IN' | 'PASSWORD_RESET';
  token?: Token;
  tokenId?: number;
  status?: TokenStatus;
  doctor?: Doctor;
  log?: ActivityLog;
  user?: User;
  timestamp?: string;
}

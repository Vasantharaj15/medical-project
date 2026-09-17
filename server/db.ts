import { User, Department, Doctor, Token, AdminStats, ActivityLog, DatabaseOverview } from '../src/types.js';

/**
 * Formats any timestamp into normal Indian Standard Time (IST)
 * Output example: 13/09/2026, 09:45:30 PM IST
 */
export function formatIndianDateTime(dateInput: Date | string | number = new Date()): string {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (!date || isNaN(date.getTime())) return '';

  try {
    const formatted = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(date);
    return `${formatted} IST`;
  } catch {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const ist = new Date(utc + (3600000 * 5.5));
    const day = pad(ist.getDate());
    const month = pad(ist.getMonth() + 1);
    const year = ist.getFullYear();
    let hours = ist.getHours();
    const minutes = pad(ist.getMinutes());
    const seconds = pad(ist.getSeconds());
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day}/${month}/${year}, ${pad(hours)}:${minutes}:${seconds} ${ampm} IST`;
  }
}

export const formatDateTime = formatIndianDateTime;

class HospitalDatabase {
  private users: User[] = [];
  private departments: Department[] = [];
  private doctors: Doctor[] = [];
  private tokens: Token[] = [];
  private activityLogs: ActivityLog[] = [];
  private tokenCounters: Record<string, number> = {};
  private nextUserId = 1;
  private nextTokenId = 1;
  private nextLogId = 1;

  constructor() {
    this.seed();
  }

  public logActivity(
    event_type: ActivityLog['event_type'],
    user_name: string,
    user_role: string,
    details: string,
    user_id?: number,
    ip_address?: string
  ): ActivityLog {
    const now = new Date();
    const log: ActivityLog = {
      id: this.nextLogId++,
      event_type,
      user_id,
      user_name: user_name || 'Anonymous User',
      user_role: user_role || 'guest',
      details,
      date_time: formatIndianDateTime(now),
      created_at: now.toISOString(),
      ip_address: ip_address || '127.0.0.1'
    };
    this.activityLogs.unshift(log); // Prepend so newest is first
    return log;
  }

  public seed() {
    this.users = [];
    this.departments = [];
    this.doctors = [];
    this.tokens = [];
    this.tokenCounters = {};
    this.nextUserId = 1;
    this.nextTokenId = 1;

    // 1. Departments
    this.departments = [
      {
        id: 1,
        name: 'General Medicine',
        code: 'GEN',
        room_number: 'Room 101',
        floor: 'Ground Floor, Wing A',
        description: 'Primary care, fevers, routine physicals, and acute illness diagnostics.'
      },
      {
        id: 2,
        name: 'Cardiology',
        code: 'CARD',
        room_number: 'Room 202',
        floor: '2nd Floor, Wing C',
        description: 'Heart disease diagnosis, hypertension, ECG, and vascular care.'
      },
      {
        id: 3,
        name: 'Pediatrics',
        code: 'PED',
        room_number: 'Room 105',
        floor: '1st Floor, Child Care Wing',
        description: 'Infant, child and adolescent health and immunizations.'
      },
      {
        id: 4,
        name: 'Orthopedics',
        code: 'ORTHO',
        room_number: 'Room 304',
        floor: '3rd Floor, Surgery & Trauma',
        description: 'Joint pain, fractures, spinal health, and musculoskeletal treatment.'
      },
      {
        id: 5,
        name: 'Dermatology',
        code: 'DERM',
        room_number: 'Room 215',
        floor: '2nd Floor, Wing B',
        description: 'Skin infections, allergic reactions, eczema, and dermatology checks.'
      },
      {
        id: 6,
        name: 'ENT (Otolaryngology)',
        code: 'ENT',
        room_number: 'Room 112',
        floor: '1st Floor, Wing A',
        description: 'Ear, nose, throat, sinusitis, and audiology consultations.'
      }
    ];

    // 2. Users (Hospital Staff: Admin and Clinical Doctors)
    const seedUsers: Array<Omit<User, 'id' | 'created_at'> & { password?: string }> = [
      // Admin
      { full_name: 'Administrator', email: 'admin@gmail.com', phone: '+91 98435-93154', role: 'admin', password: 'admin@15' },
      // Doctor (Primary on-duty physician)
      { full_name: 'Dr. Sarah Jenkins', email: 'doctor@gmail.com', phone: '+91 98435-93101', role: 'doctor', password: 'doctor@15' },
      // Clinical Staff Doctors
      { full_name: 'Dr. Alex Rivera', email: 'dr.alex@hospital.org', phone: '+91 98435-93102', role: 'doctor', password: 'doctor@15' },
      { full_name: 'Dr. Emily Chen', email: 'dr.emily@hospital.org', phone: '+91 98435-93103', role: 'doctor', password: 'doctor@15' },
      { full_name: 'Dr. Michael Chang', email: 'dr.michael@hospital.org', phone: '+91 98435-93104', role: 'doctor', password: 'doctor@15' }
    ];

    const now = new Date();
    seedUsers.forEach((u, i) => {
      const userCreatedDate = new Date(now.getTime() - 86400000 * (3 - i * 0.2));
      this.users.push({
        id: this.nextUserId++,
        full_name: u.full_name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        password: u.password || 'password123',
        created_at: userCreatedDate.toISOString(),
        created_at_formatted: formatIndianDateTime(userCreatedDate),
        last_login: null,
        last_login_formatted: null
      });
    });

    // Central activity logs - starts clean, records only actual user register and login actions with Date & Indian Time
    this.activityLogs = [];

    // 3. Doctors linking
    this.doctors = [
      {
        id: 1,
        user_id: 2, // Dr. Sarah Jenkins
        department_id: 1,
        full_name: 'Dr. Sarah Jenkins',
        email: 'doctor@gmail.com',
        phone: '+1 555-0101',
        specialization: 'Senior Physician & Internist',
        room_number: 'Room 101',
        department_name: 'General Medicine',
        department_code: 'GEN',
        status: 'available'
      },
      {
        id: 2,
        user_id: 3, // Dr. Alex Rivera
        department_id: 2,
        full_name: 'Dr. Alex Rivera',
        email: 'dr.alex@hospital.org',
        phone: '+91 98435-93102',
        specialization: 'Consultant Cardiologist',
        room_number: 'Room 202',
        department_name: 'Cardiology',
        department_code: 'CARD',
        status: 'available'
      },
      {
        id: 3,
        user_id: 4, // Dr. Emily Chen
        department_id: 3,
        full_name: 'Dr. Emily Chen',
        email: 'dr.emily@hospital.org',
        phone: '+91 98435-93103',
        specialization: 'Pediatric Specialist',
        room_number: 'Room 105',
        department_name: 'Pediatrics',
        department_code: 'PED',
        status: 'available'
      },
      {
        id: 4,
        user_id: 5, // Dr. Michael Chang
        department_id: 4,
        full_name: 'Dr. Michael Chang',
        email: 'dr.michael@hospital.org',
        phone: '+91 98435-93104',
        specialization: 'Orthopedic Surgeon',
        room_number: 'Room 304',
        department_name: 'Orthopedics',
        department_code: 'ORTHO',
        status: 'available'
      }
    ];

    // Initialize department counters
    this.departments.forEach(d => {
      this.tokenCounters[d.code] = 100;
    });

    // Tokens starts clean - only records entered patient token details
    this.tokens = [];
  }

  // --- Departments & Doctors ---
  public getDepartments(): Department[] {
    return [...this.departments];
  }

  public getDoctors(): Doctor[] {
    return [...this.doctors];
  }

  public updateDoctorStatus(doctorId: number, status: 'available' | 'busy' | 'offline'): Doctor | null {
    const doc = this.doctors.find(d => d.id === doctorId);
    if (!doc) return null;
    doc.status = status;
    return { ...doc };
  }

  // --- Users & Auth ---
  public registerUser(data: { full_name: string; email: string; phone?: string; password?: string; role?: string }): User {
    const existing = this.users.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const now = new Date();
    const formatted = formatIndianDateTime(now);

    const newUser: User = {
      id: this.nextUserId++,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || '',
      role: (data.role === 'doctor' || data.role === 'admin' || data.role === 'database') ? data.role : 'patient',
      password: data.password || 'pass123',
      created_at: now.toISOString(),
      created_at_formatted: formatted,
      last_login: now.toISOString(),
      last_login_formatted: formatted
    };
    this.users.push(newUser);

    // Save registration details in central database with Date and normal Indian time
    this.logActivity(
      'REGISTER',
      newUser.full_name,
      newUser.role,
      `Registered account: ${newUser.full_name} (${newUser.email}, ${newUser.phone || 'no phone'}) as ${newUser.role}`,
      newUser.id
    );

    return newUser;
  }

  public loginUser(email: string, password?: string, targetPortal?: string): { user: User; doctor?: Doctor } {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = (password || '').trim();

    const user = this.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      throw new Error('No registered account found with that email address. Please register first.');
    }

    // Secure password verification
    if (cleanPass && user.password && user.password !== cleanPass) {
      throw new Error('Invalid email or password. Please try again.');
    }

    // Role-based portal authorization check
    if (targetPortal === 'doctor' && user.role !== 'doctor' && user.role !== 'admin') {
      throw new Error('Access restricted: Selected account is not registered as a doctor.');
    } else if (targetPortal === 'admin' && user.role !== 'admin') {
      throw new Error('Access restricted: Selected account does not have administrator privileges.');
    }

    const now = new Date();
    const formatted = formatIndianDateTime(now);
    user.last_login = now.toISOString();
    user.last_login_formatted = formatted;

    let doctor: Doctor | undefined;
    if (user.role === 'doctor') {
      doctor = this.doctors.find(d => d.email.toLowerCase() === cleanEmail) ||
               this.doctors.find(d => d.user_id === user.id) || 
               this.doctors[0];
    }

    const portalName = user.role === 'doctor' ? 'Doctor Console' : 
                       user.role === 'admin' ? 'Admin Portal' : 
                       (targetPortal === 'database' || user.role === 'database') ? 'Database Portal' : 'Patient Desk';

    // Save login details in common database with Date and normal Indian time
    this.logActivity(
      'LOGIN',
      user.full_name,
      user.role,
      `User login: ${user.full_name} (${user.email}) accessed ${portalName}`,
      user.id
    );

    return { user, doctor };
  }

  public logoutUser(userId: number): void {
    const user = this.users.find(u => u.id === Number(userId));
    if (user) {
      this.logActivity(
        'LOGOUT',
        user.full_name,
        user.role,
        `User logged out from session`,
        user.id
      );
    }
  }

  public resetPassword(email: string, newPassword: string): { user: User; message: string } {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      throw new Error('No registered account found with that email address. Please register first.');
    }
    user.password = newPassword;
    const now = new Date();
    const formatted = formatDateTime(now);
    this.logActivity(
      'PASSWORD_RESET',
      user.full_name,
      user.role,
      `Password successfully reset and updated in database for account: ${user.email}`,
      user.id
    );
    return {
      user,
      message: `Password updated successfully in database at ${formatted}!`
    };
  }

  public getUsers(): User[] {
    return [...this.users];
  }

  public getActivityLogs(limit = 200): ActivityLog[] {
    return this.activityLogs.slice(0, limit);
  }

  public getDatabaseOverview(): DatabaseOverview {
    const nowStr = this.activityLogs[0]?.date_time || formatDateTime();
    return {
      users: [...this.users],
      activity_logs: [...this.activityLogs],
      tokens: [...this.tokens].sort((a, b) => b.id - a.id),
      departments: [...this.departments],
      doctors: [...this.doctors],
      stats: {
        total_users: this.users.length,
        total_logs: this.activityLogs.length,
        total_tokens: this.tokens.length,
        total_departments: this.departments.length,
        total_doctors: this.doctors.length,
        last_activity_date_time: nowStr
      }
    };
  }

  // --- Tokens ---
  public generateToken(data: {
    patient_id?: number;
    patient_name: string;
    patient_phone?: string;
    department_id: number;
    symptoms?: string;
    priority?: 'normal' | 'emergency';
  }): Token {
    const dept = this.departments.find(d => d.id === Number(data.department_id));
    if (!dept) {
      throw new Error(`Department not found with id ${data.department_id}`);
    }

    // Determine Patient ID: Only link to registered user if already registered in database
    let patientId = data.patient_id;
    if (!patientId) {
      const existing = this.users.find(
        u => (data.patient_phone && u.phone === data.patient_phone) || u.full_name.toLowerCase() === data.patient_name.toLowerCase()
      );
      if (existing) {
        patientId = existing.id;
      }
    }

    // Increment department token counter
    const currentCounter = (this.tokenCounters[dept.code] || 100) + 1;
    this.tokenCounters[dept.code] = currentCounter;
    const tokenNumber = `${dept.code}-${currentCounter}`;

    // Auto-assign available doctor if any
    const doc = this.doctors.find(d => d.department_id === dept.id && d.status !== 'offline') ||
                this.doctors.find(d => d.department_id === dept.id) || null;

    const now = new Date();
    const formatted = formatIndianDateTime(now);

    const newToken: Token = {
      id: this.nextTokenId++,
      token_number: tokenNumber,
      patient_id: patientId,
      patient_name: data.patient_name,
      patient_phone: data.patient_phone || '',
      department_id: dept.id,
      department_name: dept.name,
      doctor_id: doc ? doc.id : null,
      doctor_name: doc ? doc.full_name : null,
      room_number: dept.room_number,
      priority: data.priority === 'emergency' ? 'emergency' : 'normal',
      symptoms: data.symptoms || '',
      status: 'waiting',
      created_at: now.toISOString(),
      created_at_formatted: formatted,
      called_at: null,
      called_at_formatted: null,
      completed_at: null,
      completed_at_formatted: null
    };

    this.tokens.push(newToken);

    // Record token issue details commonly in database activity logs with Date and normal Indian time
    this.logActivity(
      'TOKEN_GENERATED',
      newToken.patient_name,
      'patient',
      `Issued Token ${newToken.token_number} | Dept: ${dept.name} (${dept.room_number}) | Priority: ${newToken.priority.toUpperCase()} | Phone: ${newToken.patient_phone || 'N/A'} | Symptoms: ${newToken.symptoms || 'General Checkup'}`,
      patientId
    );

    return newToken;
  }

  public getLiveTokens(): { calling: Token[]; waiting: Token[]; total_active: number } {
    const active = this.tokens.filter(t => ['waiting', 'calling', 'in_consultation'].includes(t.status));
    
    // Sort: Emergency first, then arrival time / id
    active.sort((a, b) => {
      if (a.priority === 'emergency' && b.priority !== 'emergency') return -1;
      if (a.priority !== 'emergency' && b.priority === 'emergency') return 1;
      return a.id - b.id;
    });

    const calling = active.filter(t => t.status === 'calling' || t.status === 'in_consultation');
    const waiting = active.filter(t => t.status === 'waiting');

    return {
      calling,
      waiting,
      total_active: active.length
    };
  }

  public getAllTokens(): Token[] {
    return [...this.tokens].sort((a, b) => b.id - a.id);
  }

  public searchTokens(query: string): Token[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return this.tokens.filter(t => 
      t.token_number.toLowerCase().includes(q) ||
      t.patient_name.toLowerCase().includes(q) ||
      t.patient_phone.toLowerCase().includes(q) ||
      t.department_name.toLowerCase().includes(q) ||
      t.room_number.toLowerCase().includes(q)
    ).sort((a, b) => b.id - a.id);
  }

  public getPatientTokens(patientId: number): Token[] {
    return this.tokens.filter(t => t.patient_id === Number(patientId)).sort((a, b) => b.id - a.id);
  }

  public getDoctorQueue(doctorId: number): Token[] {
    const doc = this.doctors.find(d => d.id === Number(doctorId));
    if (!doc) return [];

    const queue = this.tokens.filter(
      t => t.department_id === doc.department_id && ['waiting', 'calling', 'in_consultation'].includes(t.status)
    );

    // Prioritize emergency cases
    return queue.sort((a, b) => {
      if (a.priority === 'emergency' && b.priority !== 'emergency') return -1;
      if (a.priority !== 'emergency' && b.priority === 'emergency') return 1;
      return a.id - b.id;
    });
  }

  public callNextForDoctor(doctorId: number): Token | null {
    const doc = this.doctors.find(d => d.id === Number(doctorId));
    if (!doc) throw new Error('Doctor not found');

    const waiting = this.tokens.filter(
      t => t.department_id === doc.department_id && t.status === 'waiting'
    );

    if (waiting.length === 0) return null;

    // Sort emergency first, then by id
    waiting.sort((a, b) => {
      if (a.priority === 'emergency' && b.priority !== 'emergency') return -1;
      if (a.priority !== 'emergency' && b.priority === 'emergency') return 1;
      return a.id - b.id;
    });

    const nextToken = waiting[0];

    // Mark previous calling tokens of this doctor as in_consultation
    this.tokens.forEach(t => {
      if (t.doctor_id === doc.id && t.status === 'calling') {
        t.status = 'in_consultation';
      }
    });

    const now = new Date();
    nextToken.status = 'calling';
    nextToken.doctor_id = doc.id;
    nextToken.doctor_name = doc.full_name;
    nextToken.room_number = doc.room_number;
    nextToken.called_at = now.toISOString();
    nextToken.called_at_formatted = formatIndianDateTime(now);

    // Record in activity logs
    this.logActivity(
      'TOKEN_CALLED',
      doc.full_name,
      'doctor',
      `Doctor summoned Patient ${nextToken.patient_name} (Token: ${nextToken.token_number}) to ${doc.room_number}`,
      doc.user_id
    );

    return nextToken;
  }

  public callToken(tokenId: number, doctorId?: number): Token {
    const token = this.tokens.find(t => t.id === Number(tokenId));
    if (!token) throw new Error(`Token ${tokenId} not found`);

    let docName = 'Staff Doctor';
    if (doctorId) {
      const doc = this.doctors.find(d => d.id === Number(doctorId));
      if (doc) {
        token.doctor_id = doc.id;
        token.doctor_name = doc.full_name;
        token.room_number = doc.room_number;
        docName = doc.full_name;
      }
    }

    const now = new Date();
    token.status = 'calling';
    token.called_at = now.toISOString();
    token.called_at_formatted = formatIndianDateTime(now);

    this.logActivity(
      'TOKEN_CALLED',
      docName,
      'doctor',
      `Directly called Token ${token.token_number} (${token.patient_name}) to ${token.room_number}`,
      doctorId
    );

    return token;
  }

  public updateTokenStatus(tokenId: number, status: Token['status']): Token {
    const token = this.tokens.find(t => t.id === Number(tokenId));
    if (!token) throw new Error(`Token ${tokenId} not found`);

    token.status = status;
    if (status === 'completed') {
      const now = new Date();
      token.completed_at = now.toISOString();
      token.completed_at_formatted = formatIndianDateTime(now);
    }

    this.logActivity(
      status === 'completed' ? 'TOKEN_COMPLETED' : 'TOKEN_STATUS_CHANGED',
      token.doctor_name || 'Clinic Desk',
      'staff',
      `Token ${token.token_number} (${token.patient_name}) marked as ${status.replace('_', ' ').toUpperCase()}`,
      token.doctor_id || undefined
    );

    return token;
  }

  public getAdminStats(): AdminStats {
    const total_tokens = this.tokens.length;
    const waiting_tokens = this.tokens.filter(t => t.status === 'waiting').length;
    const completed_tokens = this.tokens.filter(t => t.status === 'completed').length;
    const calling_tokens = this.tokens.filter(t => t.status === 'calling').length;
    const in_consultation_tokens = this.tokens.filter(t => t.status === 'in_consultation').length;
    const emergency_tokens = this.tokens.filter(t => t.priority === 'emergency').length;
    const total_doctors = this.doctors.length;
    const total_patients = this.users.filter(u => u.role === 'patient').length;

    return {
      total_tokens,
      waiting_tokens,
      completed_tokens,
      calling_tokens,
      in_consultation_tokens,
      emergency_tokens,
      total_doctors,
      total_patients
    };
  }
}

export const db = new HospitalDatabase();

import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { db } from './server/db.js';
import { SSEEventData, TokenStatus } from './src/types.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// Server-Sent Events (SSE) Client Registry
interface SSEClient {
  id: number;
  res: Response;
}

let sseClients: SSEClient[] = [];

export function broadcastSSE(data: SSEEventData) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.res.write(payload);
    } catch {
      // client connection might be closed
    }
  });
}

// 1. Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'MediToken Hospital Management Server',
    timestamp: new Date().toISOString()
  });
});

// 2. Realtime SSE Stream
app.get('/api/events', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  const clientId = Date.now();
  const client = { id: clientId, res };
  sseClients.push(client);

  // Send initial connection handshake
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientId })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});

// 3. Departments
app.get('/api/departments', (req: Request, res: Response) => {
  try {
    const departments = db.getDepartments();
    res.json({ success: true, departments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Doctors
app.get('/api/doctors', (req: Request, res: Response) => {
  try {
    const doctors = db.getDoctors();
    res.json({ success: true, doctors });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Doctor Status
app.post('/api/doctors/:id/status', (req: Request, res: Response) => {
  try {
    const doctorId = parseInt(req.params.id, 10);
    const { status } = req.body;
    const updated = db.updateDoctorStatus(doctorId, status);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    broadcastSSE({ type: 'DOCTOR_UPDATED', doctor: updated });
    res.json({ success: true, doctor: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Auth: Login & Register & Logout
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { full_name, email, phone, role, password } = req.body;
    if (!full_name || !email) {
      return res.status(400).json({ success: false, message: 'Full name and email are required.' });
    }
    const user = db.registerUser({ full_name, email, phone, role, password });
    broadcastSSE({ type: 'USER_REGISTERED', user });
    res.json({
      success: true,
      user,
      message: `Account registered successfully! Activity report recorded in database at ${user.created_at_formatted}.`
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password, targetPortal } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required to log in.' });
    }
    const { user, doctor } = db.loginUser(email, password, targetPortal);
    broadcastSSE({ type: 'USER_LOGGED_IN', user, doctor });
    res.json({
      success: true,
      user,
      doctor,
      message: `Login successful! Activity report saved in database at ${user.last_login_formatted}.`
    });
  } catch (error: any) {
    res.status(401).json({ success: false, message: error.message });
  }
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  try {
    const { user_id } = req.body;
    if (user_id) {
      db.logoutUser(Number(user_id));
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  try {
    const { email, new_password } = req.body;
    if (!email || !new_password) {
      return res.status(400).json({ success: false, message: 'Registered email and new password are required.' });
    }
    const result = db.resetPassword(email, new_password);
    broadcastSSE({ type: 'PASSWORD_RESET', user: result.user });
    res.json({
      success: true,
      message: result.message,
      user: result.user
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Users List
app.get('/api/users', (req: Request, res: Response) => {
  try {
    const users = db.getUsers();
    res.json({ success: true, users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Database Portal Records & Audit Logs
app.get('/api/database/overview', (req: Request, res: Response) => {
  try {
    const overview = db.getDatabaseOverview();
    res.json({ success: true, ...overview });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/database/logs', (req: Request, res: Response) => {
  try {
    const logs = db.getActivityLogs();
    res.json({ success: true, logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. Token Generation
app.post('/api/tokens/generate', (req: Request, res: Response) => {
  try {
    const { patient_id, patient_name, patient_phone, department_id, symptoms, priority } = req.body;
    if (!patient_name || !department_id) {
      return res.status(400).json({ success: false, message: 'Patient name and department are required.' });
    }

    const token = db.generateToken({
      patient_id: patient_id ? Number(patient_id) : undefined,
      patient_name,
      patient_phone,
      department_id: Number(department_id),
      symptoms,
      priority
    });

    broadcastSSE({ type: 'TOKEN_GENERATED', token });
    res.json({ success: true, message: 'Token generated successfully!', token });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 7. Live Queue Tokens (Calling & Waiting)
app.get('/api/tokens/live', (req: Request, res: Response) => {
  try {
    const live = db.getLiveTokens();
    res.json({ success: true, ...live });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 8. Search Tokens
app.get('/api/tokens/search', (req: Request, res: Response) => {
  try {
    const query = String(req.query.q || '');
    if (!query.trim()) {
      return res.status(400).json({ success: false, message: 'Search parameter q is required.' });
    }
    const tokens = db.searchTokens(query);
    res.json({ success: true, tokens });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 9. Tokens for a specific patient
app.get('/api/tokens/patient/:id', (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.id, 10);
    const tokens = db.getPatientTokens(patientId);
    res.json({ success: true, tokens });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 10. Doctor Specific Queue
app.get('/api/tokens/doctor-queue/:doctorId', (req: Request, res: Response) => {
  try {
    const doctorId = parseInt(req.params.doctorId, 10);
    const queue = db.getDoctorQueue(doctorId);
    res.json({ success: true, queue });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 11. Doctor Calls Next Patient
app.post('/api/doctors/:doctorId/call-next', (req: Request, res: Response) => {
  try {
    const doctorId = parseInt(req.params.doctorId, 10);
    const token = db.callNextForDoctor(doctorId);
    if (!token) {
      return res.status(404).json({ success: false, message: 'No waiting patients in this department.' });
    }
    broadcastSSE({ type: 'TOKEN_CALLED', token });
    res.json({ success: true, message: `Calling token ${token.token_number}`, token });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 12. Call Specific Token
app.post('/api/tokens/:id/call', (req: Request, res: Response) => {
  try {
    const tokenId = parseInt(req.params.id, 10);
    const { doctor_id } = req.body;
    const token = db.callToken(tokenId, doctor_id ? Number(doctor_id) : undefined);
    broadcastSSE({ type: 'TOKEN_CALLED', token });
    res.json({ success: true, message: `Token ${token.token_number} called`, token });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 13. Update Token Status
app.post('/api/tokens/:id/status', (req: Request, res: Response) => {
  try {
    const tokenId = parseInt(req.params.id, 10);
    const { status } = req.body as { status: TokenStatus };
    const token = db.updateTokenStatus(tokenId, status);
    broadcastSSE({ type: 'TOKEN_STATUS_CHANGED', tokenId, status, token });
    res.json({ success: true, message: `Status updated to ${status}`, token });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 14. Admin All Tokens
app.get('/api/tokens/all', (req: Request, res: Response) => {
  try {
    const tokens = db.getAllTokens();
    res.json({ success: true, tokens });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 15. Admin Stats
app.get('/api/admin/stats', (req: Request, res: Response) => {
  try {
    const stats = db.getAdminStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 16. Admin Reset / Re-seed Queue
app.post('/api/admin/reset', (req: Request, res: Response) => {
  try {
    db.seed();
    broadcastSSE({ type: 'QUEUE_RESET' });
    res.json({ success: true, message: 'Hospital queues and counters reset to initial demo state.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 17. AI Smart Triage Assistant
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

app.post('/api/triage', async (req: Request, res: Response) => {
  const { symptoms, patientAge } = req.body;
  if (!symptoms || typeof symptoms !== 'string') {
    return res.status(400).json({ success: false, message: 'Symptoms description is required.' });
  }

  // Fallback heuristic rules
  const lower = symptoms.toLowerCase();
  let recommendedDeptId = 1; // General Medicine
  let suggestedPriority: 'normal' | 'emergency' = 'normal';
  let reasoning = 'General health assessment and initial diagnostic triage.';

  if (
    lower.includes('chest pain') ||
    lower.includes('heart') ||
    lower.includes('palpitation') ||
    lower.includes('shortness of breath') ||
    lower.includes('left arm numb') ||
    lower.includes('cardiac')
  ) {
    recommendedDeptId = 2; // Cardiology
    suggestedPriority = 'emergency';
    reasoning = 'Cardiac symptoms detected. Immediate evaluation recommended by Cardiology.';
  } else if (
    lower.includes('child') ||
    lower.includes('baby') ||
    lower.includes('infant') ||
    lower.includes('toddler') ||
    (patientAge && Number(patientAge) < 16)
  ) {
    recommendedDeptId = 3; // Pediatrics
    reasoning = 'Patient meets pediatric criteria for specialized child care.';
  } else if (
    lower.includes('bone') ||
    lower.includes('fracture') ||
    lower.includes('joint') ||
    lower.includes('knee') ||
    lower.includes('ankle') ||
    lower.includes('sprain') ||
    lower.includes('back pain')
  ) {
    recommendedDeptId = 4; // Orthopedics
    reasoning = 'Musculoskeletal or joint injury detected. Routing to Orthopedics.';
  } else if (
    lower.includes('rash') ||
    lower.includes('skin') ||
    lower.includes('itching') ||
    lower.includes('acne') ||
    lower.includes('eczema')
  ) {
    recommendedDeptId = 5; // Dermatology
    reasoning = 'Dermatological symptoms detected.';
  } else if (
    lower.includes('ear') ||
    lower.includes('nose') ||
    lower.includes('throat') ||
    lower.includes('sinus') ||
    lower.includes('hearing') ||
    lower.includes('tonsil')
  ) {
    recommendedDeptId = 6; // ENT
    reasoning = 'Ear, nose, or throat symptoms detected.';
  }

  // Try Gemini AI if available
  const ai = getAI();
  if (ai) {
    try {
      const prompt = `You are a clinical hospital triage AI assistant. Given patient symptoms, categorize into the best department and determine if it requires emergency priority.
Departments available:
1: General Medicine
2: Cardiology
3: Pediatrics
4: Orthopedics
5: Dermatology
6: ENT (Otolaryngology)

Symptoms: "${symptoms}"
Patient Age: "${patientAge || 'Adult'}"

Respond in JSON only with format:
{
  "departmentId": number (1 to 6),
  "priority": "normal" | "emergency",
  "reasoning": "brief 1-2 sentence medical justification",
  "firstAidTip": "brief 1 sentence immediate recommendation for waiting room"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return res.json({
          success: true,
          aiPowered: true,
          departmentId: parsed.departmentId || recommendedDeptId,
          priority: parsed.priority || suggestedPriority,
          reasoning: parsed.reasoning || reasoning,
          firstAidTip: parsed.firstAidTip || 'Please remain seated in the designated waiting area until your token is called.'
        });
      }
    } catch {
      // Fallback to heuristic
    }
  }

  return res.json({
    success: true,
    aiPowered: false,
    departmentId: recommendedDeptId,
    priority: suggestedPriority,
    reasoning,
    firstAidTip: suggestedPriority === 'emergency'
      ? 'Please notify the triage nurse at reception immediately.'
      : 'Please take a seat in the waiting lounge. You will hear an audio announcement when called.'
  });
});

// Vite Middleware / Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=================================================`);
    console.log(` MediToken Hospital Management Server running on port ${PORT}`);
    console.log(` Local URL: http://localhost:${PORT}`);
    console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=================================================`);
  });
}

startServer();

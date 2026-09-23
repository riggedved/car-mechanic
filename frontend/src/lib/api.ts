const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export interface UploadedMedia {
  id: string;
  file?: string;
  file_url: string;
  file_type: 'image' | 'audio' | 'video' | 'other';
  original_name: string;
  file_size: number;
  ai_analysis?: string;
  uploaded_at: string;
}

export interface ChatMessage {
  id: string;
  session: string;
  sender: 'user' | 'mechanic';
  message: string;
  media?: string;
  media_detail?: UploadedMedia;
  is_ai_generated: boolean;
  created_at: string;
}

export interface RecommendedService {
  name: string;
  estimated_cost: string;
  urgency: string;
}

export interface Diagnosis {
  id: string;
  session: string;
  issue_title: string;
  summary: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  probable_causes: string[];
  recommended_services: RecommendedService[];
  safety_warning: string;
  estimated_cost_range: string;
  ai_generated: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  booking_code: string;
  diagnosis?: string;
  diagnosis_detail?: Diagnosis;
  session?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  vehicle_info: string;
  service_requested: string;
  preferred_date: string;
  preferred_time_slot: string;
  customer_notes?: string;
  status: 'CONFIRMED' | 'PENDING' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
}

export interface VehicleInfo {
  year?: string;
  make?: string;
  model?: string;
  mileage?: string;
}

export function resolveMediaUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = API_BASE_URL.replace(/\/$/, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${base}${path}`;
}

export interface SessionHistoryResponse {
  id: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: string;
  vehicle_mileage: string;
  current_issue: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
  diagnoses: Diagnosis[];
  media_uploads: UploadedMedia[];
  bookings: Booking[];
}

export async function sendChatMessage(
  sessionId: string | null,
  message: string,
  mediaId?: string,
  vehicleInfo?: VehicleInfo
): Promise<{
  session_id: string;
  user_message: ChatMessage;
  mechanic_message: ChatMessage;
  vehicle_info: VehicleInfo;
  is_ai_generated: boolean;
}> {
  const payload: Record<string, any> = { message };
  if (sessionId) payload.session_id = sessionId;
  if (mediaId) payload.media_id = mediaId;
  if (vehicleInfo?.make) payload.vehicle_make = vehicleInfo.make;
  if (vehicleInfo?.model) payload.vehicle_model = vehicleInfo.model;
  if (vehicleInfo?.year) payload.vehicle_year = vehicleInfo.year;
  if (vehicleInfo?.mileage) payload.vehicle_mileage = vehicleInfo.mileage;

  const res = await fetch(`${API_BASE_URL}/api/chat/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to send message.');
  }

  return res.json();
}

export async function uploadMediaFile(
  file: File,
  sessionId?: string | null
): Promise<{ message: string; media: UploadedMedia }> {
  const formData = new FormData();
  formData.append('file', file);
  if (sessionId) formData.append('session_id', sessionId);

  const res = await fetch(`${API_BASE_URL}/api/upload/`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to upload media.');
  }

  return res.json();
}

export async function requestDiagnosis(
  sessionId: string,
  symptoms?: string[]
): Promise<Diagnosis> {
  const res = await fetch(`${API_BASE_URL}/api/diagnosis/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, symptoms: symptoms || [] }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate diagnosis.');
  }

  return res.json();
}

export async function createBooking(
  bookingData: Partial<Booking>
): Promise<Booking> {
  const res = await fetch(`${API_BASE_URL}/api/booking/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    let errorMsg = errorData.error;
    if (!errorMsg && typeof errorData === 'object' && Object.keys(errorData).length > 0) {
      errorMsg = Object.entries(errorData)
        .map(([k, v]) => `${k.replace('_', ' ')}: ${Array.isArray(v) ? v.join(' ') : v}`)
        .join('; ');
    }
    throw new Error(errorMsg || 'Failed to create booking.');
  }

  return res.json();
}

export async function getBookings(sessionId?: string): Promise<Booking[]> {
  const url = sessionId
    ? `${API_BASE_URL}/api/booking/?session_id=${encodeURIComponent(sessionId)}`
    : `${API_BASE_URL}/api/booking/`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch bookings.');
  }
  return res.json();
}

export async function getBooking(idOrCode: string): Promise<Booking> {
  const res = await fetch(`${API_BASE_URL}/api/booking/${idOrCode}/`);
  if (!res.ok) {
    throw new Error('Booking not found.');
  }
  return res.json();
}

export async function getSessionHistory(sessionId: string): Promise<SessionHistoryResponse> {
  const res = await fetch(`${API_BASE_URL}/api/history/${sessionId}/`);
  if (!res.ok) {
    throw new Error('Failed to fetch session history.');
  }
  return res.json();
}

export async function updateSessionVehicle(sessionId: string, vehicle: VehicleInfo): Promise<SessionHistoryResponse> {
  const res = await fetch(`${API_BASE_URL}/api/history/${sessionId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vehicle_make: vehicle.make || '',
      vehicle_model: vehicle.model || '',
      vehicle_year: vehicle.year || '',
      vehicle_mileage: vehicle.mileage || '',
    }),
  });
  if (!res.ok) {
    throw new Error('Failed to update vehicle profile.');
  }
  return res.json();
}

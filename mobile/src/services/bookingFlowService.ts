import { buildAuthHeaders } from './authService';
import { PublicService, Vehicle } from './dashboardService';

const API_BASE = 'http://localhost:5000/api';

interface BookingPayload {
  customer: string;
  vehicle: string;
  services: string[];
  bookingDate: string;
  preferredTime: string;
  pickupRequired: boolean;
  address: string;
  notes?: string;
}

export interface CreatedBooking {
  _id: string;
  bookingId: string;
  status: string;
  bookingDate: string;
  preferredTime: string;
  vehicle?: string;
  services?: string[];
}

const parsePayload = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

export const fetchServicesForDetails = async (): Promise<PublicService[]> => {
  const response = await fetch(`${API_BASE}/services/public`);
  if (!response.ok) return [];
  const payload = await parsePayload(response);
  return payload.data ?? [];
};

export const fetchVehiclesForBooking = async (): Promise<Vehicle[]> => {
  const response = await fetch(`${API_BASE}/vehicles`);
  if (!response.ok) return [];
  const payload = await parsePayload(response);
  return payload.data ?? [];
};

export const getCurrentCustomerId = async (): Promise<string> => {
  const authHeaders = await buildAuthHeaders();
  const response = await fetch(`${API_BASE}/auth/profile`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
  });
  const payload = await parsePayload(response);
  if (!response.ok || !payload?.data?._id) {
    throw new Error(payload?.message || 'Unable to resolve customer profile');
  }
  return payload.data._id as string;
};

export const createBookingRequest = async (payload: BookingPayload): Promise<CreatedBooking> => {
  const authHeaders = await buildAuthHeaders();
  const response = await fetch(`${API_BASE}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify(payload),
  });
  const body = await parsePayload(response);
  if (!response.ok) {
    throw new Error(body?.message || 'Unable to create booking');
  }
  return body.data as CreatedBooking;
};

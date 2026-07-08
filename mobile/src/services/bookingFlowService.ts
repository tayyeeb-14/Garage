import { fetchWithAuth } from './authService';
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
    // NOTE: On some RN runtimes, `response.json()` can be flaky/hang with certain error responses.
    // Using text->JSON keeps error handling reliable and lets us log raw bodies.
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
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
  const response = await fetchWithAuth(`${API_BASE}/auth/profile`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const payload = await parsePayload(response);
  if (!response.ok || !payload?.data?._id) {
    throw new Error(payload?.message || 'Unable to resolve customer profile');
  }
  return payload.data._id as string;
};

export const createBookingRequest = async (payload: BookingPayload): Promise<CreatedBooking> => {
  console.log('[bookingFlow] createBookingRequest() called', {
    payloadBookingDate: payload.bookingDate,
    preferredTime: payload.preferredTime,
  });
  const response = await fetchWithAuth(`${API_BASE}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  console.log('[bookingFlow] createBookingRequest() after fetch', { status: response.status });
  const body = await parsePayload(response);
  console.log('[bookingFlow] createBookingRequest() response body', body);
  if (!response.ok) {
    throw new Error(body?.message || 'Unable to create booking');
  }
  return body.data as CreatedBooking;
};

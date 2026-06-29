// Frontend API helper with typed fetch wrappers

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      msg = data.error || data.message || msg;
    } catch {
      // ignore
    }
    // On 401, clear stale session and reload to landing
    if (res.status === 401 && typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "mess-app-store",
          JSON.stringify({ state: { user: null, view: "landing" }, version: 0 })
        );
      } catch {
        // ignore
      }
      // Reload to trigger clean bootstrap
      if (!url.includes("/api/auth/me")) {
        window.location.reload();
      }
    }
    throw new ApiError(msg, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface MessListItem {
  id: string;
  code: string;
  name: string;
  type: string;
  address: string;
  area: string;
  city: string;
  lat: number;
  lng: number;
  rentPerSeat: number;
  contactNumber: string;
  photos: string[];
  amenities: string[];
  totalSeats: number;
  vacantSeats: number;
  totalRooms: number;
  description: string | null;
  ownerName: string;
}

export interface MessDetail extends MessListItem {
  rooms: {
    id: string;
    roomNumber: string;
    capacity: number;
    seats: {
      id: string;
      seatNumber: string;
      status: string;
      memberName: string | null;
    }[];
  }[];
  bookingsCount: number;
}

export function parseJSON<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

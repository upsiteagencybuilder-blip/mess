/**
 * Haversine distance between two lat/lng points in kilometers.
 */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Format a distance in km nicely. */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} মিটার`;
  }
  if (km < 10) {
    return `${km.toFixed(1)} কিমি`;
  }
  return `${Math.round(km)} কিমি`;
}

/** Default center: Rajshahi University (verified via OpenStreetMap). */
export const DEFAULT_CENTER = { lat: 24.3714, lng: 88.6422 };

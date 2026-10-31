// Google Distance Matrix API utility for fare calculation
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export interface DistanceResult {
  distanceKm: number;
  durationMinutes: number;
  distanceText: string;
  durationText: string;
}

/**
 * Calculate driving distance between two addresses using Google Distance Matrix API
 * Only used for fare calculation – no live tracking.
 */
export async function calculateDrivingDistance(
  origin: string,
  destination: string,
): Promise<DistanceResult | null> {
  if (!origin || !destination || !GOOGLE_MAPS_API_KEY) return null;

  try {
    const url = `/api/distance?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

/**
 * Server-side: calls Google Distance Matrix API directly
 */
export async function calculateDrivingDistanceServer(
  origin: string,
  destination: string,
): Promise<DistanceResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';
  if (!apiKey || !origin || !destination) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&mode=driving&units=metric&key=${apiKey}`;
    const res = await fetch(url);
    const json = await res.json();

    const row = json.rows?.[0]?.elements?.[0];
    if (!row || row.status !== 'OK') return null;

    return {
      distanceKm: row.distance.value / 1000,
      durationMinutes: Math.round(row.duration.value / 60),
      distanceText: row.distance.text,
      durationText: row.duration.text,
    };
  } catch {
    return null;
  }
}

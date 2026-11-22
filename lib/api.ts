import { EarthquakeEvent, IssTelemetry } from "@/lib/types";
import { FALLBACK_EARTHQUAKES } from "@/data/routes";

const USGS_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson";
const ISS_URL = "https://api.wheretheiss.at/v1/satellites/25544";
const TIMEOUT_MS = 8000;
const ISS_TIMEOUT_MS = 6000;

interface UsgsFeature {
  id: string;
  properties: {
    mag: number | null;
    place: string | null;
    time: number;
    url: string | null;
    tsunami: number | null;
    magType: string | null;
  };
  geometry: {
    coordinates: [number, number, number];
  };
}

interface UsgsResponse {
  features: UsgsFeature[];
}

interface IssApiResponse {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  visibility: string;
  timestamp: number;
}

const fetchWithTimeout = async (url: string, timeoutMs: number): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const fetchEarthquakes = async (): Promise<{ data: EarthquakeEvent[]; isFallback: boolean }> => {
  try {
    const res = await fetchWithTimeout(USGS_URL, TIMEOUT_MS);
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    const json = (await res.json()) as UsgsResponse;
    if (!json.features || !Array.isArray(json.features) || json.features.length === 0) {
      return { data: FALLBACK_EARTHQUAKES, isFallback: true };
    }

    const events: EarthquakeEvent[] = [];
    for (const f of json.features) {
      if (!f.geometry || !Array.isArray(f.geometry.coordinates)) continue;
      const [lon, lat, depth] = f.geometry.coordinates;
      if (typeof lat !== "number" || typeof lon !== "number") continue;

      events.push({
        id: f.id || `eq-${Math.random().toString(36).substring(2, 9)}`,
        mag: f.properties.mag ?? 0,
        place: f.properties.place || "Unknown Location",
        time: f.properties.time || Date.now(),
        url: f.properties.url || "https://earthquake.usgs.gov",
        depth: depth ?? 0,
        lat,
        lon,
        tsunami: f.properties.tsunami ?? 0,
        magnitudeType: f.properties.magType || "mw"
      });
    }

    // Sort newest first
    events.sort((a, b) => b.time - a.time);

    // Limit to max 180 events
    return { data: events.slice(0, 180), isFallback: false };
  } catch (err: unknown) {
    console.warn("fetchEarthquakes failed, using fallback:", err);
    return { data: FALLBACK_EARTHQUAKES, isFallback: true };
  }
};

export const fetchIssTelemetry = async (): Promise<{ data: IssTelemetry; isFallback: boolean }> => {
  try {
    const res = await fetchWithTimeout(ISS_URL, ISS_TIMEOUT_MS);
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    const json = (await res.json()) as IssApiResponse;
    if (typeof json.latitude !== "number" || typeof json.longitude !== "number") {
      throw new Error("Invalid ISS telemetry format");
    }

    return {
      data: {
        latitude: json.latitude,
        longitude: json.longitude,
        altitude: json.altitude ?? 420.0,
        velocity: json.velocity ?? 27600.0,
        visibility: json.visibility || "daylight",
        timestamp: json.timestamp ? json.timestamp * 1000 : Date.now()
      },
      isFallback: false
    };
  } catch (err: unknown) {
    console.warn("fetchIssTelemetry failed, generating orbital simulation:", err);
    // Smooth orbit simulation based on timestamp
    const nowSec = Date.now() / 1000;
    // Orbital period ~ 92 minutes = 5520 seconds
    const orbitAngle = (nowSec % 5520) / 5520 * (Math.PI * 2);
    // ISS orbital inclination ~ 51.6 degrees
    const lat = Math.sin(orbitAngle) * 51.6;
    const lon = ((nowSec * 0.065) % 360) - 180;

    return {
      data: {
        latitude: lat,
        longitude: lon,
        altitude: 418.5 + Math.sin(orbitAngle * 2) * 3,
        velocity: 27580.0,
        visibility: Math.sin(orbitAngle) > 0 ? "daylight" : "eclipsed",
        timestamp: Date.now()
      },
      isFallback: true
    };
  }
};

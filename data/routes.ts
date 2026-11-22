import { HubCity, ArcRoute, EarthquakeEvent, IssTelemetry } from "@/lib/types";

export const HUB_CITIES: HubCity[] = [
  { id: "jakarta", name: "Jakarta", country: "Indonesia", lat: -6.2088, lon: 106.8458, timezone: "UTC+7" },
  { id: "singapore", name: "Singapore", country: "Singapore", lat: 1.3521, lon: 103.8198, timezone: "UTC+8" },
  { id: "tokyo", name: "Tokyo", country: "Japan", lat: 35.6895, lon: 139.6917, timezone: "UTC+9" },
  { id: "sydney", name: "Sydney", country: "Australia", lat: -33.8688, lon: 151.2093, timezone: "UTC+10" },
  { id: "dubai", name: "Dubai", country: "UAE", lat: 25.2048, lon: 55.2708, timezone: "UTC+4" },
  { id: "london", name: "London", country: "UK", lat: 51.5074, lon: -0.1278, timezone: "UTC+0" },
  { id: "frankfurt", name: "Frankfurt", country: "Germany", lat: 50.1109, lon: 8.6821, timezone: "UTC+1" },
  { id: "newyork", name: "New York", country: "USA", lat: 40.7128, lon: -74.0060, timezone: "UTC-5" },
  { id: "sanfrancisco", name: "San Francisco", country: "USA", lat: 37.7749, lon: -122.4194, timezone: "UTC-8" },
  { id: "saopaulo", name: "São Paulo", country: "Brazil", lat: -23.5505, lon: -46.6333, timezone: "UTC-3" }
];

export const ARC_ROUTES: ArcRoute[] = [
  { id: "jakarta-singapore", fromHubId: "jakarta", toHubId: "singapore", volume: 8 },
  { id: "singapore-tokyo", fromHubId: "singapore", toHubId: "tokyo", volume: 6 },
  { id: "tokyo-sydney", fromHubId: "tokyo", toHubId: "sydney", volume: 4 },
  { id: "sydney-dubai", fromHubId: "sydney", toHubId: "dubai", volume: 5 },
  { id: "dubai-london", fromHubId: "dubai", toHubId: "london", volume: 7 },
  { id: "london-frankfurt", fromHubId: "london", toHubId: "frankfurt", volume: 6 },
  { id: "frankfurt-newyork", fromHubId: "frankfurt", toHubId: "newyork", volume: 9 },
  { id: "newyork-sanfrancisco", fromHubId: "newyork", toHubId: "sanfrancisco", volume: 8 },
  { id: "sanfrancisco-saopaulo", fromHubId: "sanfrancisco", toHubId: "saopaulo", volume: 5 },
  { id: "saopaulo-jakarta", fromHubId: "saopaulo", toHubId: "jakarta", volume: 4 },
  { id: "jakarta-tokyo", fromHubId: "jakarta", toHubId: "tokyo", volume: 5 },
  { id: "tokyo-newyork", fromHubId: "tokyo", toHubId: "newyork", volume: 7 }
];

export const FALLBACK_EARTHQUAKES: EarthquakeEvent[] = [
  {
    id: "id-001",
    mag: 6.2,
    place: "Sumatra, Indonesia",
    time: Date.now() - 3600000 * 2,
    url: "https://earthquake.usgs.gov",
    depth: 45.2,
    lat: -0.5,
    lon: 100.5,
    tsunami: 0,
    magnitudeType: "mww"
  },
  {
    id: "id-002",
    mag: 5.4,
    place: "Java, Indonesia",
    time: Date.now() - 3600000 * 5,
    url: "https://earthquake.usgs.gov",
    depth: 85.3,
    lat: -7.5,
    lon: 107.5,
    tsunami: 0,
    magnitudeType: "mwb"
  },
  {
    id: "id-003",
    mag: 5.8,
    place: "Honshu, Japan",
    time: Date.now() - 3600000 * 8,
    url: "https://earthquake.usgs.gov",
    depth: 32.0,
    lat: 36.5,
    lon: 141.0,
    tsunami: 0,
    magnitudeType: "mww"
  },
  {
    id: "id-004",
    mag: 4.8,
    place: "South of Fiji Islands",
    time: Date.now() - 3600000 * 11,
    url: "https://earthquake.usgs.gov",
    depth: 540.0,
    lat: -24.0,
    lon: -179.5,
    tsunami: 0,
    magnitudeType: "mb"
  },
  {
    id: "id-005",
    mag: 6.5,
    place: "Off the coast of Bio-Bio, Chile",
    time: Date.now() - 3600000 * 14,
    url: "https://earthquake.usgs.gov",
    depth: 22.0,
    lat: -37.2,
    lon: -73.5,
    tsunami: 0,
    magnitudeType: "mww"
  },
  {
    id: "id-006",
    mag: 4.2,
    place: "Central California, USA",
    time: Date.now() - 3600000 * 18,
    url: "https://earthquake.usgs.gov",
    depth: 8.5,
    lat: 36.0,
    lon: -120.5,
    tsunami: 0,
    magnitudeType: "md"
  },
  {
    id: "id-007",
    mag: 5.1,
    place: "Kermadec Islands, New Zealand",
    time: Date.now() - 3600000 * 22,
    url: "https://earthquake.usgs.gov",
    depth: 35.0,
    lat: -29.5,
    lon: -177.0,
    tsunami: 0,
    magnitudeType: "mb"
  },
  {
    id: "id-008",
    mag: 5.7,
    place: "Southern Alaska",
    time: Date.now() - 3600000 * 26,
    url: "https://earthquake.usgs.gov",
    depth: 62.0,
    lat: 61.2,
    lon: -150.0,
    tsunami: 0,
    magnitudeType: "ml"
  }
];

export const FALLBACK_ISS: IssTelemetry = {
  latitude: -15.4,
  longitude: 110.2,
  altitude: 418.5,
  velocity: 27580.0,
  visibility: "daylight",
  timestamp: Date.now()
};

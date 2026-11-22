export type ThemeMode = "dark" | "light";

export type UsgsPeriod = "day" | "week";

export type FeedSortMode = "newest" | "magnitude";

export interface EarthquakeEvent {
  id: string;
  mag: number;
  place: string;
  time: number;
  url: string;
  depth: number;
  lat: number;
  lon: number;
  tsunami: number;
  magnitudeType: string;
}

export interface IssTelemetry {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  visibility: string;
  timestamp: number;
}

export interface HubCity {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  timezone: string;
}

export interface ArcRoute {
  id: string;
  fromHubId: string;
  toHubId: string;
  volume: number; // relative traffic intensity
}

export interface LayerVisibility {
  earthquakes: boolean;
  iss: boolean;
  routes: boolean;
}

export type MagnitudeFilter = "all" | "4.5" | "5.5" | "6.0";

export type SelectedEntity =
  | { type: "earthquake"; data: EarthquakeEvent }
  | { type: "iss"; data: IssTelemetry }
  | { type: "hub"; data: HubCity }
  | null;

"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import GlobeCanvas from "@/components/GlobeCanvas";
import {
  ThemeMode,
  EarthquakeEvent,
  IssTelemetry,
  HubCity,
  ArcRoute,
  LayerVisibility,
  SelectedEntity
} from "@/lib/types";
import { fetchEarthquakes, fetchIssTelemetry } from "@/lib/api";
import { HUB_CITIES, ARC_ROUTES } from "@/data/routes";
import {
  Sun,
  Moon,
  Globe,
  Radio,
  Activity,
  Navigation,
  Compass,
  X,
  ExternalLink
} from "lucide-react";

const getInitialTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = localStorage.getItem("earth_globe_theme") as ThemeMode | null;
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  } catch {
    return "dark";
  }
};

export default function Home() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [, startTransition] = useTransition();

  // Phase 2 Data States
  const [earthquakes, setEarthquakes] = useState<EarthquakeEvent[]>([]);
  const [iss, setIss] = useState<IssTelemetry | null>(null);
  const [hubs] = useState<HubCity[]>(HUB_CITIES);
  const [routes] = useState<ArcRoute[]>(ARC_ROUTES);
  const [isEqFallback, setIsEqFallback] = useState<boolean>(false);
  const [isIssFallback, setIsIssFallback] = useState<boolean>(false);

  // Layers & Selection
  const [layers, setLayers] = useState<LayerVisibility>({
    earthquakes: true,
    iss: true,
    routes: true
  });
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity>(null);

  // Theme change listener for system preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const handler = () => {
      try {
        if (!localStorage.getItem("earth_globe_theme")) {
          const nextTheme = mediaQuery.matches ? "light" : "dark";
          setTheme(nextTheme);
          document.documentElement.setAttribute("data-theme", nextTheme);
        }
      } catch {}
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Fetch Earthquakes on mount
  useEffect(() => {
    let mounted = true;
    fetchEarthquakes().then(({ data, isFallback }) => {
      if (mounted) {
        setEarthquakes(data);
        setIsEqFallback(isFallback);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Poll ISS Telemetry every 5000ms
  useEffect(() => {
    let mounted = true;
    const fetchIss = () => {
      fetchIssTelemetry().then(({ data, isFallback }) => {
        if (mounted) {
          setIss(data);
          setIsIssFallback(isFallback);
        }
      });
    };

    fetchIss();
    const interval = setInterval(fetchIss, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    startTransition(() => {
      try {
        localStorage.setItem("earth_globe_theme", nextTheme);
      } catch {}
      document.documentElement.setAttribute("data-theme", nextTheme);
    });
  };

  const toggleLayer = useCallback((layerKey: keyof LayerVisibility) => {
    setLayers((prev) => ({
      ...prev,
      [layerKey]: !prev[layerKey]
    }));
  }, []);

  return (
    <main className="relative w-full h-[100dvh] overflow-hidden select-none">
      {/* 3D WebGL Canvas */}
      <GlobeCanvas
        theme={theme}
        earthquakes={earthquakes}
        iss={iss}
        hubs={hubs}
        routes={routes}
        layers={layers}
        selectedEntity={selectedEntity}
        onSelectEntity={setSelectedEntity}
      />

      {/* Top Capsule HUD (Apple Fluid Glass) */}
      <header className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-full fluid-glass shadow-2xl min-w-[320px] max-w-[95vw]">
        {/* Brand & Status */}
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-primary)]">
            <Globe className="w-4 h-4 animate-pulse-subtle" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold tracking-tight text-[var(--text-primary)]">
              Earth Live
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isEqFallback || isIssFallback
                    ? "bg-amber-500"
                    : "bg-emerald-500 animate-ping"
                }`}
              />
              <span className="text-[10px] text-[var(--text-secondary)] font-medium">
                {isEqFallback || isIssFallback ? "Cached / Simulation" : "Live Orbital Feed"}
              </span>
            </div>
          </div>
        </div>

        {/* Phase 2 Layer Toggles */}
        <div className="flex items-center gap-1.5 bg-[var(--glass-hover)] p-1 rounded-full">
          {/* Earthquakes Toggle */}
          <button
            type="button"
            onClick={() => toggleLayer("earthquakes")}
            aria-label="Toggle Earthquakes Layer"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
              layers.earthquakes
                ? "bg-[var(--accent-primary)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Gempa</span>
            <span className="text-[10px] opacity-80">({earthquakes.length})</span>
          </button>

          {/* ISS Toggle */}
          <button
            type="button"
            onClick={() => toggleLayer("iss")}
            aria-label="Toggle ISS Tracker Layer"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
              layers.iss
                ? "bg-[var(--accent-primary)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ISS</span>
          </button>

          {/* Routes Toggle */}
          <button
            type="button"
            onClick={() => toggleLayer("routes")}
            aria-label="Toggle Connectivity Routes Layer"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
              layers.routes
                ? "bg-[var(--accent-primary)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rute</span>
          </button>
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--glass-hover)] text-[var(--text-primary)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-500" />
          )}
        </button>
      </header>

      {/* Selected Entity Preview Card (Fase 2 Fly-To & Raycaster Verification) */}
      {selectedEntity && (
        <aside className="absolute bottom-6 right-6 z-30 w-80 max-w-[calc(100vw-3rem)] rounded-2xl p-4 fluid-glass shadow-2xl border border-[var(--border-glass)] transition-all animate-fade-in">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent-primary)]">
                {selectedEntity.type === "earthquake" && <Activity className="w-4 h-4" />}
                {selectedEntity.type === "iss" && <Radio className="w-4 h-4" />}
                {selectedEntity.type === "hub" && <Compass className="w-4 h-4" />}
              </span>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-secondary)]">
                  {selectedEntity.type === "earthquake" && "Gempa Bumi Terdeteksi"}
                  {selectedEntity.type === "iss" && "Stasiun Luar Angkasa Internasional"}
                  {selectedEntity.type === "hub" && "Kota Hub Global"}
                </span>
                <h3 className="text-sm font-bold text-[var(--text-primary)] leading-tight">
                  {selectedEntity.type === "earthquake" && selectedEntity.data.place}
                  {selectedEntity.type === "iss" && "ISS (ZARYA - 25544)"}
                  {selectedEntity.type === "hub" && `${selectedEntity.data.name}, ${selectedEntity.data.country}`}
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedEntity(null)}
              aria-label="Tutup Panel Info"
              className="p-1 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-hover)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Details Content */}
          <div className="mt-3 pt-3 border-t border-[var(--border-glass)] grid grid-cols-2 gap-2 text-xs">
            {selectedEntity.type === "earthquake" && (
              <>
                <div className="flex flex-col">
                  <span className="text-[10px] text-[var(--text-secondary)]">Magnitudo</span>
                  <span className="font-bold text-[var(--accent-primary)]">
                    M {selectedEntity.data.mag.toFixed(1)} {selectedEntity.data.magnitudeType}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-[var(--text-secondary)]">Kedalaman</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {selectedEntity.data.depth.toFixed(1)} km
                  </span>
                </div>
                <div className="flex flex-col col-span-2">
                  <span className="text-[10px] text-[var(--text-secondary)]">Waktu Kejadian</span>
                  <span className="text-[11px] text-[var(--text-primary)]">
                    {new Date(selectedEntity.data.time).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short"
                    })}
                  </span>
                </div>
                {selectedEntity.data.url && (
                  <a
                    href={selectedEntity.data.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="col-span-2 mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-[var(--accent-primary)] hover:underline"
                  >
                    <span>Detail USGS</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </>
            )}

            {selectedEntity.type === "iss" && (
              <>
                <div className="flex flex-col">
                  <span className="text-[10px] text-[var(--text-secondary)]">Latitude</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {selectedEntity.data.latitude.toFixed(2)}°
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-[var(--text-secondary)]">Longitude</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {selectedEntity.data.longitude.toFixed(2)}°
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-[var(--text-secondary)]">Ketinggian</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {selectedEntity.data.altitude.toFixed(1)} km
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-[var(--text-secondary)]">Kecepatan</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {selectedEntity.data.velocity.toFixed(0)} km/h
                  </span>
                </div>
              </>
            )}

            {selectedEntity.type === "hub" && (
              <>
                <div className="flex flex-col">
                  <span className="text-[10px] text-[var(--text-secondary)]">Koordinat</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {selectedEntity.data.lat.toFixed(2)}°, {selectedEntity.data.lon.toFixed(2)}°
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-[var(--text-secondary)]">Zona Waktu</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {selectedEntity.data.timezone}
                  </span>
                </div>
              </>
            )}
          </div>
        </aside>
      )}
    </main>
  );
}

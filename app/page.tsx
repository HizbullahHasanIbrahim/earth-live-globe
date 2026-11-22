"use client";

import { useState, useEffect, useTransition, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import TopCapsule from "@/components/TopCapsule";
import LayerDock from "@/components/LayerDock";
import FeedPanel from "@/components/FeedPanel";
import DetailSheet from "@/components/DetailSheet";
import {
  ThemeMode,
  EarthquakeEvent,
  IssTelemetry,
  HubCity,
  ArcRoute,
  LayerVisibility,
  SelectedEntity,
  MagnitudeFilter
} from "@/lib/types";
import { fetchEarthquakes, fetchIssTelemetry } from "@/lib/api";
import { HUB_CITIES, ARC_ROUTES } from "@/data/routes";

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

const DynamicGlobeCanvas = dynamic(() => import("@/components/GlobeCanvas"), {
  ssr: false,
  loading: () => null,
});

export default function Home() {
  // UI State
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [isFeedOpen, setIsFeedOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [resetViewSignal, setResetViewSignal] = useState(0);
  const [magFilter, setMagFilter] = useState<MagnitudeFilter>("all");
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity>(null);

  // Data State
  const [earthquakes, setEarthquakes] = useState<EarthquakeEvent[]>([]);
  const [iss, setIss] = useState<IssTelemetry | null>(null);
  const [hubs] = useState<HubCity[]>(HUB_CITIES);
  const [routes] = useState<ArcRoute[]>(ARC_ROUTES);
  const [isEqFallback, setIsEqFallback] = useState(false);
  const [isIssFallback, setIsIssFallback] = useState(false);
  const [layers, setLayers] = useState<LayerVisibility>({
    earthquakes: true,
    iss: true,
    routes: true
  });

  const [, startTransition] = useTransition();

  // Desktop auto-open feed
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsFeedOpen(true);
      } else {
        setIsFeedOpen(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

    // Filtered Data
  const filteredEarthquakes = useMemo(() => {
    if (magFilter === "all") return earthquakes;
    const min = parseFloat(magFilter);
    return earthquakes.filter(e => e.mag >= min);
  }, [earthquakes, magFilter]);

  // Data Actions
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    const { data, isFallback } = await fetchEarthquakes();
    setEarthquakes(data);
    setIsEqFallback(isFallback);
    setTimeout(() => setIsRefreshing(false), 800);
  }, []);

  // Polling ISS
  useEffect(() => {
    const poll = async () => {
      if (document.hidden) return;
      const { data, isFallback } = await fetchIssTelemetry();
      setIss(data);
      setIsIssFallback(isFallback);
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Initial Fetch
  useEffect(() => {
    const fetch = async () => {
      await refreshData();
    };
    fetch();
  }, [refreshData]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;

      if (e.key === "Escape") {
        setSelectedEntity(null);
        setIsFeedOpen(false);
      } else if (e.key.toLowerCase() === "r") {
        setResetViewSignal(s => s + 1);
        setSelectedEntity(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const toggleTheme = () => {
    const next: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(next);
    startTransition(() => {
      try {
        localStorage.setItem("earth_globe_theme", next);
      } catch {}
      document.documentElement.setAttribute("data-theme", next);
    });
  };

  const handleSelectEntity = useCallback((entity: SelectedEntity) => {
    setSelectedEntity(entity);
    // Tutup feed pada layar sempit agar panel tidak menumpuk
    if (entity && window.innerWidth < 1024) setIsFeedOpen(false);
  }, []);

  const toggleLayer = useCallback((layer: keyof LayerVisibility) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  return (
    <main className="relative w-full h-[100dvh] overflow-hidden select-none bg-[var(--bg-app)]">
      <DynamicGlobeCanvas 
        theme={theme}
        earthquakes={filteredEarthquakes}
        iss={iss}
        hubs={hubs}
        routes={routes}
        layers={layers}
        selectedEntity={selectedEntity}
        onSelectEntity={handleSelectEntity}
        resetViewSignal={resetViewSignal}
      />

      <TopCapsule 
        theme={theme}
        setTheme={toggleTheme}
        isRefreshing={isRefreshing}
        onRefresh={refreshData}
        onResetView={() => {
          setResetViewSignal(s => s + 1);
          setSelectedEntity(null);
        }}
        isFeedOpen={isFeedOpen}
        toggleFeed={() => setIsFeedOpen(!isFeedOpen)}
        earthquakeCount={filteredEarthquakes.length}
        isFallback={isEqFallback || isIssFallback}
        hubs={hubs}
        earthquakes={earthquakes}
        iss={iss}
        onSelectEntity={handleSelectEntity}
      />

      <FeedPanel 
        isOpen={isFeedOpen}
        earthquakes={earthquakes}
        magFilter={magFilter}
        setMagFilter={setMagFilter}
        iss={iss}
        onSelectEntity={handleSelectEntity}
        selectedEntity={selectedEntity}
      />

      <LayerDock 
        layers={layers}
        toggleLayer={toggleLayer}
        selectedEntity={selectedEntity}
      />

      <DetailSheet 
        selectedEntity={selectedEntity}
        onClose={() => setSelectedEntity(null)}
        onSelectEntity={handleSelectEntity}
      />

      {/* Screen reader / Accessibility helpers */}
      <div className="sr-only">
        <h1>Earth Live Visualizer</h1>
        <p>Aplikasi visualisasi bumi 3D interaktif menampilkan data gempa real-time dan tracker ISS.</p>
      </div>
    </main>
  );
}

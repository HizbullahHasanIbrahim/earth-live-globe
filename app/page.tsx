"use client";

import { useState, useEffect, useTransition, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import TopCapsule from "@/components/TopCapsule";
import LayerDock from "@/components/LayerDock";
import FeedPanel from "@/components/FeedPanel";
import DetailSheet from "@/components/DetailSheet";
import StatusOverlays from "@/components/StatusOverlays";
import {
  ThemeMode,
  EarthquakeEvent,
  IssTelemetry,
  HubCity,
  ArcRoute,
  LayerVisibility,
  SelectedEntity,
  MagnitudeFilter,
  UsgsPeriod,
  FeedSortMode
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
  const [sortMode, setSortMode] = useState<FeedSortMode>("newest");
  const [timePeriod, setTimePeriod] = useState<UsgsPeriod>("day");
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity>(null);
  const [now, setNow] = useState<number | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isFollowingIss, setIsFollowingIss] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [webGlError, setWebGlError] = useState<string | null>(null);

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

  // Inisialisasi status buka panel feed pada desktop saat pertama kali dimuat
  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.innerWidth > 768) {
        setIsFeedOpen(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Sync "now" for relative timestamps (60s update)
  useEffect(() => {
    const initialTimer = setTimeout(() => setNow(Date.now()), 0);
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  // Filtered Data
  const filteredEarthquakes = useMemo(() => {
    if (magFilter === "all") return earthquakes;
    const min = parseFloat(magFilter);
    return earthquakes.filter(e => e.mag >= min);
  }, [earthquakes, magFilter]);

  // Data Actions
  const refreshData = useCallback(async (periodToFetch?: UsgsPeriod) => {
    setIsRefreshing(true);
    const targetPeriod = periodToFetch ?? timePeriod;
    const { data, isFallback } = await fetchEarthquakes(targetPeriod);
    setEarthquakes(data);
    setIsEqFallback(isFallback);
    setTimeout(() => setIsRefreshing(false), 800);
  }, [timePeriod]);

  const handleTimePeriodChange = useCallback(async (period: UsgsPeriod) => {
    setTimePeriod(period);
    setIsRefreshing(true);
    const { data, isFallback } = await fetchEarthquakes(period);
    setEarthquakes(data);
    setIsEqFallback(isFallback);
    setTimeout(() => setIsRefreshing(false), 800);
  }, []);

  // Polling ISS (hanya jika layer ISS aktif dan tab browser terlihat sesuai PRD 3.3)
  useEffect(() => {
    const poll = async () => {
      if (document.hidden || !layers.iss) return;
      const { data, isFallback } = await fetchIssTelemetry();
      setIss(data);
      setIsIssFallback(isFallback);
      setSelectedEntity(prev => {
        if (prev?.type === "iss") {
          return { type: "iss", data };
        }
        return prev;
      });
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => {
      clearInterval(interval);
    };
  }, [layers.iss]);

  // Initial Fetch
  useEffect(() => {
    const fetch = async () => {
      await refreshData();
    };
    fetch();
  }, [refreshData]);

  // Keyboard Shortcuts (Esc, R, Space, /)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;

      if (e.key === "Escape") {
        setSelectedEntity(null);
        setIsFeedOpen(false);
        setIsFollowingIss(false);
      } else if (e.key.toLowerCase() === "r") {
        setResetViewSignal(s => s + 1);
        setSelectedEntity(null);
        setIsFollowingIss(false);
      } else if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        setAutoRotate(prev => !prev);
      } else if (e.key === "/") {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement | null;
        searchInput?.focus();
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
    if (entity?.type !== "iss") {
      setIsFollowingIss(false);
    }
    // Tutup feed pada layar sempit agar panel tidak menumpuk
    if (entity && window.innerWidth < 1024) setIsFeedOpen(false);
  }, []);

  const toggleLayer = useCallback((layer: keyof LayerVisibility) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  return (
    <main className="relative w-full h-[100dvh] overflow-hidden select-none bg-[var(--bg-app)]">
      <StatusOverlays 
        isLoading={isLoading} 
        webGlError={webGlError} 
        onRetry={() => window.location.reload()} 
      />

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
        autoRotate={autoRotate}
        isFollowingIss={isFollowingIss}
        onToggleFollowIss={setIsFollowingIss}
        onLoaded={() => setIsLoading(false)}
        onWebGlError={(err) => {
          setWebGlError(err);
          setIsLoading(false);
        }}
      />

      <TopCapsule 
        theme={theme}
        setTheme={toggleTheme}
        isRefreshing={isRefreshing}
        onRefresh={() => refreshData()}
        onResetView={() => {
          setResetViewSignal(s => s + 1);
          setSelectedEntity(null);
          setIsFollowingIss(false);
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
        onClose={() => setIsFeedOpen(false)}
        earthquakes={earthquakes}
        magFilter={magFilter}
        setMagFilter={setMagFilter}
        iss={iss}
        onSelectEntity={handleSelectEntity}
        selectedEntity={selectedEntity}
        currentTime={now}
        sortMode={sortMode}
        setSortMode={setSortMode}
        timePeriod={timePeriod}
        setTimePeriod={handleTimePeriodChange}
      />

      <LayerDock 
        layers={layers}
        toggleLayer={toggleLayer}
        selectedEntity={selectedEntity}
        autoRotate={autoRotate}
        onToggleAutoRotate={() => setAutoRotate(prev => !prev)}
      />

      <DetailSheet 
        selectedEntity={selectedEntity}
        onClose={() => {
          setSelectedEntity(null);
          setIsFollowingIss(false);
        }}
        onSelectEntity={handleSelectEntity}
        isFollowingIss={isFollowingIss}
        onToggleFollowIss={setIsFollowingIss}
      />

      {/* Screen reader / Accessibility helpers */}
      <div className="sr-only">
        <h1>Earth Live Visualizer</h1>
        <p>Aplikasi visualisasi bumi 3D interaktif menampilkan data gempa real-time dan tracker ISS.</p>
      </div>
    </main>
  );
}

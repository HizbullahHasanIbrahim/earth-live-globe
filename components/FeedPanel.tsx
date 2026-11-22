"use client";

import { useMemo } from "react";
import { 
  Activity, 
  Satellite, 
  ChevronRight, 
  ArrowUpRight,
  AlertCircle,
  X
} from "lucide-react";
import { 
  EarthquakeEvent, 
  IssTelemetry, 
  MagnitudeFilter, 
  SelectedEntity,
  UsgsPeriod,
  FeedSortMode
} from "@/lib/types";

interface FeedPanelProps {
  isOpen: boolean;
  onClose?: () => void;
  earthquakes: EarthquakeEvent[];
  magFilter: MagnitudeFilter;
  setMagFilter: (filter: MagnitudeFilter) => void;
  iss: IssTelemetry | null;
  onSelectEntity: (entity: SelectedEntity) => void;
  selectedEntity: SelectedEntity;
  currentTime: number | null;
  sortMode: FeedSortMode;
  setSortMode: (mode: FeedSortMode) => void;
  timePeriod: UsgsPeriod;
  setTimePeriod: (period: UsgsPeriod) => void;
}

const getTimeAgo = (timestamp: number, currentTime: number | null) => {
  if (currentTime === null) return "";
  const seconds = Math.floor((currentTime - timestamp) / 1000);
  if (seconds < 60) return "Baru saja";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} mnt lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
};

const getMagBadgeStyle = (mag: number) => {
  if (mag < 4.5) return { backgroundColor: "rgba(34, 197, 94, 0.2)", color: "#22c55e", borderColor: "rgba(34, 197, 94, 0.4)" };
  if (mag < 5.5) return { backgroundColor: "var(--mag-amber-bg)", color: "var(--mag-amber-text)", borderColor: "var(--mag-amber-border)" };
  if (mag < 6.0) return { backgroundColor: "rgba(249, 115, 22, 0.2)", color: "#f97316", borderColor: "rgba(249, 115, 22, 0.4)" };
  return { backgroundColor: "rgba(239, 68, 68, 0.2)", color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.4)" };
};

export default function FeedPanel({
  isOpen,
  onClose,
  earthquakes,
  magFilter,
  setMagFilter,
  iss,
  onSelectEntity,
  selectedEntity,
  currentTime,
  sortMode,
  setSortMode,
  timePeriod,
  setTimePeriod
}: FeedPanelProps) {
  const filteredQuakes = useMemo(() => {
    const base = magFilter === "all"
      ? earthquakes
      : earthquakes.filter((e) => e.mag >= parseFloat(magFilter));

    return base.slice().sort((a, b) => {
      if (sortMode === "magnitude") {
        return b.mag - a.mag || b.time - a.time;
      }
      return b.time - a.time;
    });
  }, [earthquakes, magFilter, sortMode]);

  const maxMag = useMemo(() => {
    if (earthquakes.length === 0) return 0;
    return Math.max(...earthquakes.map((e) => e.mag));
  }, [earthquakes]);

  return (
    <aside 
      className={`
        fixed z-[105] transition-all duration-500 ease-fluid
        /* Mobile Portrait: Bottom Sheet */
        inset-x-0 bottom-0 max-h-[52dvh] rounded-t-3xl border-t border-[var(--border-glass)] fluid-glass-elevated shadow-[0_-20px_50px_-10px_rgba(0,0,0,0.3)] p-4 pb-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] flex flex-col overflow-hidden
        ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}
        /* Mobile Landscape (max-height: 520px): Kompak di sisi kiri */
        landscape:max-h-full landscape:top-2 landscape:bottom-2 landscape:left-2 landscape:right-auto landscape:w-[310px] landscape:rounded-2xl landscape:border landscape:p-3
        landscape:${isOpen ? 'translate-x-0 translate-y-0 opacity-100' : '-translate-x-[120%] translate-y-0 opacity-0 pointer-events-none'}
        /* Desktop (>= md): Floating Left Drawer */
        md:top-20 md:left-4 md:bottom-20 md:right-auto md:w-[320px] md:max-h-none md:rounded-none md:border-0 md:bg-transparent md:backdrop-blur-none md:shadow-none md:p-0 md:z-80 md:space-y-3
        md:${isOpen ? 'translate-x-0 translate-y-0 opacity-100' : '-translate-x-[120%] translate-y-0 opacity-0 pointer-events-none'}
      `}
    >
      {/* Drag Grabber (Mobile Portrait) */}
      <div className="w-10 h-1 bg-[var(--border-glass)] rounded-full mx-auto mb-2 md:hidden shrink-0" />

      {/* Header bar on mobile */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border-glass)] md:hidden shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[var(--accent-primary)]" />
          <span className="text-xs font-bold text-[var(--text-primary)]">Feed Gempa Global</span>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-hover)] transition-all touch-manipulation"
            aria-label="Tutup panel feed"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Controls: Rentang Waktu (USGS) & Magnitudo */}
      <div className="space-y-2 shrink-0">
        <div className="flex items-center justify-between px-1">
          <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
            Rentang Waktu
          </span>
          <div className="flex items-center gap-1 p-0.5 rounded-xl fluid-glass border border-[var(--border-glass)]">
            <button
              onClick={() => setTimePeriod("day")}
              className={`min-h-[32px] sm:min-h-0 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all touch-manipulation flex items-center justify-center ${
                timePeriod === "day"
                  ? "bg-[var(--accent-primary)] text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              aria-label="Rentang 24 jam terakhir"
            >
              24 Jam
            </button>
            <button
              onClick={() => setTimePeriod("week")}
              className={`min-h-[32px] sm:min-h-0 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all touch-manipulation flex items-center justify-center ${
                timePeriod === "week"
                  ? "bg-[var(--accent-primary)] text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              aria-label="Rentang 7 hari terakhir"
            >
              7 Hari
            </button>
          </div>
        </div>

        {/* Magnitude Filter Segmented Control */}
        <div className="p-1.5 rounded-2xl fluid-glass shadow-xl border border-[var(--border-glass)] flex items-center">
          {(["all", "4.5", "5.5", "6.0"] as MagnitudeFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setMagFilter(f)}
              className={`flex-1 min-h-[44px] py-1.5 rounded-xl text-[10px] font-bold transition-all touch-manipulation flex items-center justify-center ${magFilter === f ? 'bg-[var(--accent-primary)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              {f === "all" ? "Semua" : `M${f}+`}
            </button>
          ))}
        </div>
      </div>

      {/* ISS Quick Card (Visible on desktop & mobile landscape) */}
      {iss && (
        <button
          onClick={() => onSelectEntity({ type: "iss", data: iss })}
          className={`hidden sm:flex items-center gap-3 p-3 min-h-[44px] rounded-2xl fluid-glass shadow-xl border border-[var(--border-glass)] transition-all hover:scale-[1.02] active:scale-[0.98] text-left shrink-0 touch-manipulation ${selectedEntity?.type === "iss" ? 'ring-2 ring-[var(--accent-primary)]' : ''}`}
        >
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
            <Satellite className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">ISS Live Tracker</h4>
            <p className="text-[11px] font-mono tabular-nums text-[var(--text-primary)] truncate">
              {iss.latitude.toFixed(2)}°, {iss.longitude.toFixed(2)}°
            </p>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
        </button>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 shrink-0">
        <div className="p-2.5 sm:p-3 rounded-2xl fluid-glass shadow-xl border border-[var(--border-glass)]">
          <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Total</span>
          <p className="text-base sm:text-lg font-display font-bold text-[var(--text-primary)] leading-tight">{filteredQuakes.length}</p>
        </div>
        <div className="p-2.5 sm:p-3 rounded-2xl fluid-glass shadow-xl border border-[var(--border-glass)]">
          <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Max Mag</span>
          <p className="text-base sm:text-lg font-display font-bold text-[var(--accent-primary)] leading-tight">M{maxMag.toFixed(1)}</p>
        </div>
      </div>

      {/* Main Earthquake List */}
      <div className="flex-1 flex flex-col min-h-0 p-2 rounded-3xl fluid-glass-elevated shadow-2xl border border-[var(--border-glass)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border-glass)] p-3 sm:p-3.5 shrink-0">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <h3 className="text-xs font-bold text-[var(--text-primary)]">Aktivitas Gempa</h3>
          </div>
          <div className="flex items-center gap-1 p-0.5 rounded-xl fluid-glass border border-[var(--border-glass)]">
            <button
              onClick={() => setSortMode("newest")}
              className={`min-h-[30px] sm:min-h-0 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all touch-manipulation flex items-center justify-center ${
                sortMode === "newest"
                  ? "bg-[var(--accent-primary)] text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              aria-label="Urutkan berdasarkan terbaru"
            >
              Terbaru
            </button>
            <button
              onClick={() => setSortMode("magnitude")}
              className={`min-h-[30px] sm:min-h-0 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all touch-manipulation flex items-center justify-center ${
                sortMode === "magnitude"
                  ? "bg-[var(--accent-primary)] text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              aria-label="Urutkan berdasarkan magnitudo terbesar"
            >
              M Terbesar
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2 sm:py-3 space-y-1 custom-scrollbar overscroll-contain">
          {filteredQuakes.length > 0 ? (
            filteredQuakes.map((eq) => (
              <button
                key={eq.id}
                onClick={() => onSelectEntity({ type: "earthquake", data: eq })}
                className={`flex items-center gap-3 w-full p-2.5 rounded-xl transition-all duration-300 text-left hover:bg-[var(--glass-hover)] group ${selectedEntity?.type === "earthquake" && selectedEntity.data.id === eq.id ? 'bg-[var(--glass-active)] ring-1 ring-[var(--accent-primary)]' : ''}`}
              >
                <div className="flex items-center justify-center min-w-[42px] h-[42px] rounded-lg border font-display font-bold transition-transform group-hover:scale-105 shrink-0" style={getMagBadgeStyle(eq.mag)}>
                  <span className="text-sm">{eq.mag.toFixed(1)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[11px] font-bold text-[var(--text-primary)] truncate leading-tight mb-0.5">{eq.place}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)] font-medium">
                    <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {eq.depth.toFixed(1)} km</span>
                    <span>•</span>
                    <span>{getTimeAgo(eq.time, currentTime)}</span>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 transition-all duration-300 ${selectedEntity?.type === "earthquake" && selectedEntity.data.id === eq.id ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'}`} />
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <AlertCircle className="w-8 h-8 text-[var(--text-secondary)] mb-2 opacity-20" />
              <p className="text-xs font-medium text-[var(--text-secondary)]">Tidak ada data untuk filter ini.</p>
              <button 
                onClick={() => setMagFilter("all")}
                className="mt-2 text-[10px] font-bold text-[var(--accent-primary)] hover:underline"
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
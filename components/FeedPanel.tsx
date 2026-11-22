"use client";

import { useMemo } from "react";
import { 
  Activity, 
  Satellite, 
  ChevronRight, 
  ArrowUpRight,
  AlertCircle
} from "lucide-react";
import { 
  EarthquakeEvent, 
  IssTelemetry, 
  MagnitudeFilter, 
  SelectedEntity 
} from "@/lib/types";

interface FeedPanelProps {
  isOpen: boolean;
  earthquakes: EarthquakeEvent[];
  magFilter: MagnitudeFilter;
  setMagFilter: (filter: MagnitudeFilter) => void;
  iss: IssTelemetry | null;
  onSelectEntity: (entity: SelectedEntity) => void;
  selectedEntity: SelectedEntity;
  currentTime: number | null;
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
  earthquakes,
  magFilter,
  setMagFilter,
  iss,
  onSelectEntity,
  selectedEntity,
  currentTime
}: FeedPanelProps) {
  const filteredQuakes = useMemo(() => {
    if (magFilter === "all") return earthquakes;
    const min = parseFloat(magFilter);
    return earthquakes.filter(e => e.mag >= min);
  }, [earthquakes, magFilter]);

  const maxMag = useMemo(() => {
    if (earthquakes.length === 0) return 0;
    return Math.max(...earthquakes.map(e => e.mag));
  }, [earthquakes]);

  return (
    <aside className={`fixed top-20 left-4 bottom-20 z-80 w-[320px] transition-all duration-500 ease-fluid ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-[120%] opacity-0 pointer-events-none'} hidden md:flex flex-col overflow-hidden`}>
      {/* Magnitude Filter Segmented Control */}
      <div className="p-1.5 rounded-2xl fluid-glass shadow-xl border border-[var(--border-glass)] flex items-center">
        {(["all", "4.5", "5.5", "6.0"] as MagnitudeFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setMagFilter(f)}
            className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold transition-all ${magFilter === f ? 'bg-[var(--accent-primary)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            {f === "all" ? "Semua" : `M${f}+`}
          </button>
        ))}
      </div>

      {/* ISS Quick Card */}
      {iss && (
        <button
          onClick={() => onSelectEntity({ type: "iss", data: iss })}
          className={`flex items-center gap-3 p-3 rounded-2xl fluid-glass shadow-xl border border-[var(--border-glass)] transition-all hover:scale-[1.02] active:scale-[0.98] text-left ${selectedEntity?.type === "iss" ? 'ring-2 ring-[var(--accent-primary)]' : ''}`}
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
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-2xl fluid-glass shadow-xl border border-[var(--border-glass)]">
          <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Total</span>
          <p className="text-lg font-display font-bold text-[var(--text-primary)] leading-tight">{filteredQuakes.length}</p>
        </div>
        <div className="p-3 rounded-2xl fluid-glass shadow-xl border border-[var(--border-glass)]">
          <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Max Mag</span>
          <p className="text-lg font-display font-bold text-[var(--accent-primary)] leading-tight">M{maxMag.toFixed(1)}</p>
        </div>
      </div>

      {/* Main Earthquake List */}
      <div className="flex-1 flex flex-col min-h-0 p-2 rounded-3xl fluid-glass-elevated shadow-2xl border border-[var(--border-glass)]">
        <div className="flex items-center justify-between border-b border-[var(--border-glass)] p-4 shrink-0">
          <h3 className="text-xs font-bold text-[var(--text-primary)]">Aktivitas Gempa</h3>
          <span className="text-[10px] font-mono tabular-nums text-[var(--text-secondary)] uppercase tracking-wider">TERBARU</span>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 custom-scrollbar">
          {filteredQuakes.length > 0 ? (
            filteredQuakes.map((eq) => (
              <button
                key={eq.id}
                onClick={() => onSelectEntity({ type: "earthquake", data: eq })}
                className={`flex items-center gap-3 w-full p-2.5 rounded-xl transition-all duration-300 text-left hover:bg-[var(--glass-hover)] group ${selectedEntity?.type === "earthquake" && selectedEntity.data.id === eq.id ? 'bg-[var(--glass-active)] ring-1 ring-[var(--accent-primary)]' : ''}`}
              >
                <div className="flex items-center justify-center min-w-[42px] h-[42px] rounded-lg border font-display font-bold transition-transform group-hover:scale-105" style={getMagBadgeStyle(eq.mag)}>
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
            <div className="flex items-center justify-center py-10 text-center px-4">
              <AlertCircle className="w-8 h-8 text-[var(--text-secondary)] mb-3 opacity-20" />
              <p className="text-xs font-medium text-[var(--text-secondary)]">Tidak ada data untuk filter ini.</p>
              <button 
                onClick={() => setMagFilter("all")}
                className="mt-3 text-[10px] font-bold text-[var(--accent-primary)] hover:underline"
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
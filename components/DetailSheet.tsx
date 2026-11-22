"use client";

import { 
  Activity, 
  Satellite, 
  MapPin, 
  X, 
  Clock, 
  ExternalLink, 
  ChevronRight,
  Globe
} from "lucide-react";
import { SelectedEntity } from "@/lib/types";
import { ARC_ROUTES, HUB_CITIES } from "@/data/routes";
import { 
  calculateHaversineDistance, 
  estimateNetworkLatency, 
  estimateFlightDuration 
} from "@/lib/geo";

interface DetailSheetProps {
  selectedEntity: SelectedEntity;
  onClose: () => void;
  onSelectEntity?: (entity: SelectedEntity) => void;
  isFollowingIss?: boolean;
  onToggleFollowIss?: (following: boolean) => void;
}

export default function DetailSheet({
  selectedEntity,
  onClose,
  onSelectEntity,
  isFollowingIss = false,
  onToggleFollowIss
}: DetailSheetProps) {
  if (!selectedEntity) return null;

  const isEq = selectedEntity.type === "earthquake";
  const isIss = selectedEntity.type === "iss";
  const isHub = selectedEntity.type === "hub";

  const getMagSeverity = (mag: number) => {
    if (mag < 4.5) return "Ringan";
    if (mag < 5.5) return "Sedang";
    if (mag < 6.0) return "Kuat";
    return "Sangat Kuat";
  };

  const getMagBadgeStyle = (mag: number) => {
    if (mag < 4.5) return { backgroundColor: "rgba(34, 197, 94, 0.2)", color: "#22c55e", borderColor: "rgba(34, 197, 94, 0.4)" };
    if (mag < 5.5) return { backgroundColor: "var(--mag-amber-bg)", color: "var(--mag-amber-text)", borderColor: "var(--mag-amber-border)" };
    if (mag < 6.0) return { backgroundColor: "rgba(249, 115, 22, 0.2)", color: "#f97316", borderColor: "rgba(249, 115, 22, 0.4)" };
    return { backgroundColor: "rgba(239, 68, 68, 0.2)", color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.4)" };
  };

  return (
    <aside 
      className={`
        fixed z-[110] transition-all duration-500 ease-fluid
        /* Mobile Portrait: Bottom Sheet */
        inset-x-0 bottom-0 max-h-[52dvh] rounded-t-3xl border-t border-[var(--border-glass)] fluid-glass-elevated shadow-[0_-20px_50px_-10px_rgba(0,0,0,0.3)] p-5 pb-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem))] overflow-y-auto custom-scrollbar translate-y-0 opacity-100
        /* Mobile Landscape (max-height: 520px): Kompak di sisi kanan */
        landscape:max-h-full landscape:top-2 landscape:bottom-2 landscape:right-2 landscape:left-auto landscape:w-[320px] landscape:rounded-2xl landscape:border landscape:p-4 landscape:translate-x-0 landscape:translate-y-0
        /* Desktop (>= md): Floating Right Inspector (340px) */
        md:top-20 md:right-4 md:bottom-auto md:left-auto md:w-[340px] md:max-h-[calc(100dvh-10rem)] md:rounded-3xl md:border md:border-[var(--border-glass)] md:fluid-glass-elevated md:shadow-2xl md:p-6 md:translate-x-0 md:translate-y-0 md:scale-100
      `}
      aria-label="Detail Inspector"
    >
      {/* Drag Grip (Mobile Portrait) */}
      <div className="w-10 h-1 bg-[var(--border-glass)] rounded-full mx-auto mb-4 md:hidden" />

      {/* Header Section */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl ${isEq ? 'bg-red-500/10 text-red-500' : isIss ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
            {isEq && <Activity className="w-5 h-5" />}
            {isIss && <Satellite className="w-5 h-5" />}
            {isHub && <MapPin className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-0.5">
              {isEq && "Informasi Gempa"}
              {isIss && "Telemetri Real-time"}
              {isHub && "Status Infrastruktur"}
            </p>
            <h2 className="text-sm font-bold text-[var(--text-primary)] leading-tight">
              {isEq && selectedEntity.data.place}
              {isIss && "ISS (ZARYA - 25544)"}
              {isHub && `${selectedEntity.data.name}, ${selectedEntity.data.country}`}
            </h2>
          </div>
        </div>
        <button 
          onClick={onClose}
          aria-label="Tutup panel detail"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-hover)] transition-all touch-manipulation"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body Content */}
      <div className="space-y-6">
        {isEq && (
          <>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--glass-hover)] border border-[var(--border-glass)]">
              <div 
                className="min-w-[56px] h-[56px] px-3.5 py-1 rounded-2xl border flex items-center justify-center font-display font-bold text-2xl shadow-sm shrink-0" 
                style={getMagBadgeStyle(selectedEntity.data.mag)}
              >
                <span>{selectedEntity.data.mag.toFixed(1)}</span>
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">Magnitudo {getMagSeverity(selectedEntity.data.mag)}</p>
                <p className="text-[10px] text-[var(--text-secondary)]">Skala Moment (Mw)</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Kedalaman</p>
                <p className="text-xs font-mono font-bold text-[var(--text-primary)]">{selectedEntity.data.depth.toFixed(1)} km</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Tsunami</p>
                <p className={`text-xs font-bold ${selectedEntity.data.tsunami > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                  {selectedEntity.data.tsunami > 0 ? "Berpotensi" : "Tidak Ada"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Waktu</p>
                <p className="text-[11px] font-medium text-[var(--text-primary)] leading-tight">
                  {new Date(selectedEntity.data.time).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Koordinat</p>
                <p className="text-xs font-mono font-medium text-[var(--text-primary)]">{selectedEntity.data.lat.toFixed(2)}°, {selectedEntity.data.lon.toFixed(2)}°</p>
              </div>
            </div>

            <a 
              href={selectedEntity.data.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full min-h-[48px] p-4 rounded-2xl bg-[var(--accent-primary)] text-white shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all touch-manipulation"
            >
              <span className="text-xs font-bold">Lihat Laporan USGS</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </>
        )}

        {isIss && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[var(--glass-hover)] border border-[var(--border-glass)] space-y-1">
                <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Kecepatan</p>
                <p className="text-sm font-mono font-bold text-[var(--text-primary)] tabular-nums">
                  {selectedEntity.data.velocity.toLocaleString('id-ID', { maximumFractionDigits: 0 })} <span className="text-[10px] font-normal">km/h</span>
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--glass-hover)] border border-[var(--border-glass)] space-y-1">
                <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Ketinggian</p>
                <p className="text-sm font-mono font-bold text-[var(--text-primary)] tabular-nums">
                  {selectedEntity.data.altitude.toFixed(1)} <span className="text-[10px] font-normal">km</span>
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--glass-hover)] border border-[var(--border-glass)] space-y-1">
                <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Lintang</p>
                <p className="text-sm font-mono font-bold text-[var(--text-primary)] tabular-nums">{selectedEntity.data.latitude.toFixed(4)}°</p>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--glass-hover)] border border-[var(--border-glass)] space-y-1">
                <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Bujur</p>
                <p className="text-sm font-mono font-bold text-[var(--text-primary)] tabular-nums">{selectedEntity.data.longitude.toFixed(4)}°</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--mag-amber-bg)] text-[var(--mag-amber-text)] border border-[var(--mag-amber-border)]">
              <Clock className="w-4 h-4" />
              <p className="text-[10px] font-bold uppercase tracking-wide">
                Visibilitas: {selectedEntity.data.visibility === 'daylight' ? 'Terang Matahari' : 'Bayangan Bumi'}
              </p>
            </div>

            {/* Tombol Aksi: Kunci & Ikuti ISS secara Real-Time */}
            <button
              onClick={() => onToggleFollowIss?.(!isFollowingIss)}
              className={`flex items-center justify-between w-full min-h-[48px] p-4 rounded-2xl font-bold text-xs transition-all touch-manipulation ${isFollowingIss ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400' : 'bg-[var(--accent-primary)] text-white shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98]'}`}
            >
              <div className="flex items-center gap-2.5">
                <Satellite className={`w-4 h-4 ${isFollowingIss ? 'animate-pulse' : ''}`} />
                <span>{isFollowingIss ? "Sedang Mengunci & Mengikuti ISS" : "Kunci & Ikuti Pergerakan ISS"}</span>
              </div>
              <div className={`w-2.5 h-2.5 rounded-full ${isFollowingIss ? 'bg-white animate-ping' : 'bg-white/40'}`} />
            </button>
          </>
        )}

        {isHub && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Zona Waktu</p>
                <p className="text-xs font-bold text-[var(--text-primary)]">{selectedEntity.data.timezone}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Koordinat</p>
                <p className="text-xs font-mono font-medium text-[var(--text-primary)]">{selectedEntity.data.lat.toFixed(2)}°, {selectedEntity.data.lon.toFixed(2)}°</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Pusat Konektivitas Terhubung</p>
              <div className="space-y-1.5">
                {(() => {
                  const connectedRoutes = ARC_ROUTES.filter(
                    r => r.fromHubId === selectedEntity.data.id || r.toHubId === selectedEntity.data.id
                  );
                  if (connectedRoutes.length === 0) {
                    return <p className="text-xs text-[var(--text-secondary)]">Tidak ada rute terhubung.</p>;
                  }
                  return connectedRoutes.map((route) => {
                    const targetHubId = route.fromHubId === selectedEntity.data.id ? route.toHubId : route.fromHubId;
                    const targetHub = HUB_CITIES.find(h => h.id === targetHubId);
                    if (!targetHub) return null;

                    // Hitung jarak geodesik Haversine, latensi fiber, dan durasi penerbangan
                    const distance = calculateHaversineDistance(
                      selectedEntity.data.lat,
                      selectedEntity.data.lon,
                      targetHub.lat,
                      targetHub.lon
                    );
                    const latency = estimateNetworkLatency(distance);
                    const flightDuration = estimateFlightDuration(distance);

                    return (
                      <button
                        key={route.id}
                        onClick={() => onSelectEntity?.({ type: "hub", data: targetHub })}
                        className="flex items-center justify-between w-full min-h-[48px] p-3 rounded-xl bg-[var(--glass-hover)] border border-[var(--border-glass)] hover:bg-[var(--glass-active)] transition-all group touch-manipulation text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] group-hover:scale-125 transition-transform shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-[var(--text-primary)] truncate">{targetHub.name} ({targetHub.country})</span>
                            <span className="text-[10px] text-[var(--text-secondary)] font-mono tabular-nums truncate">
                              {distance.toLocaleString('id-ID', { maximumFractionDigits: 0 })} km • ~{latency}ms RTT • {flightDuration}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" />
                      </button>
                    );
                  });
                })()}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer info */}
      <div className="mt-8 pt-6 border-t border-[var(--border-glass)] flex items-center justify-between text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">
        <div className="flex items-center gap-1.5">
          <Globe className="w-3 h-3" />
          <span>Earth Live Visualizer</span>
        </div>
        <span>v1.0.2</span>
      </div>
    </aside>
  );
}

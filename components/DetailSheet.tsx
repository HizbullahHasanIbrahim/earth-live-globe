"use client";

import { useRef } from "react";
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

interface DetailSheetProps {
  selectedEntity: SelectedEntity;
  onClose: () => void;
  onSelectEntity?: (entity: SelectedEntity) => void;
}

export default function DetailSheet({
  selectedEntity,
  onClose,
  onSelectEntity
}: DetailSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

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

  const getMagColor = (mag: number) => {
    if (mag < 4.5) return "text-emerald-500";
    if (mag < 5.5) return "text-[var(--mag-amber-text)]";
    if (mag < 6.0) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <div className="fixed inset-0 z-[110] pointer-events-none md:inset-auto md:w-full md:h-full">
      <div 
        ref={sheetRef}
        className={`
          pointer-events-auto transition-all duration-700 ease-fluid-strong
          fixed bottom-0 inset-x-0 fluid-glass-elevated border-t border-[var(--border-glass)] rounded-t-3xl shadow-[0_-20px_50px_-10px_rgba(0,0,0,0.3)] p-6 max-h-[48dvh] overflow-y-auto custom-scrollbar
          landscape:max-h-full landscape:top-0 landscape:bottom-0 landscape:right-0 landscape:left-auto landscape:w-[310px] landscape:rounded-none landscape:rounded-l-3xl landscape:border-t-0 landscape:border-l
          md:right-6 md:top-1/2 md:-translate-y-1/2 md:bottom-auto md:left-auto md:w-[340px] md:max-h-[80vh] md:rounded-3xl md:border md:fluid-glass-elevated
          ${selectedEntity ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-full opacity-0 scale-95'}
        `}
      >
        {/* Drag Grip (Mobile) */}
        <div className="w-10 h-1 bg-[var(--border-glass)] rounded-full mx-auto mb-6 md:hidden" />

        {/* Header Section */}
        <div className="flex items-start justify-between mb-6">
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
            className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-hover)] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="space-y-6">
          {isEq && (
            <>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--glass-hover)] border border-[var(--border-glass)]">
                <div className={`text-3xl font-display font-bold ${getMagColor(selectedEntity.data.mag)}`}>
                  {selectedEntity.data.mag.toFixed(1)}
                </div>
                <div>
                  <p className="text-[11px] font-bold text-[var(--text-primary)]">Magnitudo {getMagSeverity(selectedEntity.data.mag)}</p>
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
                className="flex items-center justify-between w-full p-4 rounded-2xl bg-[var(--accent-primary)] text-white shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
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

              <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Clock className="w-4 h-4" />
                <p className="text-[10px] font-bold uppercase tracking-wide">
                  Visibilitas: {selectedEntity.data.visibility === 'daylight' ? 'Terang Matahari' : 'Bayangan Bumi'}
                </p>
              </div>
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
                      return (
                        <button
                          key={route.id}
                          onClick={() => onSelectEntity?.({ type: "hub", data: targetHub })}
                          className="flex items-center justify-between w-full p-3 rounded-xl bg-[var(--glass-hover)] border border-[var(--border-glass)] hover:bg-[var(--glass-active)] transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] group-hover:scale-125 transition-transform" />
                            <span className="text-xs font-semibold text-[var(--text-primary)]">{targetHub.name} ({targetHub.country})</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
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
      </div>
    </div>
  );
}

"use client";

import { Activity, Satellite, Waypoints, RotateCw } from "lucide-react";
import { LayerVisibility, SelectedEntity } from "@/lib/types";

interface LayerDockProps {
  layers: LayerVisibility;
  toggleLayer: (layer: keyof LayerVisibility) => void;
  selectedEntity: SelectedEntity;
  autoRotate?: boolean;
  onToggleAutoRotate?: () => void;
}

export default function LayerDock({
  layers,
  toggleLayer,
  selectedEntity,
  autoRotate = true,
  onToggleAutoRotate
}: LayerDockProps) {
  // Hide dock on mobile when a detail sheet is open to avoid clutter
  const isSheetOpen = selectedEntity !== null;

  return (
    <div className={`fixed bottom-[max(1.5rem,calc(env(safe-area-inset-bottom)+0.75rem))] left-1/2 -translate-x-1/2 z-[90] transition-all duration-500 ease-spring ${isSheetOpen ? 'translate-y-24 opacity-0 pointer-events-none md:translate-y-0 md:opacity-100 md:pointer-events-auto' : 'translate-y-0 opacity-100'}`}>
      <div className="flex items-center gap-1.5 p-1.5 rounded-full fluid-glass shadow-2xl border border-[var(--border-glass)]">
        <button
          onClick={() => toggleLayer('earthquakes')}
          aria-pressed={layers.earthquakes}
          aria-label="Toggle layer gempa bumi"
          className={`min-h-[44px] min-w-[44px] flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-300 touch-manipulation ${layers.earthquakes ? 'bg-[var(--accent-primary)] text-white shadow-lg shadow-blue-500/25' : 'text-[var(--text-secondary)] hover:bg-[var(--glass-hover)]'}`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Gempa</span>
        </button>

        <button
          onClick={() => toggleLayer('iss')}
          aria-pressed={layers.iss}
          aria-label="Toggle layer ISS"
          className={`min-h-[44px] min-w-[44px] flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-300 touch-manipulation ${layers.iss ? 'bg-[var(--accent-primary)] text-white shadow-lg shadow-blue-500/25' : 'text-[var(--text-secondary)] hover:bg-[var(--glass-hover)]'}`}
        >
          <Satellite className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">ISS</span>
        </button>

        <button
          onClick={() => toggleLayer('routes')}
          aria-pressed={layers.routes}
          aria-label="Toggle layer rute konektivitas"
          className={`min-h-[44px] min-w-[44px] flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-300 touch-manipulation ${layers.routes ? 'bg-[var(--accent-primary)] text-white shadow-lg shadow-blue-500/25' : 'text-[var(--text-secondary)] hover:bg-[var(--glass-hover)]'}`}
        >
          <Waypoints className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Rute</span>
        </button>

        {/* Pemisah Vertikal Halus */}
        <div className="w-px h-5 bg-[var(--border-glass)] mx-0.5" />

        {/* Tombol Auto-Rotate [ ↻ Putar ] */}
        {onToggleAutoRotate && (
          <button
            onClick={onToggleAutoRotate}
            aria-pressed={autoRotate}
            aria-label="Toggle putaran otomatis bumi"
            title={autoRotate ? "Hentikan Putar Otomatis (Spasi)" : "Mulai Putar Otomatis (Spasi)"}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 touch-manipulation ${autoRotate ? 'bg-[var(--glass-active)] text-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/40 shadow-sm' : 'text-[var(--text-secondary)] hover:bg-[var(--glass-hover)]'}`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin [animation-duration:8s]' : ''}`} />
            <span className="hidden sm:inline">Putar</span>
          </button>
        )}
      </div>
    </div>
  );
}
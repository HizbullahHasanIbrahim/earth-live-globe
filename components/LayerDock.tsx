"use client";

import { Activity, Satellite, Waypoints } from "lucide-react";
import { LayerVisibility, SelectedEntity } from "@/lib/types";

interface LayerDockProps {
  layers: LayerVisibility;
  toggleLayer: (layer: keyof LayerVisibility) => void;
  selectedEntity: SelectedEntity;
}

export default function LayerDock({
  layers,
  toggleLayer,
  selectedEntity
}: LayerDockProps) {
  // Hide dock on mobile when a detail sheet is open to avoid clutter
  const isSheetOpen = selectedEntity !== null;

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] transition-all duration-500 ease-spring ${isSheetOpen ? 'translate-y-24 opacity-0 pointer-events-none md:translate-y-0 md:opacity-100 md:pointer-events-auto' : 'translate-y-0 opacity-100'}`}>
      <div className="flex items-center gap-1.5 p-1.5 rounded-full fluid-glass shadow-2xl border border-[var(--border-glass)]">
        <button
          onClick={() => toggleLayer('earthquakes')}
          aria-pressed={layers.earthquakes}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${layers.earthquakes ? 'bg-[var(--accent-primary)] text-white shadow-lg shadow-blue-500/25' : 'text-[var(--text-secondary)] hover:bg-[var(--glass-hover)]'}`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Gempa</span>
        </button>

        <button
          onClick={() => toggleLayer('iss')}
          aria-pressed={layers.iss}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${layers.iss ? 'bg-[var(--accent-primary)] text-white shadow-lg shadow-blue-500/25' : 'text-[var(--text-secondary)] hover:bg-[var(--glass-hover)]'}`}
        >
          <Satellite className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">ISS</span>
        </button>

        <button
          onClick={() => toggleLayer('routes')}
          aria-pressed={layers.routes}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${layers.routes ? 'bg-[var(--accent-primary)] text-white shadow-lg shadow-blue-500/25' : 'text-[var(--text-secondary)] hover:bg-[var(--glass-hover)]'}`}
        >
          <Waypoints className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Rute</span>
        </button>
      </div>
    </div>
  );
}
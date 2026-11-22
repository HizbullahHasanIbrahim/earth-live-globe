"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Globe, 
  Search, 
  RefreshCw, 
  RotateCcw, 
  Activity, 
  Sun, 
  Moon,
  MapPin,
  Satellite
} from "lucide-react";
import { ThemeMode, SelectedEntity, HubCity, EarthquakeEvent, IssTelemetry } from "@/lib/types";

interface TopCapsuleProps {
  theme: ThemeMode;
  setTheme: () => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  onResetView: () => void;
  isFeedOpen: boolean;
  toggleFeed: () => void;
  earthquakeCount: number;
  isFallback: boolean;
  hubs: HubCity[];
  earthquakes: EarthquakeEvent[];
  iss: IssTelemetry | null;
  onSelectEntity: (entity: SelectedEntity) => void;
}

type SearchResultType = { type: 'hub'; data: HubCity; label: string; sub: string } | { type: 'earthquake'; data: EarthquakeEvent; label: string; sub: string } | { type: 'iss'; label: string; sub: string };

export default function TopCapsule({
  theme,
  setTheme,
  isRefreshing,
  onRefresh,
  onResetView,
  isFeedOpen,
  toggleFeed,
  earthquakeCount,
  isFallback,
  hubs,
  earthquakes,
  iss,
  onSelectEntity
}: TopCapsuleProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const filteredResults: SearchResultType[] = searchQuery.length >= 2 ? [
    ...hubs.filter(h => 
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      h.country.toLowerCase().includes(searchQuery.toLowerCase())
    ).map(h => ({ type: 'hub' as const, data: h, label: `${h.name}, ${h.country}`, sub: 'Kota Hub' })),
    ...earthquakes.filter(e => 
      e.place.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 3).map(e => ({ type: 'earthquake' as const, data: e, label: e.place, sub: `M${e.mag.toFixed(1)}` })),
    ...("iss".includes(searchQuery.toLowerCase()) ? [{ type: 'iss' as const, label: 'ISS (International Space Station)', sub: 'Orbital Tracker' }] : [])
  ].slice(0, 6) : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-4 py-2 rounded-full fluid-glass shadow-2xl min-w-[320px] max-w-[95vw] transition-all duration-500">
      {/* Left: Brand & Status */}
      <div className="flex items-center gap-2.5 pr-2 border-r border-[var(--border-glass)]">
        <div className="p-1.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-primary)]">
          <Globe className="w-4 h-4" />
        </div>
        <div className="hidden sm:flex flex-col">
          <span className="text-xs font-bold tracking-tight text-[var(--text-primary)]">Earth Live</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isFallback ? 'bg-amber-500' : 'bg-emerald-500 animate-ping'}`} />
            <span className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">
              {isFallback ? 'Cached' : 'Live'}
            </span>
          </div>
        </div>
        <button 
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-hover)] transition-all ${isRefreshing ? 'animate-spin' : ''}`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Middle: Quick Search */}
      <div ref={searchRef} className="relative flex-1 min-w-[120px] sm:min-w-[200px]">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 ${isSearchFocused ? 'bg-[var(--glass-active)] ring-1 ring-[var(--accent-primary)]' : 'bg-[var(--glass-hover)]'}`}>
          <Search className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
          <input 
            type="text"
            placeholder="Cari lokasi, kota, atau ISS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            className="w-full bg-transparent border-none outline-none text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
          />
        </div>

        {/* Search Results Dropdown */}
        {isSearchFocused && filteredResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 p-2 rounded-2xl fluid-glass-elevated shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            {filteredResults.map((result, i) => (
              <button
                key={i}
                onClick={() => {
                  if (result.type === 'iss') {
                    if (iss) onSelectEntity({ type: 'iss', data: iss });
                  } else if (result.type === 'hub') {
                    onSelectEntity({ type: 'hub', data: result.data });
                  } else if (result.type === 'earthquake') {
                    onSelectEntity({ type: 'earthquake', data: result.data });
                  }
                  setSearchQuery("");
                  setIsSearchFocused(false);
                }}
                className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-[var(--glass-hover)] transition-colors text-left"
              >
                <div className="p-2 rounded-lg bg-[var(--accent-soft)] text-[var(--accent-primary)]">
                  {result.type === 'hub' && <MapPin className="w-3.5 h-3.5" />}
                  {result.type === 'earthquake' && <Activity className="w-3.5 h-3.5" />}
                  {result.type === 'iss' && <Satellite className="w-3.5 h-3.5" />}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-semibold text-[var(--text-primary)] truncate">{result.label}</span>
                  <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-bold">{result.sub}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Utils */}
      <div className="flex items-center gap-1 sm:gap-2 pl-2 border-l border-[var(--border-glass)]">
        <button
          onClick={toggleFeed}
          className={`relative p-2 rounded-full transition-all ${isFeedOpen ? 'bg-[var(--accent-primary)] text-white shadow-lg shadow-blue-500/20' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-hover)]'}`}
        >
          <Activity className="w-4 h-4" />
          {earthquakeCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border-2 border-[var(--bg-app)]">
              {earthquakeCount}
            </span>
          )}
        </button>

        <button
          onClick={onResetView}
          className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-hover)] transition-all"
          title="Reset Kamera"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={setTheme}
          className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-hover)] transition-all"
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        </button>
      </div>
    </header>
  );
}

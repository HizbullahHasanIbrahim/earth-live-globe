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
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const isSearchOpen = isSearchFocused && filteredResults.length > 0;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
        setHighlightIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex(prev => Math.min(prev + 1, filteredResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      const result = filteredResults[highlightIndex];
      if (result.type === 'iss') {
        if (iss) onSelectEntity({ type: 'iss', data: iss });
      } else if (result.type === 'hub') {
        onSelectEntity({ type: 'hub', data: result.data });
      } else if (result.type === 'earthquake') {
        onSelectEntity({ type: 'earthquake', data: result.data });
      }
      setSearchQuery("");
      setIsSearchFocused(false);
      setHighlightIndex(-1);
    } else if (e.key === "Escape") {
      setSearchQuery("");
      setIsSearchFocused(false);
      setHighlightIndex(-1);
      inputRef.current?.blur();
    }
  };

  return (
    <header className="fixed top-[max(1rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full fluid-glass shadow-2xl min-w-[320px] max-w-[95vw] transition-all duration-500 landscape:top-[max(0.5rem,env(safe-area-inset-top))] landscape:px-3 landscape:py-1 landscape:gap-2 landscape:min-w-[280px]">
      {/* Left: Brand & Status */}
      <div className="flex items-center gap-2 pr-1 sm:pr-2 border-r border-[var(--border-glass)]">
        <div className="p-1.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-primary)] shrink-0">
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
          aria-label="Refresh data gempa dan ISS"
          className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-hover)] transition-all touch-manipulation ${isRefreshing ? 'animate-spin' : ''}`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Middle: Quick Search */}
      <div ref={searchRef} className="relative flex-1 min-w-[120px] sm:min-w-[200px] landscape:min-w-[150px]">
        <div className={`flex items-center gap-2 px-3 min-h-[40px] rounded-full transition-all duration-300 ${isSearchFocused ? 'bg-[var(--glass-active)] ring-1 ring-[var(--accent-primary)]' : 'bg-[var(--glass-hover)]'}`}>
          <Search className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" />
          <input 
            ref={inputRef}
            type="text"
            placeholder="Cari lokasi, kota, atau ISS..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setHighlightIndex(-1);
            }}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={(e) => {
              // Only close if focus leaves the search container entirely
              if (!searchRef.current?.contains(e.relatedTarget as Node)) {
                setIsSearchFocused(false);
                setHighlightIndex(-1);
              }
            }}
            onKeyDown={handleKeyDown}
            role="combobox"
            aria-expanded={isSearchOpen}
            aria-controls="search-results-listbox"
            aria-autocomplete="list"
            className="w-full bg-transparent border-none outline-none text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
          />
        </div>

        {/* Search Results Dropdown */}
        {isSearchOpen && (
          <div 
            id="search-results-listbox"
            role="listbox"
            className="absolute top-full left-0 right-0 mt-2 p-2 rounded-2xl fluid-glass-elevated shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
          >
            {filteredResults.map((result, i) => (
              <button
                key={i}
                role="option"
                aria-selected={highlightIndex === i}
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
                  setHighlightIndex(-1);
                }}
                onMouseEnter={() => setHighlightIndex(i)}
                className={`flex items-center gap-3 w-full p-2.5 rounded-xl transition-colors text-left ${highlightIndex === i ? 'bg-[var(--glass-active)]' : 'hover:bg-[var(--glass-hover)]'}`}
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
      <div className="flex items-center gap-0.5 sm:gap-1.5 pl-1.5 sm:pl-2 border-l border-[var(--border-glass)]">
        <button
          onClick={toggleFeed}
          aria-pressed={isFeedOpen}
          aria-label="Toggle panel feed gempa"
          className={`relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-all touch-manipulation ${isFeedOpen ? 'bg-[var(--accent-primary)] text-white shadow-lg shadow-blue-500/20' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-hover)]'}`}
        >
          <Activity className="w-4 h-4" />
          {earthquakeCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border-2 border-[var(--bg-app)]">
              {earthquakeCount}
            </span>
          )}
        </button>

        <button
          onClick={onResetView}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-hover)] transition-all touch-manipulation"
          title="Reset Kamera"
          aria-label="Reset tampilan kamera"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={setTheme}
          aria-label={`Ubah tema ke mode ${theme === "dark" ? "terang" : "gelap"}`}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-hover)] transition-all touch-manipulation"
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        </button>
      </div>
    </header>
  );
}

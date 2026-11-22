"use client";

import { AlertTriangle, Globe2, RefreshCw } from "lucide-react";

interface StatusOverlaysProps {
  isLoading: boolean;
  webGlError: string | null;
  onRetry?: () => void;
}

export default function StatusOverlays({
  isLoading,
  webGlError,
  onRetry = () => window.location.reload()
}: StatusOverlaysProps) {
  // Fallback jika WebGL gagal diinisialisasi
  if (webGlError) {
    return (
      <div 
        className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-[var(--bg-app)]/90 backdrop-blur-2xl"
        role="alert"
        aria-live="assertive"
      >
        <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl fluid-glass-elevated border border-red-500/30 shadow-[0_20px_60px_-15px_rgba(239,68,68,0.3)] text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-inner">
            <AlertTriangle className="w-7 h-7 animate-bounce" />
          </div>
          
          <div className="space-y-1.5">
            <h2 className="text-base sm:text-lg font-display font-bold text-[var(--text-primary)]">
              Akselerasi WebGL Tidak Aktif
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Browser Anda tidak dapat menginisialisasi akselerasi grafis WebGL. Pastikan akselerasi perangkat keras diaktifkan di pengaturan browser Anda (Hardware Acceleration).
            </p>
          </div>

          <div className="p-3 rounded-xl bg-black/20 border border-[var(--border-glass)] text-[11px] font-mono text-[var(--text-secondary)] break-words text-left">
            <span className="font-bold text-red-400">Pesan Sistem: </span>
            {webGlError}
          </div>

          <button
            onClick={onRetry}
            className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-[var(--accent-primary)] hover:opacity-90 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 touch-manipulation"
          >
            <RefreshCw className="w-4 h-4" />
            Coba Muat Ulang Halaman
          </button>
        </div>
      </div>
    );
  }

  // Layar Loading Awal (Engine 3D & Tekstur Bumi) dengan transisi fade-out halus
  return (
    <div 
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[var(--bg-app)]/85 backdrop-blur-2xl transition-all duration-700 ease-fluid ${
        isLoading 
          ? "opacity-100 pointer-events-auto" 
          : "opacity-0 pointer-events-none select-none invisible"
      }`}
      aria-hidden={!isLoading}
      aria-label="Memuat aplikasi visualisasi bumi"
    >
      <div className="max-w-xs w-full p-6 sm:p-7 rounded-3xl fluid-glass-elevated border border-[var(--border-glass)] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] flex flex-col items-center text-center space-y-4">
        {/* Pulsing 3D Ring Animation */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[var(--accent-primary)]/30 animate-ping" />
          <div className="absolute inset-1 rounded-full border border-[var(--accent-primary)]/50 animate-pulse" />
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)] shadow-lg">
            <Globe2 className="w-6 h-6 animate-spin [animation-duration:8s]" />
          </div>
        </div>

        <div className="space-y-1">
          <h2 className="text-sm font-display font-bold text-[var(--text-primary)] tracking-wide">
            Earth Live Globe
          </h2>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
            Menyiapkan engine 3D & topografi bola dunia...
          </p>
        </div>

        {/* Shimmer loading bar */}
        <div className="w-full h-1.5 bg-[var(--border-glass)] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-cyan-300 rounded-full w-2/3 animate-[pulse_1.5s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}

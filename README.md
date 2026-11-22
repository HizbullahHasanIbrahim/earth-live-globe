# 🌍 Earth Live Visualizer & 3D Interactive Data Globe

[![Next.js](https://img.shields.io/badge/Next.js-16.4.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r187-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](#)

A high-performance, photorealistic interactive 3D Earth visualizer built with **Next.js 16 (Turbopack)**, **React 19**, and **Three.js**. Designed under the **Apple Fluid Glass** design philosophy (visionOS / macOS Sonoma inspired), featuring live USGS earthquake feeds, real-time International Space Station (ISS) orbital tracking, and global connectivity 3D Bézier arcs.

---

## ✨ Key Features & Real-Time Layers

### 🌋 Layer 1: Real-Time Global Earthquake Monitor (USGS API)
* **Live USGS GeoJSON Stream:** Real-time updates with **24-Hour** (`all_day.geojson`) and **7-Day** (`all_week.geojson`) toggles.
* **Zero-Allocation 3D Pillars:** Rendered with `THREE.InstancedMesh` for up to 180 concurrent seismic events with 0 runtime GC spikes.
* **GPU Procedural Pulse Rings:** Expanding ripple rings centered at epicenters, colored by magnitude severity.
* **Magnitude Severity Classification:**
  * 🟢 **M < 4.5:** Minor (Green)
  * 🟡 **4.5 ≤ M < 5.5:** Moderate (Amber)
  * 🟠 **5.5 ≤ M < 6.0:** Strong (Orange)
  * 🔴 **M ≥ 6.0:** Major / Severe (Crimson)
* **Feed Filters & Sorting:** Filter by magnitude (`Semua`, `M4.5+`, `M5.5+`, `M6.0+`) and sort by **Terbaru (Newest)** or **M Terbesar (Highest Magnitude)**.

### 🛰️ Layer 2: International Space Station (ISS Live Tracking)
* **Live Telemetry Stream:** Automated polling via `Where The ISS At API` (latitude, longitude, altitude, velocity, and day/night orbital visibility).
* **3D Satellite Model:** Complete with solar arrays oriented tangentially to Earth's curvature.
* **Orbital Trail:** Dynamic 40-point fading orbital path displaying recent travel history.
* **Geodesic Footprint & Nadir Line:** Circular ground coverage footprint ($\approx 1{,}000\text{ km}$ signal horizon) and vertical projection line directly to the sub-satellite point.
* **"Kunci & Ikuti ISS" Mode:** Real-time smooth camera lock that tracks the ISS orbit seamlessly, with automatic release on user interaction.

### 🌐 Layer 3: Global Connectivity Hubs & 3D Bézier Arcs
* **15 Strategic Global Hubs:** Jakarta, Singapore, Tokyo, Hong Kong, Mumbai, Sydney, Dubai, Cairo, Johannesburg, Paris, London, Frankfurt, New York, San Francisco, and São Paulo.
* **Animated Flow Arcs:** Quadratic 3D Bézier curves (`THREE.QuadraticBezierCurve3`) with custom GLSL pulse waves traveling between hubs.
* **Geodesic Metrics:** Real-time calculation of Great-Circle Haversine distances ($\text{km}$), fiber round-trip network latency ($\text{ms}$ RTT), and estimated flight durations.

---

## 💎 Apple Fluid Glass Design System

* **Translucent Frosted Glass:** `backdrop-filter: blur(24px)` with specular border highlights and soft elevation shadows.
* **Fluid Spring Physics:** Custom CSS timing functions (`--ease-fluid`, `--ease-spring`) for organic, responsive drawer and bottom sheet animations.
* **Dynamic Theme Switcher:**
  * **Dark Mode:** Deep space starfield (1,200 particle field), neon atmospheric Rayleigh glow, cyan/amber glowing telemetry.
  * **Light Mode:** High-key studio ambient lighting, clean terrestrial topography, deep cobalt connectivity routes.
* **Multi-Touch & Mobile First:**
  * Fully responsive across desktop drawers, landscape inspection sidebars, and portrait bottom sheets.
  * Multi-touch gesture protection: `Set` pointer tracking distinguishes pinch-zoom from taps ($< 6\text{ px}$).
  * Full adherence to mobile safe areas (`env(safe-area-inset-*)`) and $\ge 44 \times 44\text{ px}$ touch targets.
* **Status Overlays:** Frosted loading screen with pulsing Earth wireframe and WebGL hardware acceleration fallback detection.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|:---:|:---|
| <kbd>Space</kbd> | Toggle Earth Auto-Rotation (On / Off) |
| <kbd>/</kbd> | Instant Search Bar Focus |
| <kbd>R</kbd> | Reset Camera View to Default Horizon |
| <kbd>Esc</kbd> | Close Detail Inspector & Deselect Entity |

---

## 📐 Mathematical & 3D Formulations

### 1. Geographic to Cartesian Spherical Mapping
Aligned with standard Three.js UV sphere mapping of radius $R$:
$$\phi = (90 - \text{lat}) \cdot \frac{\pi}{180}, \qquad \theta = (\text{lon} + 180) \cdot \frac{\pi}{180}$$
$$x = -R \sin(\phi)\cos(\theta), \qquad y = R \cos(\phi), \qquad z = R \sin(\phi)\sin(\theta)$$

### 2. 3D Quadratic Bézier Arc Elevation
Given endpoints $\mathbf{P}_0$ and $\mathbf{P}_2$ with angular separation $\alpha = \arccos\!\left(\frac{\mathbf{P}_0 \cdot \mathbf{P}_2}{R^2}\right)$, the normalized midpoint vector $\hat{\mathbf{M}} = \frac{\mathbf{P}_0 + \mathbf{P}_2}{\|\mathbf{P}_0 + \mathbf{P}_2\|}$ is pushed outward:
$$\mathbf{P}_1 = \hat{\mathbf{M}} \cdot \left(R + h_{\min} + k \cdot \alpha\right)$$

### 3. Great-Circle Geodesic Distance (Haversine)
$$d = 2 R \arcsin \left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$

---

## 🏗️ Architecture & Project Structure

```
earth-live-globe/
├── app/
│   ├── layout.tsx            # Metadata, fonts (Plus Jakarta Sans, Space Grotesk, JetBrains Mono)
│   ├── page.tsx              # Main orchestrator (HUD, state, keyboard listeners)
│   └── globals.css           # Tailwind v4 theme, design tokens, fluid springs
├── components/
│   ├── GlobeCanvas.tsx       # 3D Three.js engine (zero-allocation render loop, WebGL shaders)
│   ├── TopCapsule.tsx        # Top HUD (Live indicator, Search bar, Theme toggle)
│   ├── LayerDock.tsx         # Floating bottom dock (Layers, Auto-Rotate, Reset view)
│   ├── FeedPanel.tsx         # Left drawer / Mobile sheet (Earthquake feed, sorting, USGS range)
│   ├── DetailSheet.tsx       # Right Inspector (340px floating card for earthquake/ISS/hub)
│   └── StatusOverlays.tsx    # Frosted glass initial loader & WebGL fallback modal
├── lib/
│   ├── geo.ts                # Geodesic conversions, Haversine, 3D Bézier curves
│   ├── earthTexture.ts       # Canvas topography generator (Dark/Light) from World Atlas TopoJSON
│   ├── api.ts                # Resilient fetchers with timeout & fallback (USGS & ISS)
│   └── types.ts              # Strict TypeScript definitions
└── data/
    └── routes.ts             # 15 global hub cities & intercontinental route network
```

---

## 🚀 Getting Started

### Prerequisites
* Node.js 18.18+ or Node.js 20+
* npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/HizbullahHasanIbrahim/earth-live-globe.git
   cd earth-live-globe
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to [http://localhost:3000](http://localhost:3000).

### Production Build & Linting

```bash
# Verify TypeScript types
npx tsc --noEmit

# Run ESLint validation
npm run lint

# Build optimized production bundle
npm run build
```

---

## ⚡ Performance & Engineering Best Practices

* **Zero-Allocation 60 FPS Loop:** Reusable object pools (`THREE.Vector3`, `THREE.Quaternion`, `THREE.Matrix4`) prevent garbage collection pauses during orbital animation.
* **InstancedMesh GPU Rendering:** Renders hundreds of interactive seismic pins and pulse rings within single draw calls.
* **Texture Generation Caching:** Off-thread TopoJSON world atlas rasterization with in-flight Promise caching to eliminate redundant texture generation.
* **Power & Battery Efficiency:** Automatic animation frame pausing via `visibilitychange` when browser tabs are hidden.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

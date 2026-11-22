import * as THREE from "three";
import { feature } from "topojson-client";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - world-atlas ships raw JSON without type declarations
import countries110m from "world-atlas/countries-110m.json";
import type { Topology } from "topojson-specification";

interface CountryFeature {
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
}

// Cache for generated textures to eliminate main-thread lag during theme toggles
const textureCache = new Map<string, THREE.Texture>();

/**
 * Menggambar tekstur equirectangular 2:1 (2048x1024 desktop / 1024x512 mobile)
 * menggunakan data TopoJSON world-atlas/countries-110m.json secara presisi geografis.
 */
export async function generateEarthTexture(theme: "dark" | "light"): Promise<THREE.Texture> {
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
  const cacheKey = `${theme}-${isMobile ? "m" : "d"}`;

  const cached = textureCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const width = isMobile ? 1024 : 2048;
  const height = isMobile ? 512 : 1024;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context not supported");
  }

  const isDark = theme === "dark";

  // 1. Gradien Latar Lautan
  const oceanGradient = ctx.createLinearGradient(0, 0, 0, height);
  if (isDark) {
    oceanGradient.addColorStop(0, "#03060f");
    oceanGradient.addColorStop(0.5, "#061225");
    oceanGradient.addColorStop(1, "#0a1930");
  } else {
    oceanGradient.addColorStop(0, "#f0f6ff");
    oceanGradient.addColorStop(0.5, "#dbeafe");
    oceanGradient.addColorStop(1, "#bfdbfe");
  }
  ctx.fillStyle = oceanGradient;
  ctx.fillRect(0, 0, width, height);

  // 2. Graticule (Garis Lintang & Bujur Halus)
  ctx.beginPath();
  ctx.lineWidth = isMobile ? 0.5 : 0.75;
  ctx.strokeStyle = isDark ? "rgba(56, 189, 248, 0.10)" : "rgba(148, 163, 184, 0.18)";

  const degToX = (lon: number) => ((lon + 180) / 360) * width;
  const degToY = (lat: number) => ((90 - lat) / 180) * height;

  for (let lon = -180; lon <= 180; lon += 30) {
    const x = degToX(lon);
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let lat = -90; lat <= 90; lat += 30) {
    const y = degToY(lat);
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();

  // 3. Gambar Benua & Batas Negara dari TopoJSON (dengan perlindungan antimeridian)
  const topology = countries110m as unknown as Topology;

  const geoCollection = feature(
    topology,
    topology.objects.countries
  ) as unknown as { features: CountryFeature[] };

  ctx.fillStyle = isDark ? "#17253b" : "#eef2f7";
  ctx.strokeStyle = isDark ? "rgba(56, 189, 248, 0.35)" : "#94a3b8";
  ctx.lineWidth = isMobile ? 0.5 : 0.85;

  const drawRing = (ring: number[][]) => {
    ctx.beginPath();
    let prevLon = 0;
    for (let i = 0; i < ring.length; i++) {
      const coord = ring[i];
      const pointLon = coord[0];
      const lat = coord[1];

      // Cegah garis rusak melintasi antimeridian (±180°)
      if (i > 0 && Math.abs(pointLon - prevLon) > 180) {
        ctx.stroke();
        ctx.beginPath();
      }

      const x = degToX(pointLon);
      const y = degToY(lat);

      if (i === 0 || Math.abs(pointLon - prevLon) > 180) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      prevLon = pointLon;
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  geoCollection.features.forEach((country) => {
    if (!country.geometry) return;
    if (country.geometry.type === "Polygon") {
      const polygons = country.geometry.coordinates as number[][][];
      polygons.forEach((ring) => drawRing(ring));
    } else if (country.geometry.type === "MultiPolygon") {
      const multiPolygons = country.geometry.coordinates as number[][][][];
      multiPolygons.forEach((polygon) => {
        polygon.forEach((ring) => drawRing(ring));
      });
    }
  });

  // 4. Titik Lampu Kota Hangat (Dark Mode) / Tekstur Halus (Light Mode)
  if (isDark) {
    const majorCities = [
      [106.8, -6.2], [116.4, 39.9], [139.7, 35.7], [77.2, 28.6],
      [-74.0, 40.7], [-0.1, 51.5], [55.3, 25.2], [151.2, -33.9],
      [-46.6, -23.5], [37.6, 55.7], [31.2, 30.0], [-118.2, 34.0]
    ];
    ctx.fillStyle = "rgba(255, 209, 128, 0.45)";
    majorCities.forEach(([lon, lat]) => {
      const x = degToX(lon);
      const y = degToY(lat);
      ctx.beginPath();
      ctx.arc(x, y, isMobile ? 1.0 : 1.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;

  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Helper pembersihan texture saat unmount atau refresh total
 */
export function disposeEarthTexture(texture: THREE.Texture): void {
  // Hanya dispose jika tekstur tidak tersimpan dalam cache aktif
  for (const [, cached] of textureCache.entries()) {
    if (cached === texture) return;
  }
  texture.dispose();
}

/**
 * Bersihkan seluruh texture cache saat app unmount
 */
export function clearEarthTextureCache(): void {
  for (const [, tex] of textureCache.entries()) {
    tex.dispose();
  }
  textureCache.clear();
}
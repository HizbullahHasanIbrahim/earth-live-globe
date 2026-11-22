import * as THREE from "three";

/**
 * Convert latitude and longitude to a Three.js Vector3 on a sphere.
 * @param lat - Latitude in degrees.
 * @param lon - Longitude in degrees.
 * @param radius - Sphere radius (e.g., Earth radius).
 * @param out - Optional Vector3 to reuse for zero-allocation.
 * @returns Vector3 representing the 3D point on the sphere surface.
 *
 * Rumus geospasial (berdasarkan koordinat topografis bumi):
 *   phi = (90 - lat) * (π/180)      // sudut kolat (dari perbatasan Bumi)
 *   theta = (lon + 180) * (π/180)   // sudut lintang (dari meridian utama)
 *   x = -radius * sin(phi) * cos(theta)
 *   y = radius * cos(phi)
 *   z = radius * sin(phi) * sin(theta)
 */
export function latLonToVector3(
  lat: number,
  lon: number,
  radius: number,
  out?: THREE.Vector3
): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return out ? out.set(x, y, z) : new THREE.Vector3(x, y, z);
}

/**
 * Helper untuk membuat kurva Bézier kuadratik 3D antara dua titik permukaan Bumi.
 * @param startLat - Latitude titik awal.
 * @param startLon - Longitude titik awal.
 * @param endLat - Latitude titik akhir.
 * @param endLon - Longitude titik akhir.
 * @param radius - Radius Bumi.
 * @param altitudeScale - Skala tinggi lengkungan (default 0.5).
 * @returns THREE.QuadraticBezierCurve3.
 *
 * Vektor tengah (midpoint) dinormalisasi untuk menentukan arah lengkungan:
 *   P0 = titik awal (lat, lon)
 *   P2 = titik akhir (lat, lon)
 *   M  = (P0 + P2) / ||P0 + P2|| (vektor tengah yang dinormalisasi)
 *   P1 = M * (radius + h_min + k * alpha)
 *   di mana h_min adalah ketinggian minimum di atas permukaan Bumi, k adalah faktor skala lengkungan.
 */
export function createArcCurve(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number,
  radius: number,
  altitudeScale: number = 0.5
): THREE.QuadraticBezierCurve3 {
  // Convert lat/lon to Vector3 for start and end points
  const startVec = latLonToVector3(startLat, startLon, radius);
  const endVec = latLonToVector3(endLat, endLon, radius);

  // Normalize midpoint vector (sum of start and end vectors)
  const midVec = new THREE.Vector3(startVec.x + endVec.x, startVec.y + endVec.y, startVec.z + endVec.z);
  const normMid = Math.sqrt(midVec.x * midVec.x + midVec.y * midVec.y + midVec.z * midVec.z);
  if (normMid === 0) {
    // Same point, return a degenerate curve
    return new THREE.QuadraticBezierCurve3(startVec, startVec, endVec);
  }
  const normalizedMid = new THREE.Vector3(
    midVec.x / normMid,
    midVec.y / normMid,
    midVec.z / normMid
  );

  // Calculate angular distance (alpha) between start and end points
  const dotProduct = startVec.x * endVec.x + startVec.y * endVec.y + startVec.z * endVec.z;
  const clampedDot = THREE.MathUtils.clamp(dotProduct / (radius * radius), -1, 1);
  const alpha = Math.acos(clampedDot);

  // Compute the control point offset along the normalized midpoint
  const offset = normalizedMid.clone().multiplyScalar(Math.max(0.35, altitudeScale * radius * alpha));

  // Compute control points for the curve
  const p0 = startVec.clone();
  const p2 = endVec.clone();
  const p1 = normalizedMid.clone().multiplyScalar(radius).add(offset);


  // Create the curve
  return new THREE.QuadraticBezierCurve3(p0, p1, p2);
}

/**
 * Menghitung jarak lingkaran besar (geodesic distance) antara dua titik koordinat
 * menggunakan rumus Haversine sesuai spesifikasi PRD Section 4.3:
 *   d = 2 * R * arcsin(sqrt(sin^2(Δphi/2) + cos(phi1)*cos(phi2)*sin^2(Δlambda/2)))
 *   dengan R = 6371 km
 *
 * @param lat1 Latitude titik 1 (derajat)
 * @param lon1 Longitude titik 1 (derajat)
 * @param lat2 Latitude titik 2 (derajat)
 * @param lon2 Longitude titik 2 (derajat)
 * @returns Jarak geodesik dalam kilometer (km)
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius rata-rata Bumi dalam km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const radLat1 = lat1 * (Math.PI / 180);
  const radLat2 = lat2 * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Estimasi latensi jaringan fiber optik antar hub dunia
 * berdasarkan kecepatan sinyal dalam kaca (~200.000 km/s) + ~40% overhead perutean.
 * @param distanceKm Jarak dalam km
 * @returns Estimasi Round-Trip Time (RTT) dalam ms
 */
export function estimateNetworkLatency(distanceKm: number): number {
  // RTT = (2 * distance / 200,000) * 1000 ms * 1.4 routing overhead
  return Math.round((distanceKm / 100) * 1.4);
}

/**
 * Estimasi waktu tempuh penerbangan komersial (~850 km/jam).
 * @param distanceKm Jarak dalam km
 * @returns Format jam dan menit (mis. "7j 15m")
 */
export function estimateFlightDuration(distanceKm: number): string {
  const totalHours = distanceKm / 850 + 0.5; // +30 menit take-off/landing
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);
  return `${hours}j ${minutes}m`;
}
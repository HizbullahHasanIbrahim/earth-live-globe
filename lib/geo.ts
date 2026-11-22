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
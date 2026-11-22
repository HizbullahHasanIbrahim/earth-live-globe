"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { generateEarthTexture, disposeEarthTexture } from "@/lib/earthTexture";
import {
  ThemeMode,
  EarthquakeEvent,
  IssTelemetry,
  HubCity,
  ArcRoute,
  LayerVisibility,
  SelectedEntity
} from "@/lib/types";
import { latLonToVector3, createArcCurve } from "@/lib/geo";

export interface GlobeCanvasProps {
  theme: ThemeMode;
  earthquakes: EarthquakeEvent[];
  iss: IssTelemetry | null;
  hubs: HubCity[];
  routes: ArcRoute[];
  layers: LayerVisibility;
  selectedEntity: SelectedEntity;
  onSelectEntity: (entity: SelectedEntity) => void;
}

const EARTH_RADIUS = 5.0;
const ISS_ALTITUDE = 0.38;
const HUB_ALTITUDE = 0.02;

// Vector and object pool allocated once outside render loop
const V_UP = new THREE.Vector3(0, 1, 0);
const V_NORMAL = new THREE.Vector3();
const V_POS = new THREE.Vector3();
const V_SCALE = new THREE.Vector3();
const V_CAM_TARGET = new THREE.Vector3();
const Q_ROT = new THREE.Quaternion();
const M_TRANSFORM = new THREE.Matrix4();
const C_COLOR = new THREE.Color();
const RAY_MOUSE = new THREE.Vector2();

function getMagnitudeColor(mag: number, outColor: THREE.Color): THREE.Color {
  if (mag < 4.5) {
    return outColor.setHex(0x22c55e); // Green
  } else if (mag < 5.5) {
    return outColor.setHex(0xf59e0b); // Amber/Yellow
  } else if (mag < 6.0) {
    return outColor.setHex(0xf97316); // Orange
  } else {
    return outColor.setHex(0xef4444); // Bright Red
  }
}

// Custom shader for animated arc pulse
const ArcShader = {
  vertexShader: `
    attribute float aProgress;
    varying float vProgress;
    void main() {
      vProgress = aProgress;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    uniform float uOpacity;
    uniform float uTime;
    varying float vProgress;
    void main() {
      // Flow pulse wave along path
      float pulse = fract(vProgress - uTime * 0.45);
      float glow = smoothstep(0.85, 1.0, pulse) * 1.8 + smoothstep(0.0, 1.0, pulse) * 0.35;
      gl_FragColor = vec4(uColor * glow, uOpacity * clamp(glow, 0.4, 1.0));
    }
  `
};

export default function GlobeCanvas({
  theme,
  earthquakes,
  iss,
  hubs,
  routes,
  layers,
  selectedEntity,
  onSelectEntity
}: GlobeCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // References to keep callbacks and render loop synced without re-triggering effects
  const earthquakesRef = useRef<EarthquakeEvent[]>(earthquakes);
  const hubsRef = useRef<HubCity[]>(hubs);
  const issRef = useRef<IssTelemetry | null>(iss);
  const selectedEntityRef = useRef<SelectedEntity>(selectedEntity);
  const onSelectEntityRef = useRef(onSelectEntity);
  const themeRef = useRef<ThemeMode>(theme);
  const layersRef = useRef<LayerVisibility>(layers);

  // Update refs safely after commit
  useEffect(() => {
    earthquakesRef.current = earthquakes;
    hubsRef.current = hubs;
    issRef.current = iss;
    selectedEntityRef.current = selectedEntity;
    onSelectEntityRef.current = onSelectEntity;
    themeRef.current = theme;
    layersRef.current = layers;
  });

  // Scene object refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const globeMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const atmosphereMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);

  // Layer meshes & groups
  const eqInstancedMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const hubInstancedMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const issGroupRef = useRef<THREE.Group | null>(null);
  const issTrailLineRef = useRef<THREE.Line | null>(null);
  const issTrailGeoRef = useRef<THREE.BufferGeometry | null>(null);
  const routesGroupRef = useRef<THREE.Group | null>(null);
  const arcMaterialsRef = useRef<THREE.ShaderMaterial[]>([]);

  // Smooth ISS motion
  const issCurrentPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, EARTH_RADIUS + ISS_ALTITUDE));
  const issTargetPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, EARTH_RADIUS + ISS_ALTITUDE));
  const issTrailPositionsRef = useRef<THREE.Vector3[]>([]);

  // Camera fly-to state
  const isFlyingRef = useRef<boolean>(false);
  const flyTargetPosRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const flyLookTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  // Initialize WebGL Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
      });
    } catch (e) {
      console.error("WebGL initialization failed:", e);
      return;
    }

    const isMobile = window.innerWidth <= 768;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2.0));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 4, 15);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 6.2;
    controls.maxDistance = 28.0;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.4;
    controls.enablePan = false;
    controlsRef.current = controls;

    // Lighting
    const isDark = themeRef.current === "dark";
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.9 : 1.3);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const dirLight = new THREE.DirectionalLight(0xffffff, isDark ? 1.6 : 2.1);
    dirLight.position.set(12, 10, 10);
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // Earth Sphere
    const earthGeo = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({
      roughness: 0.75,
      metalness: 0.1
    });
    const globeMesh = new THREE.Mesh(earthGeo, earthMat);
    scene.add(globeMesh);
    globeMaterialRef.current = earthMat;

    // Atmosphere Glow
    const atmosGeo = new THREE.SphereGeometry(EARTH_RADIUS * 1.05, 64, 64);
    const atmosMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: {
        glowColor: { value: new THREE.Color(isDark ? 0x38bdf8 : 0x60a5fa) }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        uniform vec3 glowColor;
        void main() {
          float intensity = pow(clamp(-dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 3.2);
          gl_FragColor = vec4(glowColor, intensity * 0.72);
        }
      `
    });
    const atmosphereMesh = new THREE.Mesh(atmosGeo, atmosMat);
    scene.add(atmosphereMesh);
    atmosphereMaterialRef.current = atmosMat;

    // Starfield for Dark Mode
    const starCount = 1200;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const radius = 80 + Math.random() * 80;
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      starPos[i] = radius * Math.sin(phi) * Math.cos(theta);
      starPos[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPos[i + 2] = radius * Math.cos(phi);
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.8,
      transparent: true,
      opacity: isDark ? 0.6 : 0.0,
      depthWrite: false
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // Initial Earth Texture Generation
    let active = true;
    generateEarthTexture(themeRef.current).then((tex) => {
      if (active && globeMaterialRef.current) {
        globeMaterialRef.current.map = tex;
        globeMaterialRef.current.needsUpdate = true;
      } else {
        disposeEarthTexture(tex);
      }
    });

    // Layer 2: ISS Marker Group + Orbit Trail
    const issGroup = new THREE.Group();
    issGroup.visible = layersRef.current.iss;
    scene.add(issGroup);
    issGroupRef.current = issGroup;

    // ISS Body: Core sphere + solar panel wings
    const issCoreGeo = new THREE.SphereGeometry(0.075, 16, 16);
    const issCoreMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.9,
      roughness: 0.2
    });
    const issCore = new THREE.Mesh(issCoreGeo, issCoreMat);
    issGroup.add(issCore);

    const wingGeo = new THREE.BoxGeometry(0.32, 0.015, 0.08);
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      emissive: 0x3b82f6,
      emissiveIntensity: 0.5,
      roughness: 0.3
    });
    const issWing = new THREE.Mesh(wingGeo, wingMat);
    issGroup.add(issWing);

    // Orbit Trail Line (max 40 points)
    const maxTrailPoints = 40;
    const trailPositions = new Float32Array(maxTrailPoints * 3);
    const issTrailGeo = new THREE.BufferGeometry();
    issTrailGeo.setAttribute("position", new THREE.BufferAttribute(trailPositions, 3));
    issTrailGeo.setDrawRange(0, 0);
    issTrailGeoRef.current = issTrailGeo;

    const issTrailMat = new THREE.LineBasicMaterial({
      color: isDark ? 0x38bdf8 : 0x2563eb,
      transparent: true,
      opacity: isDark ? 0.65 : 0.85,
      linewidth: 1.5
    });
    const issTrailLine = new THREE.Line(issTrailGeo, issTrailMat);
    issTrailLine.visible = layersRef.current.iss;
    scene.add(issTrailLine);
    issTrailLineRef.current = issTrailLine;

    // Layer 3: Routes Group
    const routesGroup = new THREE.Group();
    routesGroup.visible = layersRef.current.routes;
    scene.add(routesGroup);
    routesGroupRef.current = routesGroup;

    // Raycasting & Pointer Tracking (Multi-touch guard < 6px)
    const activePointers = new Set<number>();
    let startX = 0;
    let startY = 0;
    const raycaster = new THREE.Raycaster();

    const handlePointerDown = (e: PointerEvent) => {
      activePointers.add(e.pointerId);
      if (activePointers.size === 1) {
        startX = e.clientX;
        startY = e.clientY;
      }
    };

    const handlePointerCancel = (e: PointerEvent) => {
      activePointers.delete(e.pointerId);
    };

    const handlePointerUp = (e: PointerEvent) => {
      activePointers.delete(e.pointerId);
      if (activePointers.size > 0) return; // Multiple fingers engaged (pinch zoom)

      const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
      if (dist >= 6) return; // Dragged, not tap

      const rect = renderer.domElement.getBoundingClientRect();
      RAY_MOUSE.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      RAY_MOUSE.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(RAY_MOUSE, camera);

      // Collect test targets that are active and visible
      const testObjects: THREE.Object3D[] = [];
      if (eqInstancedMeshRef.current && layersRef.current.earthquakes) {
        testObjects.push(eqInstancedMeshRef.current);
      }
      if (hubInstancedMeshRef.current && layersRef.current.routes) {
        testObjects.push(hubInstancedMeshRef.current);
      }
      if (issGroupRef.current && layersRef.current.iss) {
        testObjects.push(issGroupRef.current);
      }

      const intersects = raycaster.intersectObjects(testObjects, true);
      if (intersects.length > 0) {
        const hit = intersects[0];

        // 1. Earthquake Hit
        if (hit.object === eqInstancedMeshRef.current && hit.instanceId !== undefined) {
          const eq = earthquakesRef.current[hit.instanceId];
          if (eq) {
            onSelectEntityRef.current({ type: "earthquake", data: eq });
            return;
          }
        }

        // 2. Hub City Hit
        if (hit.object === hubInstancedMeshRef.current && hit.instanceId !== undefined) {
          const hub = hubsRef.current[hit.instanceId];
          if (hub) {
            onSelectEntityRef.current({ type: "hub", data: hub });
            return;
          }
        }

        // 3. ISS Hit
        let parent: THREE.Object3D | null = hit.object;
        while (parent && parent !== scene) {
          if (parent === issGroupRef.current && issRef.current) {
            onSelectEntityRef.current({ type: "iss", data: issRef.current });
            return;
          }
          parent = parent.parent;
        }
      } else {
        // Tapped empty space
        onSelectEntityRef.current(null);
      }
    };

    // Hover cursor feedback on desktop
    const handlePointerMove = (e: PointerEvent) => {
      if (activePointers.size > 0) return;
      const rect = renderer.domElement.getBoundingClientRect();
      RAY_MOUSE.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      RAY_MOUSE.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(RAY_MOUSE, camera);

      const testObjects: THREE.Object3D[] = [];
      if (eqInstancedMeshRef.current && layersRef.current.earthquakes) {
        testObjects.push(eqInstancedMeshRef.current);
      }
      if (hubInstancedMeshRef.current && layersRef.current.routes) {
        testObjects.push(hubInstancedMeshRef.current);
      }
      if (issGroupRef.current && layersRef.current.iss) {
        testObjects.push(issGroupRef.current);
      }

      const hits = raycaster.intersectObjects(testObjects, true);
      renderer.domElement.style.cursor = hits.length > 0 ? "pointer" : "default";
    };

    // User drag cancels fly-to animation immediately
    const onControlsStart = () => {
      isFlyingRef.current = false;
    };
    controls.addEventListener("start", onControlsStart);

    const dom = renderer.domElement;
    dom.addEventListener("pointerdown", handlePointerDown);
    dom.addEventListener("pointerup", handlePointerUp);
    dom.addEventListener("pointercancel", handlePointerCancel);
    dom.addEventListener("pointermove", handlePointerMove);

    // Resize handling
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    // 60 FPS Render Loop (Strict Zero-Allocation)
    let animationId: number;
    let prevTime = performance.now();

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const currTime = performance.now();
      const delta = Math.min((currTime - prevTime) / 1000, 0.1);
      prevTime = currTime;

      // Update arc shader uniforms (flow animation along Bézier curve)
      const uTimeVal = currTime * 0.001;
      for (let i = 0; i < arcMaterialsRef.current.length; i++) {
        arcMaterialsRef.current[i].uniforms.uTime.value = uTimeVal;
      }

      // Smooth ISS position interpolation (lerp)
      if (issGroupRef.current && issGroupRef.current.visible) {
        issCurrentPosRef.current.lerp(issTargetPosRef.current, delta * 3.5);
        issGroupRef.current.position.copy(issCurrentPosRef.current);

        // Orient solar panels tangential to Earth
        V_NORMAL.copy(issCurrentPosRef.current).normalize();
        Q_ROT.setFromUnitVectors(V_UP, V_NORMAL);
        issGroupRef.current.quaternion.copy(Q_ROT);
      }

      // Camera Fly-To Animation (Smooth exponential decay)
      if (isFlyingRef.current) {
        controls.autoRotate = false;
        const blend = 1.0 - Math.exp(-delta * 5.0);
        camera.position.lerp(flyTargetPosRef.current, blend);
        controls.target.lerp(flyLookTargetRef.current, blend);

        // End fly-to when arrived close enough
        if (camera.position.distanceTo(flyTargetPosRef.current) < 0.05) {
          isFlyingRef.current = false;
        }
      } else {
        controls.autoRotate = selectedEntityRef.current === null;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Comprehensive unmount cleanup
    return () => {
      active = false;
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      controls.removeEventListener("start", onControlsStart);

      dom.removeEventListener("pointerdown", handlePointerDown);
      dom.removeEventListener("pointerup", handlePointerUp);
      dom.removeEventListener("pointercancel", handlePointerCancel);
      dom.removeEventListener("pointermove", handlePointerMove);

      controls.dispose();

      // Dispose earth and atmosphere
      earthGeo.dispose();
      if (globeMaterialRef.current?.map) {
        disposeEarthTexture(globeMaterialRef.current.map);
      }
      earthMat.dispose();
      atmosGeo.dispose();
      atmosMat.dispose();
      starGeo.dispose();
      starMat.dispose();

      // Dispose ISS
      issCoreGeo.dispose();
      issCoreMat.dispose();
      wingGeo.dispose();
      wingMat.dispose();
      issTrailGeo.dispose();
      issTrailMat.dispose();

      // Dispose earthquakes and hubs
      if (eqInstancedMeshRef.current) {
        eqInstancedMeshRef.current.geometry.dispose();
        (eqInstancedMeshRef.current.material as THREE.Material).dispose();
      }
      if (hubInstancedMeshRef.current) {
        hubInstancedMeshRef.current.geometry.dispose();
        (hubInstancedMeshRef.current.material as THREE.Material).dispose();
      }

      // Dispose routes
      arcMaterialsRef.current.forEach((m) => m.dispose());
      arcMaterialsRef.current = [];

      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, []); // Run once on mount

  // React to Theme Mode Changes
  useEffect(() => {
    const isDark = theme === "dark";

    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = isDark ? 0.9 : 1.3;
    }
    if (dirLightRef.current) {
      dirLightRef.current.intensity = isDark ? 1.6 : 2.1;
    }
    if (atmosphereMaterialRef.current) {
      atmosphereMaterialRef.current.blending = isDark
        ? THREE.AdditiveBlending
        : THREE.NormalBlending;
      atmosphereMaterialRef.current.uniforms.glowColor.value.setHex(
        isDark ? 0x38bdf8 : 0x60a5fa
      );
    }
    if (issTrailLineRef.current) {
      (issTrailLineRef.current.material as THREE.LineBasicMaterial).color.setHex(
        isDark ? 0x38bdf8 : 0x2563eb
      );
      (issTrailLineRef.current.material as THREE.LineBasicMaterial).opacity = isDark ? 0.65 : 0.85;
    }

    // Update Arc route shaders
    const arcColor = isDark ? 0x38bdf8 : 0x2563eb;
    const arcOpacity = isDark ? 0.85 : 0.95;
    arcMaterialsRef.current.forEach((mat) => {
      mat.uniforms.uColor.value.setHex(arcColor);
      mat.uniforms.uOpacity.value = arcOpacity;
    });

    // Refresh Earth Texture
    let active = true;
    generateEarthTexture(theme).then((newTex) => {
      if (active && globeMaterialRef.current) {
        if (globeMaterialRef.current.map) {
          disposeEarthTexture(globeMaterialRef.current.map);
        }
        globeMaterialRef.current.map = newTex;
        globeMaterialRef.current.needsUpdate = true;
      } else {
        disposeEarthTexture(newTex);
      }
    });

    return () => {
      active = false;
    };
  }, [theme]);

  // Layer Visibility Updates
  useEffect(() => {
    if (eqInstancedMeshRef.current) {
      eqInstancedMeshRef.current.visible = layers.earthquakes;
    }
    if (issGroupRef.current) {
      issGroupRef.current.visible = layers.iss;
    }
    if (issTrailLineRef.current) {
      issTrailLineRef.current.visible = layers.iss;
    }
    if (routesGroupRef.current) {
      routesGroupRef.current.visible = layers.routes;
    }
    if (hubInstancedMeshRef.current) {
      hubInstancedMeshRef.current.visible = layers.routes;
    }
  }, [layers]);

  // Update Earthquakes (Layer 1 - THREE.InstancedMesh)
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Dispose previous earthquake mesh
    if (eqInstancedMeshRef.current) {
      scene.remove(eqInstancedMeshRef.current);
      eqInstancedMeshRef.current.geometry.dispose();
      (eqInstancedMeshRef.current.material as THREE.Material).dispose();
      eqInstancedMeshRef.current = null;
    }

    const count = earthquakes.length;
    if (count === 0) return;

    // Thin cylinder/pin geometry perpendicular to surface
    // Cylinder centered at y=0, radius=0.035, height=1.0
    const pinGeo = new THREE.CylinderGeometry(0.015, 0.045, 1.0, 8);
    // Offset geometry so base is at y=0 and tip extends along +y
    pinGeo.translate(0, 0.5, 0);

    const pinMat = new THREE.MeshStandardMaterial({
      roughness: 0.35,
      metalness: 0.2
    });

    const instancedMesh = new THREE.InstancedMesh(pinGeo, pinMat, count);
    instancedMesh.frustumCulled = false;
    instancedMesh.visible = layersRef.current.earthquakes;

    for (let i = 0; i < count; i++) {
      const eq = earthquakes[i];
      // Surface position
      latLonToVector3(eq.lat, eq.lon, EARTH_RADIUS, V_POS);
      V_NORMAL.copy(V_POS).normalize();

      // Pin height proportional to magnitude: e.g. mag 4 -> 0.2, mag 7 -> 0.7
      const height = Math.max(0.12, (eq.mag - 2.5) * 0.16);
      const radiusScale = Math.max(0.7, eq.mag * 0.25);

      Q_ROT.setFromUnitVectors(V_UP, V_NORMAL);
      V_SCALE.set(radiusScale, height, radiusScale);
      M_TRANSFORM.compose(V_POS, Q_ROT, V_SCALE);
      instancedMesh.setMatrixAt(i, M_TRANSFORM);

      // Color coding based on magnitude
      getMagnitudeColor(eq.mag, C_COLOR);
      instancedMesh.setColorAt(i, C_COLOR);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }

    scene.add(instancedMesh);
    eqInstancedMeshRef.current = instancedMesh;
  }, [earthquakes]);

  // Update Hubs & Routes (Layer 3)
  useEffect(() => {
    const scene = sceneRef.current;
    const routesGroup = routesGroupRef.current;
    if (!scene || !routesGroup) return;

    // Dispose old hubs instanced mesh
    if (hubInstancedMeshRef.current) {
      scene.remove(hubInstancedMeshRef.current);
      hubInstancedMeshRef.current.geometry.dispose();
      (hubInstancedMeshRef.current.material as THREE.Material).dispose();
      hubInstancedMeshRef.current = null;
    }

    // Clean up old route lines
    while (routesGroup.children.length > 0) {
      const obj = routesGroup.children[0] as THREE.Line;
      routesGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
    }
    arcMaterialsRef.current.forEach((m) => m.dispose());
    arcMaterialsRef.current = [];

    // 1. Render Hub Cities InstancedMesh
    if (hubs.length > 0) {
      const hubGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.05, 12);
      hubGeo.translate(0, 0.025, 0);
      const hubMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.8,
        roughness: 0.2
      });

      const hubMesh = new THREE.InstancedMesh(hubGeo, hubMat, hubs.length);
      hubMesh.frustumCulled = false;
      hubMesh.visible = layersRef.current.routes;

      const isDark = themeRef.current === "dark";
      const hubColor = new THREE.Color(isDark ? 0x38bdf8 : 0x0284c7);

      for (let i = 0; i < hubs.length; i++) {
        const hub = hubs[i];
        latLonToVector3(hub.lat, hub.lon, EARTH_RADIUS + HUB_ALTITUDE, V_POS);
        V_NORMAL.copy(V_POS).normalize();
        Q_ROT.setFromUnitVectors(V_UP, V_NORMAL);
        V_SCALE.set(1, 1, 1);
        M_TRANSFORM.compose(V_POS, Q_ROT, V_SCALE);
        hubMesh.setMatrixAt(i, M_TRANSFORM);
        hubMesh.setColorAt(i, hubColor);
      }

      hubMesh.instanceMatrix.needsUpdate = true;
      if (hubMesh.instanceColor) hubMesh.instanceColor.needsUpdate = true;

      scene.add(hubMesh);
      hubInstancedMeshRef.current = hubMesh;
    }

    // 2. Render 3D Bézier Arc Routes with Animated Shader
    const isDark = themeRef.current === "dark";
    const hubMap = new Map<string, HubCity>();
    hubs.forEach((h) => hubMap.set(h.id, h));

    const sampleCount = 48;
    routes.forEach((route) => {
      const from = hubMap.get(route.fromHubId);
      const to = hubMap.get(route.toHubId);
      if (!from || !to) return;

      const curve = createArcCurve(
        from.lat,
        from.lon,
        to.lat,
        to.lon,
        EARTH_RADIUS + HUB_ALTITUDE,
        0.42
      );

      const points = curve.getPoints(sampleCount);
      const positions = new Float32Array(points.length * 3);
      const aProgress = new Float32Array(points.length);

      for (let i = 0; i < points.length; i++) {
        positions[i * 3] = points[i].x;
        positions[i * 3 + 1] = points[i].y;
        positions[i * 3 + 2] = points[i].z;
        aProgress[i] = i / (points.length - 1);
      }

      const arcGeo = new THREE.BufferGeometry();
      arcGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      arcGeo.setAttribute("aProgress", new THREE.BufferAttribute(aProgress, 1));

      const arcMat = new THREE.ShaderMaterial({
        vertexShader: ArcShader.vertexShader,
        fragmentShader: ArcShader.fragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        uniforms: {
          uColor: { value: new THREE.Color(isDark ? 0x38bdf8 : 0x2563eb) },
          uOpacity: { value: isDark ? 0.85 : 0.95 },
          uTime: { value: 0 }
        }
      });

      arcMaterialsRef.current.push(arcMat);
      const arcLine = new THREE.Line(arcGeo, arcMat);
      routesGroup.add(arcLine);
    });
  }, [hubs, routes]);

  // Update ISS Live Telemetry & Orbit Trail
  useEffect(() => {
    if (!iss) return;

    // Convert lat/lon to 3D point on globe
    latLonToVector3(iss.latitude, iss.longitude, EARTH_RADIUS + ISS_ALTITUDE, V_POS);
    issTargetPosRef.current.copy(V_POS);

    // Append to trail history (max 40 points)
    const trail = issTrailPositionsRef.current;
    trail.push(V_POS.clone());
    if (trail.length > 40) {
      trail.shift();
    }

    // Update trail geometry buffer
    if (issTrailGeoRef.current) {
      const posAttr = issTrailGeoRef.current.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < trail.length; i++) {
        arr[i * 3] = trail[i].x;
        arr[i * 3 + 1] = trail[i].y;
        arr[i * 3 + 2] = trail[i].z;
      }
      posAttr.needsUpdate = true;
      issTrailGeoRef.current.setDrawRange(0, trail.length);
    }
  }, [iss]);

  // Camera Fly-To Animation Trigger
  useEffect(() => {
    if (!selectedEntity) {
      isFlyingRef.current = false;
      return;
    }

    let targetLat = 0;
    let targetLon = 0;
    let targetDistance = EARTH_RADIUS + 4.8;

    if (selectedEntity.type === "earthquake") {
      targetLat = selectedEntity.data.lat;
      targetLon = selectedEntity.data.lon;
      targetDistance = EARTH_RADIUS + 4.5;
    } else if (selectedEntity.type === "hub") {
      targetLat = selectedEntity.data.lat;
      targetLon = selectedEntity.data.lon;
      targetDistance = EARTH_RADIUS + 4.5;
    } else if (selectedEntity.type === "iss") {
      targetLat = selectedEntity.data.latitude;
      targetLon = selectedEntity.data.longitude;
      targetDistance = EARTH_RADIUS + 5.5;
    }

    // Normal position of entity
    latLonToVector3(targetLat, targetLon, EARTH_RADIUS, V_CAM_TARGET);
    flyLookTargetRef.current.copy(V_CAM_TARGET);

    // Place camera outward along normal vector
    V_NORMAL.copy(V_CAM_TARGET).normalize();
    flyTargetPosRef.current.copy(V_NORMAL).multiplyScalar(targetDistance);

    // Trigger fly animation
    isFlyingRef.current = true;
  }, [selectedEntity]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full touch-none select-none overflow-hidden"
    />
  );
}

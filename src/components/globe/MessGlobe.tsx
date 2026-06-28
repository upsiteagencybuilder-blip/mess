"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";
import { BANGLADESH_AREAS } from "@/lib/constants";
import type { MessListItem } from "@/lib/api-client";

const GLOBE_RADIUS = 100;
const DHAKA_CENTER = { lat: 23.685, lng: 90.3563 };

/** Convert latitude / longitude (degrees) to a 3D position on a sphere of the given radius. */
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/** Evenly-distributed points on a sphere surface using the fibonacci spiral. */
function fibonacciSphere(samples: number, radius: number): Float32Array {
  const positions = new Float32Array(samples * 3);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < samples; i++) {
    const y = 1 - (i / (samples - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;
    positions[i * 3] = Math.cos(theta) * r * radius;
    positions[i * 3 + 1] = y * radius;
    positions[i * 3 + 2] = Math.sin(theta) * r * radius;
  }
  return positions;
}

function escapeHtml(s: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return s.replace(/[&<>"']/g, (c) => map[c]);
}

interface MarkerEntry {
  mess: MessListItem;
  mesh: THREE.Mesh;
  basePos: THREE.Vector3;
  pulsePhase: number;
}

interface ArcEntry {
  line: THREE.Line;
  pulse: THREE.Mesh;
  curve: THREE.QuadraticBezierCurve3;
  t: number;
  speed: number;
  lineMat: THREE.LineBasicMaterial;
  pulseMat: THREE.MeshBasicMaterial;
}

interface GlobeHandle {
  setMarkers: (m: MessListItem[]) => void;
  focusLatLng: (lat: number, lng: number) => void;
}

export interface MessGlobeProps {
  messes: MessListItem[];
  onSelectMess?: (id: string) => void;
  selectedArea?: string | null;
  className?: string;
}

export default function MessGlobe({
  messes,
  onSelectMess,
  selectedArea,
  className,
}: MessGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<GlobeHandle | null>(null);

  // Latest props captured in refs so the long-lived init effect can stay mount-only.
  // messesRef holds the initial value only (updates flow through the messes-effect below);
  // onSelectRef is kept in sync via an effect so the latest callback is used on click.
  const messesRef = useRef(messes);
  const onSelectRef = useRef(onSelectMess);
  useEffect(() => {
    onSelectRef.current = onSelectMess;
  }, [onSelectMess]);

  // --- Init scene once on mount ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const initialW = container.clientWidth || 600;
    const initialH = container.clientHeight || 600;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      initialW / initialH,
      0.1,
      2000
    );
    camera.position.set(0, 0, 240);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(initialW, initialH);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    const canvas = renderer.domElement;
    canvas.style.touchAction = "none";
    canvas.style.display = "block";

    // Globe group — everything that should rotate together
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // 1) Dark translucent inner sphere
    const innerGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 0.985, 64, 64);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x0a1420,
      transparent: true,
      opacity: 0.95,
    });
    globeGroup.add(new THREE.Mesh(innerGeo, innerMat));

    // 2) Dotted teal surface (fibonacci sphere of points)
    const dotsCount = 4500;
    const dotsGeo = new THREE.BufferGeometry();
    dotsGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(fibonacciSphere(dotsCount, GLOBE_RADIUS), 3)
    );
    const dotsMat = new THREE.PointsMaterial({
      color: 0x14b8a6,
      size: 1.5,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    globeGroup.add(new THREE.Points(dotsGeo, dotsMat));

    // 3) Outer atmosphere glow (back-side teal additive)
    const atmoGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.12, 64, 64);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x14b8a6,
      transparent: true,
      opacity: 0.07,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    globeGroup.add(new THREE.Mesh(atmoGeo, atmoMat));

    // 4) Equator + meridian rings for a futuristic wireframe feel
    const ringMat = new THREE.LineBasicMaterial({
      color: 0x14b8a6,
      transparent: true,
      opacity: 0.18,
    });
    const addRing = (points: THREE.Vector3[]) => {
      const g = new THREE.BufferGeometry().setFromPoints(points);
      globeGroup.add(new THREE.Line(g, ringMat));
    };
    const eqPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      eqPts.push(
        new THREE.Vector3(
          GLOBE_RADIUS * 1.002 * Math.cos(a),
          0,
          GLOBE_RADIUS * 1.002 * Math.sin(a)
        )
      );
    }
    addRing(eqPts);
    const merPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      merPts.push(
        new THREE.Vector3(
          0,
          GLOBE_RADIUS * 1.002 * Math.cos(a),
          GLOBE_RADIUS * 1.002 * Math.sin(a)
        )
      );
    }
    addRing(merPts);

    // Lights (mostly Basic materials — light is subtle but kept for any future MeshStandard)
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const pointLight = new THREE.PointLight(0x14b8a6, 0.6, 600);
    pointLight.position.set(150, 100, 200);
    scene.add(pointLight);

    // Markers + arcs (managed by setMarkers)
    const markers: MarkerEntry[] = [];
    const arcs: ArcEntry[] = [];
    const markerGeo = new THREE.SphereGeometry(1.7, 12, 12);
    const pulseGeo = new THREE.SphereGeometry(1.3, 8, 8);
    const dhakaVec = latLngToVector3(
      DHAKA_CENTER.lat,
      DHAKA_CENTER.lng,
      GLOBE_RADIUS
    );

    const setMarkers = (list: MessListItem[]) => {
      // dispose + remove old
      for (const m of markers) {
        globeGroup.remove(m.mesh);
        (m.mesh.material as THREE.Material).dispose();
      }
      markers.length = 0;
      for (const a of arcs) {
        globeGroup.remove(a.line);
        globeGroup.remove(a.pulse);
        a.line.geometry.dispose();
        a.lineMat.dispose();
        a.pulseMat.dispose();
      }
      arcs.length = 0;

      for (let i = 0; i < list.length; i++) {
        const mess = list[i];
        const pos = latLngToVector3(mess.lat, mess.lng, GLOBE_RADIUS * 1.01);
        const mesh = new THREE.Mesh(
          markerGeo,
          new THREE.MeshBasicMaterial({
            color: mess.vacantSeats > 0 ? 0x2dd4bf : 0x64748b,
          })
        );
        mesh.position.copy(pos);
        mesh.userData.messId = mess.id;
        globeGroup.add(mesh);
        markers.push({
          mess,
          mesh,
          basePos: pos.clone(),
          pulsePhase: i * 0.7,
        });

        // Arc from Dhaka center to mess location
        const start = dhakaVec.clone();
        const end = pos.clone();
        const mid = start.clone().add(end).multiplyScalar(0.5);
        const lift = GLOBE_RADIUS * (1.3 + Math.random() * 0.15);
        mid.normalize().multiplyScalar(lift);
        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        const points = curve.getPoints(64);
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({
          color: 0x14b8a6,
          transparent: true,
          opacity: 0.4,
        });
        const line = new THREE.Line(lineGeo, lineMat);
        globeGroup.add(line);

        const pulseMat = new THREE.MeshBasicMaterial({
          color: 0x5eead4,
          transparent: true,
          opacity: 0.9,
        });
        const pulse = new THREE.Mesh(pulseGeo, pulseMat);
        globeGroup.add(pulse);
        arcs.push({
          line,
          pulse,
          curve,
          t: Math.random(),
          speed: 0.0022 + Math.random() * 0.0018,
          lineMat,
          pulseMat,
        });
      }
    };

    // Initial markers from latest prop
    setMarkers(messesRef.current);

    // --- Interaction state ---
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let dragMoved = false;
    const rotation = { x: 0.15, y: 0 };
    const targetRotation = { x: 0.15, y: 0 };
    let autoRotate = true;
    let autoResumeTimer: number | null = null;

    globeGroup.rotation.x = rotation.x;
    globeGroup.rotation.y = rotation.y;

    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let hoveredId: string | null = null;

    const updateNDC = (cx: number, cy: number) => {
      const rect = canvas.getBoundingClientRect();
      ndc.x = ((cx - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((cy - rect.top) / rect.height) * 2 + 1;
    };

    const checkHover = (cx: number, cy: number) => {
      updateNDC(cx, cy);
      raycaster.setFromCamera(ndc, camera);
      const meshes = markers.map((m) => m.mesh);
      const hits = raycaster.intersectObjects(meshes, false);
      if (hits.length > 0) {
        const id = hits[0].object.userData.messId as string;
        hoveredId = id;
        const mess = markers.find((m) => m.mess.id === id)?.mess;
        if (mess && tooltipRef.current) {
          tooltipRef.current.innerHTML =
            `<div class="font-semibold text-white text-sm leading-tight">${escapeHtml(
              mess.name
            )}</div>` +
            `<div class="text-teal-300 text-xs mt-1">ফাঁকা সিট: ${mess.vacantSeats} · ${escapeHtml(
              mess.area
            )}</div>`;
        }
        canvas.style.cursor = "pointer";
      } else {
        hoveredId = null;
        if (tooltipRef.current) tooltipRef.current.style.opacity = "0";
        canvas.style.cursor = isDragging ? "grabbing" : "grab";
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      dragMoved = false;
      lastX = e.clientX;
      lastY = e.clientY;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      canvas.style.cursor = "grabbing";
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) {
        checkHover(e.clientX, e.clientY);
        return;
      }
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragMoved = true;
      lastX = e.clientX;
      lastY = e.clientY;
      targetRotation.y += dx * 0.005;
      targetRotation.x += dy * 0.005;
      targetRotation.x = Math.max(
        -Math.PI / 2 + 0.15,
        Math.min(Math.PI / 2 - 0.15, targetRotation.x)
      );
      autoRotate = false;
      if (autoResumeTimer) window.clearTimeout(autoResumeTimer);
      autoResumeTimer = window.setTimeout(() => {
        autoRotate = true;
      }, 4500);
    };
    const onPointerUp = () => {
      const moved = dragMoved;
      isDragging = false;
      if (!moved && hoveredId && onSelectRef.current) {
        onSelectRef.current(hoveredId);
      }
      canvas.style.cursor = "grab";
    };
    const onPointerLeave = () => {
      hoveredId = null;
      if (tooltipRef.current) tooltipRef.current.style.opacity = "0";
      canvas.style.cursor = "grab";
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerLeave);

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.08 : 0.92;
      camera.position.z = Math.max(
        160,
        Math.min(420, camera.position.z * factor)
      );
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });

    const focusLatLng = (lat: number, lng: number) => {
      const p = latLngToVector3(lat, lng, GLOBE_RADIUS);
      // Rotate globe so that p maps to the +Z (front, toward camera).
      const ty = -Math.atan2(p.x, p.z);
      const zAfterY = Math.sqrt(p.x * p.x + p.z * p.z);
      const tx = Math.atan2(p.y, zAfterY);
      targetRotation.y = ty;
      targetRotation.x = Math.max(
        -Math.PI / 2 + 0.15,
        Math.min(Math.PI / 2 - 0.15, tx)
      );
      autoRotate = false;
      if (autoResumeTimer) window.clearTimeout(autoResumeTimer);
      autoResumeTimer = window.setTimeout(() => {
        autoRotate = true;
      }, 6000);
    };

    handleRef.current = { setMarkers, focusLatLng };

    // --- Resize handling ---
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    // --- Animation loop ---
    let rafId = 0;
    const clock = new THREE.Clock();
    const tempVec = new THREE.Vector3();
    const camDir = new THREE.Vector3();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const t = clock.elapsedTime;

      if (autoRotate) {
        targetRotation.y += dt * 0.07;
      }
      rotation.x += (targetRotation.x - rotation.x) * 0.1;
      rotation.y += (targetRotation.y - rotation.y) * 0.1;
      globeGroup.rotation.x = rotation.x;
      globeGroup.rotation.y = rotation.y;

      // Pulse marker scale (skip hovered — it has a fixed large scale)
      for (const m of markers) {
        const baseScale = m.mesh.userData.messId === hoveredId ? 2.4 : 1;
        const s = baseScale * (1 + Math.sin(t * 2 + m.pulsePhase) * 0.2);
        m.mesh.scale.setScalar(s);
      }

      // Pulse spheres travelling along arcs
      for (const a of arcs) {
        a.t += a.speed;
        if (a.t > 1) a.t = 0;
        a.curve.getPoint(a.t, tempVec);
        a.pulse.position.copy(tempVec);
        a.pulseMat.opacity = 0.4 + Math.sin(a.t * Math.PI) * 0.55;
      }

      renderer.render(scene, camera);

      // Position HTML tooltip above hovered marker (hide when occluded by globe)
      if (hoveredId && tooltipRef.current) {
        const marker = markers.find((m) => m.mess.id === hoveredId);
        if (marker) {
          tempVec.copy(marker.basePos).applyMatrix4(globeGroup.matrixWorld);
          camDir.copy(camera.position).sub(globeGroup.position).normalize();
          const markerDir = tempVec
            .clone()
            .sub(globeGroup.position)
            .normalize();
          const dot = markerDir.dot(camDir);
          if (dot < -0.05) {
            tooltipRef.current.style.opacity = "0";
          } else {
            const proj = tempVec.clone().project(camera);
            const rect = canvas.getBoundingClientRect();
            const sx = (proj.x * 0.5 + 0.5) * rect.width;
            const sy = (-proj.y * 0.5 + 0.5) * rect.height;
            tooltipRef.current.style.transform = `translate(${sx}px, ${sy}px) translate(-50%, -130%)`;
            tooltipRef.current.style.opacity = "1";
          }
        }
      }
    };
    animate();

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      if (autoResumeTimer) window.clearTimeout(autoResumeTimer);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("wheel", onWheel);

      dotsGeo.dispose();
      dotsMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      atmoGeo.dispose();
      atmoMat.dispose();
      markerGeo.dispose();
      pulseGeo.dispose();
      ringMat.dispose();
      for (const m of markers) (m.mesh.material as THREE.Material).dispose();
      for (const a of arcs) {
        a.line.geometry.dispose();
        a.lineMat.dispose();
        a.pulseMat.dispose();
      }
      renderer.dispose();
      if (canvas.parentNode === container) container.removeChild(canvas);
      handleRef.current = null;
    };
  }, []);

  // Update markers when messes prop changes (without rebuilding the whole scene)
  useEffect(() => {
    handleRef.current?.setMarkers(messes);
  }, [messes]);

  // Rotate globe to focus on the selected area
  useEffect(() => {
    if (!selectedArea) return;
    const found = BANGLADESH_AREAS.find((a) => a.area === selectedArea);
    if (found) handleRef.current?.focusLatLng(found.lat, found.lng);
  }, [selectedArea]);

  return (
    <div
      ref={containerRef}
      className={cn("relative h-full w-full overflow-hidden", className)}
    >
      <div
        ref={tooltipRef}
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 z-20 min-w-[150px] rounded-lg border border-teal-500/40 bg-slate-950/90 px-3 py-2 opacity-0 shadow-xl backdrop-blur-sm transition-opacity duration-200"
        style={{ willChange: "transform, opacity" }}
      />
    </div>
  );
}

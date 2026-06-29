"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";
import { formatBDT } from "@/lib/constants";
import { haversineKm, formatDistance } from "@/lib/geo";
import type { MessListItem } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface RefPoint {
  lat: number;
  lng: number;
  label: string;
}

interface ExploreMapProps {
  messes: MessListItem[];
  selectedMessId: string | null;
  onSelectMess: (id: string) => void;
  refPoint: RefPoint;
  maxDistance: number | null;
  className?: string;
}

const PIN_CSS = [
  ".mess-pin-wrapper { background: transparent !important; border: none !important; }",
  ".mess-pin { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 88px; padding: 4px 6px 6px; border-radius: 10px; color: white; font-size: 12px; font-weight: 600; box-shadow: 0 3px 10px rgba(0,0,0,0.25); cursor: pointer; transition: transform 0.15s; position: relative; }",
  ".mess-pin:hover { transform: translateY(-3px) scale(1.05); z-index: 1000; }",
  ".mess-pin-rent { font-size: 13px; font-weight: 700; line-height: 1.1; }",
  ".mess-pin-dist { font-size: 10px; font-weight: 500; opacity: 0.9; line-height: 1.1; }",
  ".mess-pin-arrow { position: absolute; bottom: -5px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #14b8a6; }",
  ".center-pin-wrapper { background: transparent !important; border: none !important; }",
  ".center-pin { position: relative; width: 30px; height: 30px; }",
  ".center-pin-dot { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 14px; height: 14px; border-radius: 50%; background: #0d9488; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); z-index: 2; }",
  ".center-pin-pulse { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 30px; height: 30px; border-radius: 50%; background: #14b8a6; opacity: 0.4; animation: center-pulse 2s ease-out infinite; z-index: 1; }",
  "@keyframes center-pulse { 0% { transform: translate(-50%,-50%) scale(0.5); opacity: 0.6; } 100% { transform: translate(-50%,-50%) scale(2.5); opacity: 0; } }",
  ".center-pin-label { position: absolute; top: -22px; left: 50%; transform: translateX(-50%); white-space: nowrap; background: white; color: #0f766e; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.15); z-index: 3; }",
  ".leaflet-tooltip { background: white !important; border: 1px solid #14b8a6 !important; border-radius: 8px !important; box-shadow: 0 4px 12px rgba(0,0,0,0.12) !important; padding: 6px 10px !important; }",
  ".leaflet-tooltip-top:before { border-top-color: #14b8a6 !important; }",
].join("\n");

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function buildPinHtml(rent: number, distance: number, isSelected: boolean): string {
  const bg = isSelected ? "#0d9488" : "#14b8a6";
  return (
    '<div class="mess-pin" style="background:' + bg + ';">' +
    '<div class="mess-pin-rent">' + formatBDT(rent) + "</div>" +
    '<div class="mess-pin-dist">' + formatDistance(distance) + "</div>" +
    '<div class="mess-pin-arrow"></div>' +
    "</div>"
  );
}

function buildPinIcon(rent: number, distance: number, isSelected: boolean): L.DivIcon {
  return L.divIcon({
    className: "mess-pin-wrapper",
    html: buildPinHtml(rent, distance, isSelected),
    iconSize: [88, 56],
    iconAnchor: [44, 50],
    popupAnchor: [0, -50],
  });
}

function buildCenterIcon(label: string): L.DivIcon {
  const html =
    '<div class="center-pin">' +
    '<div class="center-pin-pulse"></div>' +
    '<div class="center-pin-dot"></div>' +
    '<div class="center-pin-label">' + label + "</div>" +
    "</div>";
  return L.divIcon({
    className: "center-pin-wrapper",
    html,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

export default function ExploreMap({
  messes,
  selectedMessId,
  onSelectMess,
  refPoint,
  maxDistance,
  className,
}: ExploreMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const centerMarkerRef = useRef<L.Marker | null>(null);
  const circlesRef = useRef<L.Circle[]>([]);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [refPoint.lat, refPoint.lng],
      zoom: 14,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
      centerMarkerRef.current = null;
      circlesRef.current = [];
    };
  }, []);

  // Update center marker + radius ring when refPoint or maxDistance changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Update center marker
    if (centerMarkerRef.current) {
      centerMarkerRef.current.remove();
    }
    centerMarkerRef.current = L.marker([refPoint.lat, refPoint.lng], {
      icon: buildCenterIcon(refPoint.label),
      interactive: false,
      zIndexOffset: 500,
    }).addTo(map);

    // Remove old rings
    circlesRef.current.forEach((c) => c.remove());
    circlesRef.current = [];

    // Draw rings: if maxDistance set, draw that; also always draw 1/2/5km reference rings
    if (maxDistance !== null) {
      const c = L.circle([refPoint.lat, refPoint.lng], {
        radius: maxDistance * 1000,
        color: "#0d9488",
        weight: 2,
        opacity: 0.6,
        fillColor: "#14b8a6",
        fillOpacity: 0.08,
      }).addTo(map);
      circlesRef.current.push(c);
    }
    // Reference rings (lighter)
    [1, 2, 5].forEach((km) => {
      const c = L.circle([refPoint.lat, refPoint.lng], {
        radius: km * 1000,
        color: "#14b8a6",
        weight: 1,
        opacity: 0.2,
        fillColor: "#14b8a6",
        fillOpacity: 0.02,
        dashArray: "4 6",
      }).addTo(map);
      circlesRef.current.push(c);
    });

    map.flyTo([refPoint.lat, refPoint.lng], maxDistance ? 13 : 14, { duration: 0.6 });
  }, [refPoint, maxDistance]);

  // Update mess markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    messes.forEach((mess) => {
      const distance = haversineKm(refPoint.lat, refPoint.lng, mess.lat, mess.lng);
      const isSelected = mess.id === selectedMessId;
      const icon = buildPinIcon(mess.rentPerSeat, distance, isSelected);

      const marker = L.marker([mess.lat, mess.lng], {
        icon,
        zIndexOffset: isSelected ? 1000 : 0,
      }).addTo(map);

      marker.on("click", () => {
        onSelectMess(mess.id);
      });

      const tooltipHtml =
        '<div style="font-weight:600;">' + mess.name + "</div>" +
        '<div style="font-size:11px;color:#0f766e;">' +
        formatBDT(mess.rentPerSeat) + " · " + formatDistance(distance) +
        " · ফাঁকা " + mess.vacantSeats + "</div>";
      marker.bindTooltip(tooltipHtml, {
        direction: "top",
        offset: [0, -10],
        opacity: 0.95,
      });

      markersRef.current.set(mess.id, marker);
    });
  }, [messes, refPoint, selectedMessId, onSelectMess]);

  // Pan to selected mess
  useEffect(() => {
    if (!selectedMessId || !mapRef.current) return;
    const mess = messes.find((m) => m.id === selectedMessId);
    if (!mess) return;
    mapRef.current.flyTo([mess.lat, mess.lng], 16, { duration: 0.6 });
  }, [selectedMessId, messes]);

  return (
    <div className={cn("relative", className)}>
      {/* Info badge */}
      <div className="absolute right-3 bottom-3 z-[500] hidden rounded-lg border border-slate-200 bg-white/95 px-3 py-1.5 text-xs shadow-lg sm:block">
        <span className="font-semibold text-teal-700">{messes.length}</span>{" "}
        <span className="text-slate-600">টি মেস</span>
        {maxDistance !== null && (
          <span className="text-slate-500"> · ≤{maxDistance} কিমি</span>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[500] rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-lg">
        <div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-700">
          <MapPin className="size-3 text-teal-600" />
          {refPoint.label}
        </div>
        {maxDistance !== null ? (
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-teal-600 ring-2 ring-teal-300" />
            <span className="text-slate-600">সার্চ রেঞ্জ: {maxDistance} কিমি</span>
          </div>
        ) : null}
        <div className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-teal-400" />
          <span className="text-slate-600">১/২/৫ কিমি রিং</span>
        </div>
      </div>

      {/* Map container */}
      <div
        ref={containerRef}
        className="h-full w-full"
        style={{ minHeight: "400px", zIndex: 0 }}
      />

      {/* Custom CSS */}
      <style dangerouslySetInnerHTML={{ __html: PIN_CSS }} />
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BANGLADESH_AREAS, RAJSHAHI_UNIVERSITY, formatBDT } from "@/lib/constants";
import { haversineKm, formatDistance } from "@/lib/geo";
import type { MessListItem } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface ExploreMapProps {
  messes: MessListItem[];
  selectedMessId: string | null;
  onSelectMess: (id: string) => void;
  className?: string;
}

interface MapCenter {
  lat: number;
  lng: number;
  label: string;
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

// Fix Leaflet default marker icon paths (prevents 404s).
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

export default function ExploreMap({ messes, selectedMessId, onSelectMess, className }: ExploreMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const centerMarkerRef = useRef<L.Marker | null>(null);
  const circlesRef = useRef<L.Circle[]>([]);

  const [center, setCenter] = useState<MapCenter>({
    lat: RAJSHAHI_UNIVERSITY.lat,
    lng: RAJSHAHI_UNIVERSITY.lng,
    label: "রাজশাহী বিশ্ববিদ্যালয়",
  });
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom: 14,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Center marker
    centerMarkerRef.current = L.marker([center.lat, center.lng], {
      icon: buildCenterIcon(center.label),
      interactive: false,
      zIndexOffset: 500,
    }).addTo(map);

    // Distance rings
    [1, 2, 5].forEach((km) => {
      const c = L.circle([center.lat, center.lng], {
        radius: km * 1000,
        color: "#14b8a6",
        weight: 1,
        opacity: 0.3,
        fillColor: "#14b8a6",
        fillOpacity: 0.03,
        dashArray: "4 6",
      }).addTo(map);
      circlesRef.current.push(c);
    });

    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
      centerMarkerRef.current = null;
      circlesRef.current = [];
    };
  }, []);

  // Update mess markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    messes.forEach((mess) => {
      const distance = haversineKm(center.lat, center.lng, mess.lat, mess.lng);
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
  }, [messes, center, selectedMessId, onSelectMess]);

  // Pan to selected mess
  useEffect(() => {
    if (!selectedMessId || !mapRef.current) return;
    const mess = messes.find((m) => m.id === selectedMessId);
    if (!mess) return;
    mapRef.current.flyTo([mess.lat, mess.lng], 16, { duration: 0.8 });
  }, [selectedMessId, messes]);

  const applyCenter = useCallback((lat: number, lng: number, label: string) => {
    setCenter({ lat, lng, label });
    const map = mapRef.current;
    if (!map) return;

    if (centerMarkerRef.current) {
      centerMarkerRef.current.remove();
    }
    centerMarkerRef.current = L.marker([lat, lng], {
      icon: buildCenterIcon(label),
      interactive: false,
      zIndexOffset: 500,
    }).addTo(map);

    // Remove old rings
    circlesRef.current.forEach((c) => c.remove());
    circlesRef.current = [];

    [1, 2, 5].forEach((km) => {
      const c = L.circle([lat, lng], {
        radius: km * 1000,
        color: "#14b8a6",
        weight: 1,
        opacity: 0.3,
        fillColor: "#14b8a6",
        fillOpacity: 0.03,
        dashArray: "4 6",
      }).addTo(map);
      circlesRef.current.push(c);
    });

    map.flyTo([lat, lng], 14, { duration: 0.8 });
  }, []);

  const filteredSuggestions = BANGLADESH_AREAS.filter((a) =>
    a.area.toLowerCase().includes(query.toLowerCase())
  );

  const pickArea = (area: (typeof BANGLADESH_AREAS)[number]) => {
    setQuery(area.area);
    setShowSuggestions(false);
    applyCenter(area.lat, area.lng, area.area);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      alert("আপনার ব্রাউজার জিওলোকেশন সাপোর্ট করে না।");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyCenter(pos.coords.latitude, pos.coords.longitude, "আপনার অবস্থান");
      },
      () => {
        applyCenter(RAJSHAHI_UNIVERSITY.lat, RAJSHAHI_UNIVERSITY.lng, "রাজশাহী বিশ্ববিদ্যালয়");
      }
    );
  };

  return (
    <div className={cn("relative", className)}>
      {/* Search bar overlay */}
      <div className="absolute left-3 top-3 z-[500] w-[calc(100%-1.5rem)] max-w-sm">
        <div className="relative">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
            <MapPin className="size-4 shrink-0 text-teal-600" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="এলাকা খুঁজুন (যেমন: Kazla, Motihar...)"
              className="h-7 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={useMyLocation}
              className="h-7 shrink-0 gap-1 px-2 text-xs text-teal-600"
              title="আমার অবস্থান ব্যবহার করুন"
            >
              <Navigation className="size-3.5" />
              <span className="hidden sm:inline">আমার অবস্থান</span>
            </Button>
          </div>

          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="mt-1 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
              {filteredSuggestions.map((a) => (
                <button
                  key={a.area}
                  onClick={() => pickArea(a)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-teal-50"
                >
                  <MapPin className="size-3.5 shrink-0 text-teal-500" />
                  <span className="font-medium">{a.area}</span>
                  <span className="text-xs text-slate-400">{a.city}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info badge */}
      <div className="absolute right-3 top-3 z-[500] hidden rounded-lg border border-slate-200 bg-white/95 px-3 py-1.5 text-xs shadow-lg sm:block">
        <span className="font-semibold text-teal-700">{messes.length}</span>{" "}
        <span className="text-slate-600">টি মেস ম্যাপে দেখানো হচ্ছে</span>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[500] rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-lg">
        <div className="mb-1 font-semibold text-slate-700">দূরত্ব রিং</div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-teal-500" />
          <span className="text-slate-600">১ কিমি</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-teal-400" />
          <span className="text-slate-600">২ কিমি</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-teal-300" />
          <span className="text-slate-600">৫ কিমি</span>
        </div>
      </div>

      {/* Map container */}
      <div
        ref={containerRef}
        className="h-full w-full"
        style={{ minHeight: "500px", zIndex: 0 }}
      />

      {/* Custom CSS for pins */}
      <style dangerouslySetInnerHTML={{ __html: PIN_CSS }} />
    </div>
  );
}

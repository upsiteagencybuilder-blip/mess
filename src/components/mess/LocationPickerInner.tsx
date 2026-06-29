"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Search, Loader2, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface LocationPickerProps {
  value: { lat: number; lng: number };
  onChange: (val: { lat: number; lng: number }) => void;
  label?: string;
  height?: number;
}

interface SearchResult {
  lat: string;
  lon: string;
  display_name: string;
}

const PICKER_CSS = `
  .lp-pin-wrapper { background: transparent !important; border: none !important; }
  .lp-pin { position: relative; }
  .lp-pin-dot {
    width: 24px; height: 24px; border-radius: 50% 50% 50% 0;
    background: #0d9488; transform: rotate(-45deg);
    border: 3px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.3);
  }
  .lp-pin-dot::after {
    content: ''; position: absolute; top: 7px; left: 7px;
    width: 10px; height: 10px; border-radius: 50%; background: white;
  }
`;

delete (L.Icon.Default.prototype as any)._getIconUrl;

function buildPinIcon(): L.DivIcon {
  return L.divIcon({
    className: "lp-pin-wrapper",
    html: '<div class="lp-pin"><div class="lp-pin-dot"></div></div>',
    iconSize: [24, 30],
    iconAnchor: [12, 28],
  });
}

export default function LocationPicker({
  value,
  onChange,
  label = "মেসের সঠিক অবস্থান",
  height = 320,
}: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [value.lat, value.lng],
      zoom: 15,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Initial marker
    markerRef.current = L.marker([value.lat, value.lng], {
      icon: buildPinIcon(),
      draggable: true,
    }).addTo(map);

    markerRef.current.on("dragend", (e) => {
      const ll = (e.target as L.Marker).getLatLng();
      onChange({ lat: ll.lat, lng: ll.lng });
    });

    // Click to set location
    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      }
      onChange({ lat, lng });
    });

    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update marker when value changes externally
  useEffect(() => {
    if (markerRef.current && mapRef.current) {
      markerRef.current.setLatLng([value.lat, value.lng]);
      mapRef.current.panTo([value.lat, value.lng]);
    }
  }, [value.lat, value.lng]);

  // Search via Nominatim (OpenStreetMap geocoding — free, no API key)
  const doSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    setShowResults(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          q + " Rajshahi Bangladesh"
        )}&limit=5`,
        { headers: { "Accept-Language": "bn" } }
      );
      const data = (await res.json()) as SearchResult[];
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  const pickResult = (r: SearchResult) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    onChange({ lat, lng });
    setShowResults(false);
    setResults([]);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  };

  const latStr = value.lat.toFixed(6);
  const lngStr = value.lng.toFixed(6);

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-slate-700">{label}</label>

      {/* Search box */}
      <div className="relative">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5">
          <Search className="size-4 shrink-0 text-teal-600" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                doSearch();
              }
            }}
            placeholder="ঠিকানা খুঁজুন (যেমন: Kazla, রাজশাহী বিশ্ববিদ্যালয়)"
            className="h-7 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={doSearch}
            disabled={searching}
            className="h-7 gap-1 px-2 text-xs"
          >
            {searching ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Search className="size-3" />
            )}
            খুঁজুন
          </Button>
        </div>

        {showResults && results.length > 0 && (
          <div className="absolute top-full left-0 z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => pickResult(r)}
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-xs transition hover:bg-teal-50"
              >
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-teal-500" />
                <span className="line-clamp-2 text-slate-700">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div
        ref={containerRef}
        className="w-full overflow-hidden rounded-lg border-2 border-teal-200"
        style={{ height: `${height}px`, zIndex: 0 }}
      />

      {/* Coords display + actions */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
          <span className="text-slate-400">Lat:</span>
          <span className="font-mono font-semibold text-teal-700">{latStr}</span>
          <span className="mx-1 text-slate-300">|</span>
          <span className="text-slate-400">Lng:</span>
          <span className="font-mono font-semibold text-teal-700">{lngStr}</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={useMyLocation}
          className="h-8 gap-1.5 text-xs"
        >
          <Crosshair className="size-3.5 text-teal-600" />
          আমার অবস্থান
        </Button>
      </div>

      <p className="text-[10px] text-slate-400">
        💡 ম্যাপে যেকোনো জায়গায় ক্লিক করে পিন সরান, অথবা পিন টেনে নিয়ে সঠিক অবস্থান ঠিক করুন।
      </p>

      <style dangerouslySetInnerHTML={{ __html: PICKER_CSS }} />
    </div>
  );
}

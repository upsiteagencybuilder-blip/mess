"use client";

import dynamic from "next/dynamic";

/**
 * ExploreMap is wrapped with dynamic import (ssr: false) because Leaflet
 * accesses `window` at module-evaluation time, which breaks SSR.
 * The actual implementation lives in ExploreMapInner.
 */
const ExploreMapInner = dynamic(() => import("./ExploreMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-100">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500/30 border-t-teal-500" />
    </div>
  ),
});

interface RefPoint {
  lat: number;
  lng: number;
  label: string;
}

interface ExploreMapProps {
  messes: import("@/lib/api-client").MessListItem[];
  selectedMessId: string | null;
  onSelectMess: (id: string) => void;
  refPoint: RefPoint;
  maxDistance: number | null;
  className?: string;
}

export default function ExploreMap(props: ExploreMapProps) {
  return <ExploreMapInner {...props} />;
}

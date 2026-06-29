"use client";

import dynamic from "next/dynamic";

const LocationPickerInner = dynamic(() => import("./LocationPickerInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-80 items-center justify-center rounded-lg border-2 border-teal-200 bg-slate-100">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500/30 border-t-teal-500" />
    </div>
  ),
});

export interface LocationPickerValue {
  lat: number;
  lng: number;
}

export default function LocationPicker(
  props: {
    value: LocationPickerValue;
    onChange: (val: LocationPickerValue) => void;
    label?: string;
    height?: number;
  }
) {
  return <LocationPickerInner {...props} />;
}

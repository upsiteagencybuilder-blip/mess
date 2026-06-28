# Task 2-b — Globe + Landing UI (full-stack-developer)

## Task
Build the 3D animated globe hero + landing/explore UI for the Mess Management & Seat Finder platform: a Three.js wireframe globe with teal connection arcs, a dark futuristic landing hero, the mess list/grid with filters, the mess detail dialog, and the auth dialog.

## Files created
- `src/components/globe/MessGlobe.tsx` — Three.js 3D globe (client component)
- `src/components/mess/LandingHero.tsx` — full-viewport dark hero with globe + headline + stats + search bar
- `src/components/mess/MessList.tsx` — filtered mess grid with full filter bar
- `src/components/mess/MessCard.tsx` — single mess card
- `src/components/mess/MessDetailDialog.tsx` — mess detail dialog with seat map + booking form
- `src/components/mess/AuthDialog.tsx` — login/register dialog with demo quick-fill
- `src/lib/icons/amenity-icons.tsx` — amenity key → Lucide icon map
- `src/store/mess-filter-store.ts` — shared ephemeral filter store (Zustand, non-persisted) + `filterMesses` helper
- `public/placeholder-mess.svg` — fallback mess photo

## Packages installed
- `three@0.170.0`
- `@types/three@0.170.0` (dev)

## Three.js globe approach
Built directly with `three` (NOT `react-globe.gl`, which has React 19 peer issues). Key layers in a single `globeGroup` (Y-axis auto-rotation + drag-to-rotate + scroll-to-zoom):
1. Translucent dark inner sphere (`SphereGeometry` r=98.5, color `#0a1420`, opacity 0.95).
2. Dotted teal surface — 4500 points via fibonacci-sphere distribution (`Points` + `PointsMaterial` color `#14b8a6`, opacity 0.6, `sizeAttenuation`).
3. Outer atmosphere glow — back-side sphere r=112, additive blending, teal tint.
4. Equator + prime-meridian thin teal rings for a wireframe feel.
5. Mess markers — small `SphereGeometry` meshes at lat/lng (color teal if vacant, slate if full). Pulsing scale animation. Raycast hover → enlarged + HTML tooltip synced via 3D→screen projection (with near-side occlusion check so tooltips behind the globe hide).
6. Connection arcs — `QuadraticBezierCurve3` from Dhaka center (23.685, 90.3563) to each mess, with control point lifted radially outward. Rendered as a teal `Line` + a small glowing sphere that travels along the curve (animated `t`), opacity pulsing with `sin(t*π)`.
7. Lights: ambient + a teal point light.

Performance: `setPixelRatio(min(dpr, 2))`, single `requestAnimationFrame` loop, full disposal of geometries/materials/renderer on unmount, `ResizeObserver` for responsive canvas.

Effect architecture:
- Mount-only init effect (`[]` deps) builds the scene + animation loop and exposes a `handleRef` with `setMarkers` + `focusLatLng`.
- A separate `[messes]` effect calls `setMarkers` to update markers without rebuilding the globe.
- A separate `[selectedArea]` effect rotates the globe to face the selected area (computed Y/X rotations to bring the lat/lng point to +Z / front).

## Filter store contract (for the page orchestrator)
`useMessFilter` (in `src/store/mess-filter-store.ts`) holds: `search`, `type`, `minRent`, `maxRent`, `amenities[]`, `onlyVacant`. The LandingHero's search bar + type chips write to it; the MessList's filter bar reads AND writes it. The page orchestrator should read it (plus `selectedArea` from the app-store) to filter messes before passing to MessList. A `filterMesses(list, opts)` helper is exported for convenience.

**Suggested page.tsx integration:**
```tsx
'use client'
import { useEffect, useState } from 'react'
import LandingHero from '@/components/mess/LandingHero'
import MessList from '@/components/mess/MessList'
import MessDetailDialog from '@/components/mess/MessDetailDialog'
import AuthDialog from '@/components/mess/AuthDialog'
import { useAppStore } from '@/store/app-store'
import { useMessFilter, filterMesses } from '@/store/mess-filter-store'
import { apiFetch, type MessListItem } from '@/lib/api-client'

export default function Home() {
  const view = useAppStore(s => s.view)
  const landingTab = useAppStore(s => s.landingTab)
  const selectedArea = useAppStore(s => s.selectedArea)
  const filter = useMessFilter()
  const [allMesses, setAllMesses] = useState<MessListItem[]>([])

  useEffect(() => { apiFetch<MessListItem[]>('/api/mess').then(setAllMesses) }, [])

  if (view !== 'landing') return null // dashboards rendered elsewhere

  const filtered = filterMesses(allMesses, {
    search: filter.search, type: filter.type, minRent: filter.minRent,
    maxRent: filter.maxRent, amenities: filter.amenities,
    onlyVacant: filter.onlyVacant, selectedArea,
  })

  return (
    <main className="flex min-h-screen flex-col">
      <LandingHero messes={allMesses} />
      {landingTab === 'list' && <MessList messes={filtered} />}
      <MessDetailDialog />
      <AuthDialog />
    </main>
  )
}
```

## API endpoints consumed (already exist per dev.log)
- `GET /api/mess` → `MessListItem[]` (for hero globe + list)
- `GET /api/mess/[id]` → `MessDetail` (for detail dialog)
- `POST /api/booking` `{ messId, name, phone, message }` (booking request)
- `POST /api/auth/login` `{ email, password }` → `{ user }`
- `POST /api/auth/register` `{ name, email, phone, password, role }` → `{ user }`
- `GET /api/auth/me` → `SessionUser` (fallback after auth)

## Lint / type status
- `bun run lint` → 0 errors, 0 warnings.
- `bunx tsc --noEmit` → no errors in `src/`.

## Design notes
- Dark hero bg `#070b12 → #0f1623` with a teal radial glow.
- Teal accents: `#14b8a6` / `#2dd4bf` / `#5eead4` / `#10b981`. No indigo/blue.
- Hero stats computed from `messes` prop: মোট মেস, ফাঁকা সিট, এলাকা.
- Globe is absolutely positioned filling the hero; overlay content uses `pointer-events-none` wrapper with `pointer-events-auto` on actual controls so the globe stays draggable everywhere else.
- Search bar = area autocomplete (BANGLADESH_AREAS) + 4 type chips; typing matches an area → sets `selectedArea` in app-store AND `search` in filter-store.
- MessList: mobile uses a bottom Sheet for filters; desktop shows inline controls. Active filters render as removable chips.
- MessDetailDialog: photo carousel, 3-stat box, amenities chips, room/seat map (occupied=teal filled, vacant=outlined dashed), tel: link + copy contact, booking form prefilled from logged-in user.
- AuthDialog: dark header band, login/register tabs, demo account quick-fill (rahim@mess.com / tanvir@tenant.com / staff@mess.com, pass 123456).

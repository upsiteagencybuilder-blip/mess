# Task 4-a — Owner Dashboard

Agent: full-stack-developer (owner dashboard)
Task: Build the complete Owner Dashboard for the Mess Management & Seat Finder platform — 9 client components + 1 shared month helper.

## Files created
- `src/lib/months.ts` — Bengali month names helper (bengaliMonth, BENGALI_MONTHS, currentMonth/Year, yearOptions, bengaliMonthShort)
- `src/components/dashboards/owner/OwnerDashboard.tsx` — main container (auth guard, owned-mess list fetch, active-mess detail fetch, tab nav, register dialog, full-screen empty state)
- `src/components/dashboards/owner/OwnerHeader.tsx` — sticky dark teal header (brand + active mess dropdown + explore-back + user menu + logout)
- `src/components/dashboards/owner/RegisterMessForm.tsx` — comprehensive mess-creation form (compact + standalone modes, demo-fill, area→lat/lng auto-fill)
- `src/components/dashboards/owner/OverviewTab.tsx` — stat cards (6) + collected highlight + occupancy rate + revenue area chart + vacancy donut
- `src/components/dashboards/owner/RoomsSeatsTab.tsx` — room grid with seat badges, manual status toggle via AlertDialog confirm
- `src/components/dashboards/owner/MembersTab.tsx` — member table with leave action + AddMemberDialog (vacant seats grouped by room)
- `src/components/dashboards/owner/BillingTab.tsx` — month/year selector, utility bill entry (prefill edit), utility bills table with delete, invoice generate button (with 404 fallback hint), invoices table with PAID/PENDING toggle + totals
- `src/components/dashboards/owner/BookingsTab.tsx` — booking requests table with mess/status filters + Approve/Reject actions
- `src/components/dashboards/owner/SettingsTab.tsx` — mess edit form + read-only code/owner identity + danger zone with name-typed delete confirm

## Key UX decisions
- Toasts via `useToast` hook (radix-based Toaster already mounted in layout.tsx); sonner's Toaster is NOT mounted so avoided it for reliability.
- Framer Motion for: header slide-down, tab content fade/slide (AnimatePresence mode="wait"), stat cards stagger.
- Color system: teal/emerald primary throughout, amber for pending/outstanding, rose for danger/leave/reject, slate for neutral. No indigo/blue.
- OwnerHeader shows single mess (no dropdown) when only 1 mess; shows dropdown switcher when multiple. Header also has user dropdown with role badge + logout.
- Mobile-first: tab nav scrolls horizontally on mobile (overflow-x-auto + w-max TabsList); tables wrapped in overflow-x-auto; grids collapse 1-col.
- Sticky footer at bottom via `mt-auto` on footer + `min-h-screen flex flex-col` on root.
- AlertDialog used for all destructive/irreversible actions: seat toggle, member leave, utility delete, mess delete (with name-typed confirmation to prevent accidents).
- All currency via `formatBDT`; all month labels via Bengali names from `src/lib/months.ts`.
- Refresh contract: child components call `triggerRefresh` (Zustand) which bumps `refreshKey`; parent + each tab refetch on `refreshKey` change.
- Active mess detail (MessDetail) fetched in parent and passed to Rooms/Settings tabs as props; Overview/Members/Billing/Bookings fetch their own data scoped to activeMessId.

## Integration notes for page.tsx (orchestrator agent)
```tsx
// when view === 'owner-dashboard':
import OwnerDashboard from '@/components/dashboards/owner/OwnerDashboard';
// OwnerDashboard reads `user` from store and self-guards (renders null if not OWNER).
// No props needed. Mounts its own header + footer.
```

## Demo flow
1. Open the app (preview panel).
2. Click login → use demo account `rahim@mess.com` / `123456` (Owner).
3. OwnerDashboard mounts → fetches `GET /api/mess/0/mine` → sees list of seeded messes (Rahim owns several in Dhanmondi/Mohakhali etc.).
4. Default tab = Overview → stat cards + revenue chart + vacancy donut load from `/api/mess/{id}/owner-stats`.
5. Switch tabs:
   - রুম ও সিট → room grid with seat badges (teal filled = OCCUPIED, dashed = VACANT). Click a seat to confirm toggle.
   - মেম্বার → table of active members + "মেম্বার যোগ করুন" button → dialog with vacant-seat select (grouped by room) + member form.
   - বিলিং → pick month/year → enter utility bill → save → "ইনভয়েস জেনারেট করুন" → see invoices table with PAID/PENDING toggle + totals.
   - বুকিং → list of booking requests with mess/status filters + Approve/Reject.
   - সেটিংস → edit form (prefilled) + danger zone with name-typed delete.
6. Click "+ নতুন মেস" button → opens RegisterMessForm in a dialog. Click "ডেমো তথ্য ভরুন" for quick fill → submit → new mess added, switches active to it.
7. Header: click user avatar → dropdown → লগআউট → returns to landing.

## Quality
- `bun run lint` → 0 errors, 0 warnings across all owner dashboard files.
- `bunx tsc --noEmit` → 0 errors in `src/components/dashboards/owner/` or `src/lib/months.ts` (remaining tsc errors are in unrelated `examples/` and `skills/` dirs).
- All 'use client' directives present.
- No test code written (per project rules).
- No modifications to page.tsx, layout.tsx, globals.css, prisma schema, or any API route.

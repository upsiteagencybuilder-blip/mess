// Bengali month names helper — shared between owner + tenant dashboards.

export const BENGALI_MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
] as const;

/** 1-based month number → Bengali month name. Falls back to the raw number. */
export function bengaliMonth(month: number): string {
  if (month >= 1 && month <= 12) return BENGALI_MONTHS[month - 1];
  return String(month);
}

/** "বengaliMonth year" label, e.g. "মে 2025". */
export function monthYearLabel(month: number, year: number): string {
  return `${bengaliMonth(month)} ${year}`;
}

/** Short label for charts: "মে '২৫" style. */
export function bengaliMonthShort(month: number, year: number): string {
  const name = bengaliMonth(month);
  // Convert last two digits of year to Bengali-style 2-digit (kept ASCII for chart legibility).
  const yy = String(year).slice(-2);
  return `${name} '${yy}`;
}

/** Current month (1-12) based on local time. */
export function currentMonth(): number {
  return new Date().getMonth() + 1;
}

/** Current 4-digit year. */
export function currentYear(): number {
  return new Date().getFullYear();
}

/** Year options: current year ± N. */
export function yearOptions(plusMinus = 2): number[] {
  const y = currentYear();
  const out: number[] = [];
  for (let i = y - plusMinus; i <= y + plusMinus; i++) out.push(i);
  return out;
}

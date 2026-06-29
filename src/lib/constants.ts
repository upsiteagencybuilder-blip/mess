export const MESS_TYPES = [
  { value: "STUDENT_MALE", label: "ছাত্র (ছেলে)", labelEn: "Student (Male)" },
  { value: "STUDENT_FEMALE", label: "ছাত্রী (মেয়ে)", labelEn: "Student (Female)" },
  { value: "PROFESSIONAL", label: "চাকরিজীবী", labelEn: "Professional" },
  { value: "MIXED", label: "মিক্সড", labelEn: "Mixed" },
] as const;

export const AMENITIES = [
  { key: "wifi", label: "ওয়াইফাই", labelEn: "WiFi", icon: "wifi" },
  { key: "filteredWater", label: "ফিল্টার পানি", labelEn: "Filtered Water", icon: "droplet" },
  { key: "generator", label: "জেনারেটর", labelEn: "Generator", icon: "zap" },
  { key: "security", label: "সিকিউরিটি", labelEn: "Security Guard", icon: "shield" },
  { key: "cctv", label: "সিসিটিভি", labelEn: "CCTV", icon: "cctv" },
  { key: "parking", label: "পার্কিং", labelEn: "Parking", icon: "car" },
  { key: "lift", label: "লিফট", labelEn: "Lift", icon: "arrow-up" },
  { key: "kitchen", label: "কিচেন", labelEn: "Kitchen", icon: "chef-hat" },
  { key: "washingMachine", label: "ওয়াশিং মেশিন", labelEn: "Washing Machine", icon: "washing-machine" },
  { key: "geyser", label: "গিজার (গরম পানি)", labelEn: "Geyser", icon: "flame" },
  { key: "dining", label: "ডাইনিং স্পেস", labelEn: "Dining Space", icon: "utensils" },
  { key: "rooftop", label: "রুফটপ অ্যাক্সেস", labelEn: "Rooftop Access", icon: "building" },
] as const;

export const UTILITY_LABELS = [
  { key: "electricity", label: "বিদ্যুৎ বিল", labelEn: "Electricity" },
  { key: "gas", label: "গ্যাস বিল", labelEn: "Gas" },
  { key: "internet", label: "ইন্টারনেট বিল", labelEn: "Internet" },
  { key: "garbage", label: "ময়লা বিল", labelEn: "Garbage" },
  { key: "caretaker", label: "কেয়ারটেকার বিল", labelEn: "Caretaker" },
] as const;

export const ROLES = [
  { value: "TENANT", label: "সিট অন্বেষণকারী / মেম্বর", labelEn: "Seat Seeker / Member" },
  { value: "OWNER", label: "মেস মালিক / ম্যানেজার", labelEn: "Owner / Manager" },
  { value: "STAFF", label: "স্টাফ / কেয়ারটেকার", labelEn: "Staff / Caretaker" },
] as const;

export function roleLabel(role: string): string {
  return ROLES.find((r) => r.value === role)?.label ?? role;
}

export function messTypeLabel(type: string): string {
  return MESS_TYPES.find((t) => t.value === type)?.label ?? type;
}

// Bangladesh areas with coordinates — focused on Rajshahi University surroundings
// Coordinates verified via OpenStreetMap Nominatim geocoding
export const BANGLADESH_AREAS = [
  { area: "Kazla", city: "Rajshahi", lat: 24.3627, lng: 88.6333 },
  { area: "Motihar", city: "Rajshahi", lat: 24.3700, lng: 88.6373 },
  { area: "Binodpur", city: "Rajshahi", lat: 24.3676, lng: 88.6437 },
  { area: "Talaimari", city: "Rajshahi", lat: 24.3617, lng: 88.6269 },
  { area: "Baharampur", city: "Rajshahi", lat: 24.3800, lng: 88.5857 },
  { area: "Alupotti", city: "Rajshahi", lat: 24.3740, lng: 88.6180 },
  { area: "Shalbagan", city: "Rajshahi", lat: 24.3790, lng: 88.6120 },
  { area: "Padma Residential", city: "Rajshahi", lat: 24.3550, lng: 88.6550 },
];

// Rajshahi University center coordinate (verified via OpenStreetMap)
export const RAJSHAHI_UNIVERSITY = { lat: 24.3714, lng: 88.6422, name: "Rajshahi University" };

export function formatBDT(amount: number): string {
  return "৳" + amount.toLocaleString("en-BD");
}

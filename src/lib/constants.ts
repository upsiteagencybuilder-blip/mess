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

// Bangladesh areas with coordinates (Dhaka-focused for realistic messes)
export const BANGLADESH_AREAS = [
  { area: "Dhanmondi", city: "Dhaka", lat: 23.7461, lng: 90.3742 },
  { area: "Mohakhali", city: "Dhaka", lat: 23.7788, lng: 90.4012 },
  { area: "Bashundhara", city: "Dhaka", lat: 23.8133, lng: 90.4254 },
  { area: "Mirpur", city: "Dhaka", lat: 23.8068, lng: 90.3686 },
  { area: "Uttara", city: "Dhaka", lat: 23.8728, lng: 90.3984 },
  { area: "Mohammadpur", city: "Dhaka", lat: 23.7657, lng: 90.3612 },
  { area: "Farmgate", city: "Dhaka", lat: 23.7549, lng: 90.3913 },
  { area: "Panthapath", city: "Dhaka", lat: 23.7509, lng: 90.3843 },
  { area: "Chittagong", city: "Chittagong", lat: 22.3569, lng: 91.7832 },
  { area: "Sylhet", city: "Sylhet", lat: 24.8949, lng: 91.8687 },
];

export function formatBDT(amount: number): string {
  return "৳" + amount.toLocaleString("en-BD");
}

import type { Country, GuidanceCategory } from "@/types";

export const countries: Country[] = [
  { code: "US", name: "United States", flag: "🇺🇸", currency: "USD", language: "English", timezone: "America/New_York" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", currency: "GBP", language: "English", timezone: "Europe/London" },
  { code: "DE", name: "Germany", flag: "🇩🇪", currency: "EUR", language: "German", timezone: "Europe/Berlin" },
  { code: "FR", name: "France", flag: "🇫🇷", currency: "EUR", language: "French", timezone: "Europe/Paris" },
  { code: "JP", name: "Japan", flag: "🇯🇵", currency: "JPY", language: "Japanese", timezone: "Asia/Tokyo" },
  { code: "AU", name: "Australia", flag: "🇦🇺", currency: "AUD", language: "English", timezone: "Australia/Sydney" },
  { code: "CA", name: "Canada", flag: "🇨🇦", currency: "CAD", language: "English/French", timezone: "America/Toronto" },
  { code: "SG", name: "Singapore", flag: "🇸🇬", currency: "SGD", language: "English/Mandarin/Malay/Tamil", timezone: "Asia/Singapore" },
  { code: "AE", name: "UAE", flag: "🇦🇪", currency: "AED", language: "Arabic/English", timezone: "Asia/Dubai" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱", currency: "EUR", language: "Dutch", timezone: "Europe/Amsterdam" },
  { code: "SE", name: "Sweden", flag: "🇸🇪", currency: "SEK", language: "Swedish", timezone: "Europe/Stockholm" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭", currency: "CHF", language: "German/French/Italian", timezone: "Europe/Zurich" },
  { code: "KR", name: "South Korea", flag: "🇰🇷", currency: "KRW", language: "Korean", timezone: "Asia/Seoul" },
  { code: "BR", name: "Brazil", flag: "🇧🇷", currency: "BRL", language: "Portuguese", timezone: "America/Sao_Paulo" },
  { code: "MX", name: "Mexico", flag: "🇲🇽", currency: "MXN", language: "Spanish", timezone: "America/Mexico_City" },
  { code: "IN", name: "India", flag: "🇮🇳", currency: "INR", language: "Hindi/English", timezone: "Asia/Kolkata" },
  { code: "TH", name: "Thailand", flag: "🇹🇭", currency: "THB", language: "Thai", timezone: "Asia/Bangkok" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", currency: "NGN", language: "English", timezone: "Africa/Lagos" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", currency: "ZAR", language: "English/Afrikaans/Zulu", timezone: "Africa/Johannesburg" },
  { code: "ES", name: "Spain", flag: "🇪🇸", currency: "EUR", language: "Spanish", timezone: "Europe/Madrid" },
];

export const guidanceCategories: GuidanceCategory[] = [
  {
    id: "transport",
    title: "Transport Options",
    icon: "🚗",
    description: "Public transit, ride-sharing, driving regulations",
    items: [
      { id: "t1", title: "Public Transit Systems", content: "Metro, bus, and rail networks available in the area.", tags: ["transit", "metro", "bus"], lastUpdated: new Date() },
      { id: "t2", title: "Ride-Sharing Apps", content: "Popular ride-hailing services and how to use them.", tags: ["uber", "lyft", "grab"], lastUpdated: new Date() },
      { id: "t3", title: "Driving License Rules", content: "International driving permit requirements and local regulations.", tags: ["driving", "license", "car"], lastUpdated: new Date() },
    ],
  },
  {
    id: "payments",
    title: "Payments & Money",
    icon: "💳",
    description: "Currency, banking, payment methods, tipping",
    items: [
      { id: "p1", title: "Currency Exchange", content: "Best practices for exchanging money and getting local currency.", tags: ["currency", "exchange", "money"], lastUpdated: new Date() },
      { id: "p2", title: "Banking Procedures", content: "Opening a local bank account and managing finances.", tags: ["bank", "account", "finance"], lastUpdated: new Date() },
      { id: "p3", title: "Payment Methods", content: "Common payment methods including mobile payments and cards.", tags: ["payment", "card", "mobile"], lastUpdated: new Date() },
      { id: "p4", title: "Tipping Customs", content: "Local tipping etiquette and expected amounts.", tags: ["tipping", "customs", "etiquette"], lastUpdated: new Date() },
    ],
  },
  {
    id: "culture",
    title: "Cultural Rules & Etiquette",
    icon: "🤝",
    description: "Social norms, greetings, dining customs",
    items: [
      { id: "c1", title: "Social Norms", content: "General social expectations and behaviors.", tags: ["social", "norms", "behavior"], lastUpdated: new Date() },
      { id: "c2", title: "Greetings & Communication", content: "How to greet people and communication styles.", tags: ["greetings", "communication"], lastUpdated: new Date() },
      { id: "c3", title: "Dining Customs", content: "Restaurant etiquette, eating customs, and food culture.", tags: ["dining", "food", "restaurant"], lastUpdated: new Date() },
      { id: "c4", title: "Dress Codes", content: "Appropriate attire for different settings.", tags: ["dress", "clothing", "attire"], lastUpdated: new Date() },
    ],
  },
  {
    id: "safety",
    title: "Safety Considerations",
    icon: "🛡️",
    description: "Emergency numbers, scams, safe areas",
    items: [
      { id: "s1", title: "Emergency Numbers", content: "Local emergency contact numbers and services.", tags: ["emergency", "police", "hospital"], lastUpdated: new Date() },
      { id: "s2", title: "Common Scams", content: "Tourist scams to watch out for and how to avoid them.", tags: ["scams", "safety", "tourist"], lastUpdated: new Date() },
      { id: "s3", title: "Safe Neighborhoods", content: "Areas known for safety and those to exercise caution.", tags: ["neighborhoods", "safety", "areas"], lastUpdated: new Date() },
    ],
  },
  {
    id: "services",
    title: "Useful Local Services",
    icon: "🏥",
    description: "Healthcare, mobile carriers, postal services",
    items: [
      { id: "ls1", title: "Healthcare Facilities", content: "Hospitals, clinics, and pharmacies in the area.", tags: ["healthcare", "hospital", "pharmacy"], lastUpdated: new Date() },
      { id: "ls2", title: "Mobile Phone Carriers", content: "Local SIM cards and mobile phone providers.", tags: ["mobile", "sim", "phone"], lastUpdated: new Date() },
      { id: "ls3", title: "Postal Services", content: "Mail services and shipping options.", tags: ["postal", "mail", "shipping"], lastUpdated: new Date() },
      { id: "ls4", title: "Administrative Offices", content: "Government offices for visas, permits, and registrations.", tags: ["visa", "permit", "government"], lastUpdated: new Date() },
    ],
  },
];

export function getCountryByCode(code: string): Country | undefined {
  return countries.find((c) => c.code === code);
}

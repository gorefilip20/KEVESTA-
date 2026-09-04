import type { Apartment } from "@/types";

const amenityPool = [
  "WiFi", "Air Conditioning", "Kitchen", "Washer", "Dryer", "TV",
  "Pool", "Gym", "Parking", "Elevator", "Balcony", "Workspace",
  "Coffee Machine", "Dishwasher", "Heating", "Iron", "Hair Dryer",
  "Security Camera", "Smoke Alarm", "First Aid Kit", "Fire Extinguisher",
  "Rooftop Access", "Garden", "Pet Friendly", "EV Charger",
];

const neighborhoods = [
  "City Center", "Downtown", "Waterfront", "Arts District", "University Quarter",
  "Old Town", "Financial District", "Residential Suburb", "Beachside", "Historic District",
];

const hostNames = [
  "Maria S.", "James K.", "Yuki T.", "Hans M.", "Sophie L.",
  "Ahmed R.", "Chen W.", "Isabella P.", "Oliver B.", "Priya D.",
];

function seededRandom(seed: number, n: number): number {
  return ((seed * (n + 1) * 16807 + 12345) % 2147483647) / 2147483647;
}

function generateApartments(): Apartment[] {
  const listings: Apartment[] = [];
  const cities = [
    { city: "New York", country: "US", currency: "USD", base: 150 },
    { city: "London", country: "GB", currency: "GBP", base: 130 },
    { city: "Tokyo", country: "JP", currency: "USD", base: 90 },
    { city: "Paris", country: "FR", currency: "EUR", base: 120 },
    { city: "Berlin", country: "DE", currency: "EUR", base: 85 },
    { city: "Singapore", country: "SG", currency: "SGD", base: 140 },
    { city: "Dubai", country: "AE", currency: "AED", base: 180 },
    { city: "Sydney", country: "AU", currency: "AUD", base: 130 },
    { city: "Amsterdam", country: "NL", currency: "EUR", base: 110 },
    { city: "Seoul", country: "KR", currency: "USD", base: 75 },
    { city: "Barcelona", country: "ES", currency: "EUR", base: 95 },
    { city: "Zurich", country: "CH", currency: "CHF", base: 200 },
    { city: "Bangkok", country: "TH", currency: "USD", base: 45 },
    { city: "Cape Town", country: "ZA", currency: "USD", base: 60 },
    { city: "Mexico City", country: "MX", currency: "USD", base: 55 },
  ];

  const adjectives = [
    "Modern", "Cozy", "Luxury", "Stylish", "Spacious",
    "Charming", "Bright", "Elegant", "Contemporary", "Stunning",
  ];
  const types = [
    "Studio", "Apartment", "Loft", "Penthouse", "Suite",
    "Flat", "Condo", "Residence",
  ];

  let id = 0;
  for (const loc of cities) {
    const count = 3 + Math.floor(seededRandom(id, 0) * 4);
    for (let i = 0; i < count; i++) {
      const seed = id * 100 + i;
      const adj = adjectives[Math.floor(seededRandom(seed, 1) * adjectives.length)];
      const type = types[Math.floor(seededRandom(seed, 2) * types.length)];
      const nbhd = neighborhoods[Math.floor(seededRandom(seed, 3) * neighborhoods.length)];
      const bedrooms = 1 + Math.floor(seededRandom(seed, 4) * 4);
      const priceMultiplier = 0.7 + seededRandom(seed, 5) * 1.6;
      const price = Math.round(loc.base * priceMultiplier * (bedrooms === 1 ? 1 : bedrooms * 0.7));
      const numAmenities = 6 + Math.floor(seededRandom(seed, 6) * 10);
      const amenities: string[] = [];
      const shuffled = [...amenityPool].sort(() => seededRandom(seed, 7 + amenities.length) - 0.5);
      for (let a = 0; a < numAmenities && a < shuffled.length; a++) {
        amenities.push(shuffled[a]);
      }

      const gradientColors = [
        "from-blue-400 to-purple-500",
        "from-emerald-400 to-teal-500",
        "from-orange-400 to-rose-500",
        "from-cyan-400 to-blue-500",
        "from-violet-400 to-fuchsia-500",
        "from-amber-400 to-orange-500",
      ];
      const colorIdx = Math.floor(seededRandom(seed, 20) * gradientColors.length);

      listings.push({
        id: `APT-${String(id).padStart(4, "0")}`,
        title: `${adj} ${bedrooms}BR ${type} in ${nbhd}`,
        location: `${nbhd}, ${loc.city}`,
        city: loc.city,
        country: loc.country,
        price,
        currency: loc.currency,
        priceUnit: seededRandom(seed, 8) > 0.6 ? "night" : seededRandom(seed, 9) > 0.5 ? "week" : "month",
        images: [`gradient:${gradientColors[colorIdx]}`],
        bedrooms,
        bathrooms: Math.max(1, Math.floor(bedrooms * 0.8)),
        maxGuests: bedrooms * 2,
        sqft: 350 + bedrooms * 250 + Math.floor(seededRandom(seed, 10) * 300),
        amenities,
        rating: 3.8 + seededRandom(seed, 11) * 1.2,
        reviewCount: 5 + Math.floor(seededRandom(seed, 12) * 195),
        host: {
          name: hostNames[Math.floor(seededRandom(seed, 13) * hostNames.length)],
          verified: seededRandom(seed, 14) > 0.3,
          responseRate: 80 + Math.floor(seededRandom(seed, 15) * 20),
        },
        safetyRating: 3 + Math.floor(seededRandom(seed, 16) * 3),
        neighborhood: nbhd,
        description: `Beautiful ${adj.toLowerCase()} ${type.toLowerCase()} located in the heart of ${nbhd}, ${loc.city}. This ${bedrooms}-bedroom property offers ${amenities.slice(0, 3).join(", ")} and more. Perfect for ${bedrooms <= 1 ? "solo travelers or couples" : "families or groups"} looking for a comfortable stay.`,
        availableFrom: "2025-01-01",
        availableTo: "2026-12-31",
        instantBook: seededRandom(seed, 17) > 0.4,
        featured: seededRandom(seed, 18) > 0.75,
      });
      id++;
    }
  }

  return listings;
}

export const apartments = generateApartments();

export function searchApartments(filters: {
  city?: string;
  country?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  priceUnit?: string;
  instantBook?: boolean;
}): Apartment[] {
  return apartments.filter((apt) => {
    if (filters.city && !apt.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
    if (filters.country && apt.country !== filters.country) return false;
    if (filters.minPrice && apt.price < filters.minPrice) return false;
    if (filters.maxPrice && apt.price > filters.maxPrice) return false;
    if (filters.bedrooms && apt.bedrooms < filters.bedrooms) return false;
    if (filters.priceUnit && apt.priceUnit !== filters.priceUnit) return false;
    if (filters.instantBook && !apt.instantBook) return false;
    return true;
  });
}

export function getApartmentById(id: string): Apartment | undefined {
  return apartments.find((a) => a.id === id);
}

export function getFeaturedApartments(): Apartment[] {
  return apartments.filter((a) => a.featured);
}

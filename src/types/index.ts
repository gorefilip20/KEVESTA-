export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: {
    category?: string;
    sources?: string[];
    confidence?: number;
    country?: string;
  };
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  type: "travel" | "services" | "support";
  createdAt: Date;
  updatedAt: Date;
  country?: string;
}

export interface Country {
  code: string;
  name: string;
  flag: string;
  currency: string;
  language: string;
  timezone: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  subcategories: string[];
}

export interface ServiceRecommendation {
  id: string;
  name: string;
  category: string;
  rating: number;
  description: string;
  url?: string;
  priceRange?: string;
  availableIn: string[];
  features: string[];
  logo?: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  status: "open" | "in_progress" | "escalated" | "resolved";
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  sentiment?: "positive" | "neutral" | "negative";
  resolution?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  currentCountry?: string;
  destinationCountry?: string;
  preferences: {
    language: string;
    currency: string;
    dietaryRestrictions?: string[];
    travelStyle?: string;
    budget?: "budget" | "moderate" | "premium";
  };
}

export interface GuidanceCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
  items: GuidanceItem[];
}

export interface GuidanceItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  lastUpdated: Date;
}

export interface DashboardStats {
  totalQueries: number;
  countriesExplored: number;
  servicesRecommended: number;
  ticketsResolved: number;
  satisfactionRate: number;
}

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  passengers: number;
  cabinClass: "economy" | "premium_economy" | "business" | "first";
  tripType: "one_way" | "round_trip";
}

export interface FlightResult {
  id: string;
  airline: string;
  airlineLogo: string;
  flightNumber: string;
  origin: Airport;
  destination: Airport;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  stopCities?: string[];
  price: number;
  currency: string;
  cabinClass: string;
  seatsLeft?: number;
  baggage: string;
  aircraft?: string;
}

export interface Apartment {
  id: string;
  title: string;
  location: string;
  city: string;
  country: string;
  price: number;
  currency: string;
  priceUnit: "night" | "week" | "month";
  images: string[];
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  sqft: number;
  amenities: string[];
  rating: number;
  reviewCount: number;
  host: {
    name: string;
    verified: boolean;
    responseRate: number;
  };
  safetyRating: number;
  neighborhood: string;
  description: string;
  availableFrom: string;
  availableTo: string;
  instantBook: boolean;
  featured?: boolean;
}

export interface CryptoWallet {
  currency: string;
  symbol: string;
  network: string;
  icon: string;
  balance?: number;
  address?: string;
}

export interface PaymentTransaction {
  id: string;
  type: "flight" | "apartment";
  itemId: string;
  itemTitle: string;
  amount: number;
  currency: string;
  cryptoCurrency: string;
  cryptoAmount: number;
  walletAddress: string;
  status: "pending" | "confirming" | "confirmed" | "failed";
  txHash?: string;
  createdAt: Date;
  confirmedAt?: Date;
}

export interface CheckoutState {
  step: "select_crypto" | "connect_wallet" | "confirm" | "processing" | "complete";
  selectedCrypto: string | null;
  walletConnected: boolean;
  transaction: PaymentTransaction | null;
}

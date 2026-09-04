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

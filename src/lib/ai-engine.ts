import type { Message } from "@/types";
import { countries } from "@/data/countries";
import { serviceRecommendations } from "@/data/services";
import { generateId } from "./utils";

interface RAGContext {
  country: string;
  category?: string;
  userQuery: string;
}

function retrieveContext(ctx: RAGContext): string {
  const country = countries.find((c) => c.code === ctx.country);
  if (!country) return "";

  const relevantServices = serviceRecommendations.filter((s) =>
    s.availableIn.includes(ctx.country)
  );

  return `Country: ${country.name} (${country.code})
Currency: ${country.currency}
Language: ${country.language}
Timezone: ${country.timezone}
Available services: ${relevantServices.map((s) => s.name).join(", ")}`;
}

const COUNTRY_KNOWLEDGE: Record<string, Record<string, string>> = {
  US: {
    transport: "The US has extensive road networks. Major cities like New York, San Francisco, and Chicago have public transit systems (subway/metro, buses). Ride-sharing through Uber and Lyft is widely available. A valid driver's license from your home country is usually accepted for short stays, but an International Driving Permit (IDP) is recommended. Speed limits are typically 25-35 mph in cities and 55-75 mph on highways.",
    payments: "The US dollar (USD) is the currency. Credit and debit cards are accepted nearly everywhere, with Visa and Mastercard being the most common. Apple Pay and Google Pay are widely supported. Tipping is expected: 18-20% at restaurants, $1-2 per drink at bars, 15-20% for taxi rides. ATMs are plentiful but may charge $2-5 fees for non-network cards.",
    culture: "Americans are generally friendly and informal. Handshakes are the standard greeting in professional settings. Personal space is valued — maintain about an arm's length distance. Punctuality is important for business meetings. Small talk is common and expected. Dress codes vary widely but lean casual in most social settings.",
    safety: "Emergency number: 911 (police, fire, ambulance). The US is generally safe for travelers, but be aware of your surroundings in unfamiliar areas. Avoid leaving valuables visible in parked cars. Be cautious of phone scams and phishing. Travel insurance is highly recommended as healthcare costs can be very high.",
    services: "Major healthcare chains include CVS MinuteClinic and Urgent Care centers for non-emergencies. For mobile service, T-Mobile, AT&T, and Verizon are the major carriers. USPS handles mail service, with UPS and FedEx for packages. The DMV handles driving-related services, and local city halls for civic matters.",
  },
  GB: {
    transport: "The UK has an excellent public transport network. London's Underground (Tube), Overground, and bus network cover the city extensively. Get an Oyster card or use contactless payment. National Rail connects cities across the country. Uber is available in major cities. Driving is on the left side of the road. You can drive with most international licenses for up to 12 months.",
    payments: "The British Pound Sterling (GBP) is the currency. Contactless payments are extremely popular — most places accept tap-to-pay for amounts up to £100. Chip and PIN is standard for cards. Tipping: 10-15% at restaurants (check if service charge is included), not expected in pubs when ordering at the bar. Cash is becoming less common but still accepted.",
    culture: "British people value politeness and queuing etiquette. 'Please', 'thank you', and 'sorry' are used frequently. The pub is a central social institution. Tea is offered in most settings. British humor tends to be dry and self-deprecating. Punctuality is appreciated. Business dress is typically smart casual to formal.",
    safety: "Emergency number: 999 (or 112). The UK is generally very safe. Be aware of pickpockets in tourist areas. CCTV is widespread. The NHS provides emergency healthcare to all visitors. Register with a GP if staying long-term.",
    services: "The NHS provides healthcare — register with a local GP surgery for non-emergencies. Major mobile carriers: EE, Three, Vodafone, O2. Royal Mail handles postal services. Gov.uk is the central portal for government services including visas and driving licenses.",
  },
  JP: {
    transport: "Japan has one of the world's best public transport systems. The Shinkansen (bullet train) connects major cities. Tokyo's rail network includes JR lines, Metro, and private railways. Get a Suica or Pasmo IC card for seamless travel. Taxis are clean and safe but expensive. An International Driving Permit is required to drive, and driving is on the left.",
    payments: "The Japanese Yen (JPY) is the currency. Japan is still quite cash-dependent, especially outside major cities. However, IC cards (Suica/Pasmo) work at many convenience stores and restaurants. Credit cards are accepted at larger establishments. There is no tipping culture — it can actually be considered rude.",
    culture: "Japanese culture emphasizes respect and harmony. Bow when greeting people. Remove shoes when entering homes and some restaurants (look for shoe racks). Speak quietly on public transport — phone calls are discouraged. Business cards (meishi) should be exchanged with both hands and treated with respect. Punctuality is extremely important.",
    safety: "Emergency: 110 (police), 119 (fire/ambulance). Japan is one of the safest countries in the world. Lost items are frequently returned. Natural disasters (earthquakes, typhoons) are a concern — familiarize yourself with evacuation procedures and download disaster alert apps.",
    services: "Excellent healthcare system — hospitals have English-speaking staff in major cities. Major carriers: NTT Docomo, au (KDDI), SoftBank. Japan Post handles mail reliably. For long-term residents, ward offices (kuyakusho) handle residence registration, health insurance, and other civic services.",
  },
  DE: {
    transport: "Germany has excellent public transport. Deutsche Bahn (DB) connects cities nationwide. Cities have U-Bahn (subway), S-Bahn (commuter rail), trams, and buses. Buy tickets before boarding — plainclothes inspectors check regularly. The Deutschland-Ticket offers unlimited local/regional transport. The Autobahn has sections with no speed limit but recommended speed is 130 km/h.",
    payments: "The Euro (EUR) is the currency. Germany is more cash-oriented than many European neighbors — always carry some cash. EC-Karte (debit) is widely accepted; credit cards less so at smaller shops. Tipping: round up the bill or add 5-10% at restaurants, tell the server the total amount including tip when paying.",
    culture: "Germans value punctuality, directness, and efficiency. Being late is considered very rude. Address people formally (Herr/Frau + last name) until invited to use first names. Sunday is a rest day — most shops are closed. Quiet hours (Ruhezeit) are observed, typically 10pm-6am and all day Sunday.",
    safety: "Emergency: 112. Germany is very safe overall. Register your address (Anmeldung) at the local Bürgeramt within 14 days of moving. Health insurance is mandatory — public (gesetzliche) or private (private Krankenversicherung).",
    services: "Healthcare is excellent with mandatory health insurance. Major carriers: Telekom, Vodafone, O2. Deutsche Post handles mail. The Bürgeramt (citizen's office) handles registrations and documents. The Ausländerbehörde handles immigration matters.",
  },
  SG: {
    transport: "Singapore's MRT (Mass Rapid Transit) is clean, efficient, and affordable. Buses complement the rail network. Get an EZ-Link or NETS FlashPay card. Grab is the dominant ride-hailing service. Taxis are metered and reliable. An International Driving Permit works for up to 12 months. Electronic Road Pricing (ERP) charges apply in certain zones.",
    payments: "The Singapore Dollar (SGD) is the currency. Singapore is very digital-payment friendly. PayNow, GrabPay, and contactless cards are widely accepted. Tipping is not expected — a 10% service charge is usually included in restaurant bills. GST of 9% applies to most goods and services.",
    culture: "Singapore is a multicultural society with Chinese, Malay, Indian, and Western influences. English is the lingua franca for business. Remove shoes when entering homes. Chewing gum is restricted. Durian fruit is banned on public transport. Fines for littering, jaywalking, and other offenses are strictly enforced.",
    safety: "Emergency: 999 (police), 995 (fire/ambulance). Singapore is one of the world's safest cities with very low crime rates. Drug laws are extremely strict — trafficking can carry the death penalty. Carry your passport or a copy at all times.",
    services: "Public healthcare is world-class (Singapore General Hospital, National University Hospital). Major carriers: Singtel, StarHub, M1. SingPost handles mail. CPF (Central Provident Fund) is the mandatory savings scheme. HDB handles public housing.",
  },
};

function getCountryKnowledge(countryCode: string, topic: string): string {
  const countryData = COUNTRY_KNOWLEDGE[countryCode];
  if (!countryData) {
    return `I have general travel guidance available. For ${countryCode}-specific details, I'll provide the best information based on common travel knowledge for this region.`;
  }
  return countryData[topic] || Object.values(countryData).join("\n\n");
}

function detectTopic(query: string): string {
  const q = query.toLowerCase();
  if (/transport|bus|train|metro|drive|taxi|uber|ride|car|subway|flight/.test(q)) return "transport";
  if (/pay|money|currency|bank|card|tip|cash|atm|exchange|wallet/.test(q)) return "payments";
  if (/cultur|etiquett|greet|custom|dress|food|dining|social|norm|behavior/.test(q)) return "culture";
  if (/safe|emergency|scam|danger|police|hospital|crime|security/.test(q)) return "safety";
  if (/service|health|phone|mobile|carrier|sim|postal|mail|office|doctor|pharmacy/.test(q)) return "services";
  return "general";
}

function detectSentiment(text: string): "positive" | "neutral" | "negative" {
  const negative = /angry|frustrated|terrible|worst|hate|awful|broken|unacceptable|ridiculous|scam|fraud|stealing/i;
  const positive = /great|thank|love|excellent|amazing|wonderful|perfect|helpful|appreciate/i;

  if (negative.test(text)) return "negative";
  if (positive.test(text)) return "positive";
  return "neutral";
}

function detectUrgency(text: string): "low" | "medium" | "high" {
  const high = /urgent|emergency|immediately|asap|critical|dangerous|stranded|lost|stolen|help me now/i;
  const medium = /soon|important|need help|problem|issue|broken|not working/i;

  if (high.test(text)) return "high";
  if (medium.test(text)) return "medium";
  return "low";
}

export async function generateTravelResponse(
  query: string,
  countryCode: string,
  conversationHistory: Message[]
): Promise<Message> {
  const topic = detectTopic(query);
  const context = retrieveContext({ country: countryCode, userQuery: query });
  const knowledge = getCountryKnowledge(countryCode, topic);
  const country = countries.find((c) => c.code === countryCode);

  let response = "";

  if (topic === "general") {
    response = `Here's a comprehensive overview for ${country?.name || countryCode}:\n\n`;
    const allTopics = COUNTRY_KNOWLEDGE[countryCode];
    if (allTopics) {
      Object.entries(allTopics).forEach(([key, value]) => {
        const emoji = key === "transport" ? "🚗" : key === "payments" ? "💳" : key === "culture" ? "🤝" : key === "safety" ? "🛡️" : "🏥";
        response += `**${emoji} ${key.charAt(0).toUpperCase() + key.slice(1)}**\n${value}\n\n`;
      });
    } else {
      response += `I can help you with transport, payments, cultural norms, safety, and local services for your destination. What specific area would you like to know about?`;
    }
  } else {
    const emoji = topic === "transport" ? "🚗" : topic === "payments" ? "💳" : topic === "culture" ? "🤝" : topic === "safety" ? "🛡️" : "🏥";
    response = `**${emoji} ${topic.charAt(0).toUpperCase() + topic.slice(1)} in ${country?.name || countryCode}**\n\n${knowledge}`;
  }

  if (context) {
    response += `\n\n---\n*📍 Based on verified data for ${country?.name}. Last updated: ${new Date().toLocaleDateString()}*`;
  }

  return {
    id: generateId(),
    role: "assistant",
    content: response,
    timestamp: new Date(),
    metadata: {
      category: topic,
      country: countryCode,
      confidence: COUNTRY_KNOWLEDGE[countryCode] ? 0.95 : 0.7,
      sources: ["Kevesta Knowledge Base", "Country-specific database"],
    },
  };
}

export async function generateServiceResponse(
  query: string,
  countryCode: string
): Promise<Message> {
  const country = countries.find((c) => c.code === countryCode);
  const availableServices = serviceRecommendations.filter((s) =>
    s.availableIn.includes(countryCode)
  );

  const q = query.toLowerCase();
  let filteredServices = availableServices;
  if (/ride|taxi|car|transport|uber|lyft|grab/.test(q)) {
    filteredServices = availableServices.filter((s) => s.category === "ride-hailing");
  } else if (/stay|hotel|apartment|rent|accommodation|airbnb|booking/.test(q)) {
    filteredServices = availableServices.filter((s) => s.category === "accommodation");
  } else if (/food|eat|deliver|restaurant|grocery/.test(q)) {
    filteredServices = availableServices.filter((s) => s.category === "food-delivery");
  } else if (/bank|money|transfer|finance|payment/.test(q)) {
    filteredServices = availableServices.filter((s) => s.category === "finance");
  }

  let response = `**🌍 Recommended Services in ${country?.name || countryCode}**\n\n`;

  if (filteredServices.length === 0) {
    response += `I couldn't find specific services matching your query for ${country?.name}. Here are all available services in the region:\n\n`;
    filteredServices = availableServices;
  }

  filteredServices.forEach((service) => {
    response += `**${service.name}** — ${"★".repeat(Math.floor(service.rating))} ${service.rating}/5\n`;
    response += `${service.description}\n`;
    response += `Price range: ${service.priceRange || "Varies"} | Features: ${service.features.slice(0, 3).join(", ")}\n\n`;
  });

  response += `---\n*💡 These recommendations are personalized based on your location (${country?.name}) and preferences.*`;

  return {
    id: generateId(),
    role: "assistant",
    content: response,
    timestamp: new Date(),
    metadata: {
      category: "services",
      country: countryCode,
      confidence: 0.9,
      sources: ["Kevesta Services Database"],
    },
  };
}

export async function generateSupportResponse(
  query: string,
  conversationHistory: Message[]
): Promise<{ message: Message; sentiment: string; urgency: string; canAutoResolve: boolean }> {
  const sentiment = detectSentiment(query);
  const urgency = detectUrgency(query);

  const autoResolvable = /password|reset|status|tracking|update address|change email|cancel subscription|refund status/i;
  const canAutoResolve = autoResolvable.test(query);

  let response = "";

  if (canAutoResolve) {
    if (/password|reset/i.test(query)) {
      response = `**🔐 Password Reset**\n\nI can help you reset your password right away. Here's what to do:\n\n1. Click the "Reset Password" link on the login page\n2. Enter your registered email address\n3. Check your inbox (and spam folder) for the reset link\n4. The link expires in 30 minutes\n\nIf you don't receive the email within 5 minutes, I can resend it or verify your email address on file.\n\n✅ *This issue has been automatically resolved.*`;
    } else if (/status|tracking/i.test(query)) {
      response = `**📦 Status Check**\n\nI've looked into your account and here's the current status:\n\n• Your recent request is being processed\n• Estimated completion: within 24-48 hours\n• You'll receive an email notification when complete\n\nWould you like me to set up additional notifications for updates?`;
    } else if (/address|email/i.test(query)) {
      response = `**📝 Account Update**\n\nI can help you update your account details. For security, I'll need to verify your identity first.\n\nPlease confirm:\n1. The email address currently on file\n2. The new information you'd like to update\n\nOnce verified, changes typically take effect immediately.`;
    } else {
      response = `**🔄 Processing Your Request**\n\nI understand you need help with this. Let me process your request:\n\n• Your request has been logged\n• Automated resolution is in progress\n• You'll receive confirmation once complete\n\nIs there anything else I can help you with?`;
    }
  } else {
    if (sentiment === "negative" && urgency === "high") {
      response = `**🚨 Priority Support**\n\nI understand this is an urgent matter and I can sense your frustration. I want to make sure this gets resolved properly.\n\nI've gathered the following context from our conversation:\n• Issue category: ${detectTopic(query)}\n• Priority: High\n• Your concern: "${query.slice(0, 100)}..."\n\n**I'm escalating this to a specialist who can help immediately.** They'll have full context of our conversation, so you won't need to repeat yourself.\n\nExpected response time: **< 15 minutes**\n\nIn the meantime, is there anything else I can assist with?`;
    } else if (sentiment === "negative") {
      response = `**💬 Support Response**\n\nI'm sorry to hear about this issue. I want to help get this sorted out for you.\n\nBased on your description, here's what I recommend:\n\n1. Let me check if there's a known issue related to your concern\n2. If this requires specialized assistance, I'll connect you with our team who can take a closer look\n3. I'll make sure all context is preserved so you don't have to repeat anything\n\nCould you provide a few more details so I can find the best solution?`;
    } else {
      response = `**💬 Support Response**\n\nThanks for reaching out! I'm here to help.\n\nBased on your question, here's what I can share:\n\n• I've reviewed your account and recent activity\n• Let me look into the specifics of your request\n\nCould you tell me a bit more about what you're experiencing? That way I can provide the most accurate help.`;
    }
  }

  return {
    message: {
      id: generateId(),
      role: "assistant",
      content: response,
      timestamp: new Date(),
      metadata: {
        category: "support",
        confidence: canAutoResolve ? 0.95 : 0.75,
        sources: ["Kevesta Support System"],
      },
    },
    sentiment,
    urgency,
    canAutoResolve,
  };
}

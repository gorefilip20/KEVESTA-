import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, ticketId } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const sanitizedMessage = message.slice(0, 5000);

    const nlpAnalysis = {
      sentiment: analyzeSentiment(sanitizedMessage),
      urgency: analyzeUrgency(sanitizedMessage),
      intent: detectIntent(sanitizedMessage),
      canAutoResolve: checkAutoResolvable(sanitizedMessage),
    };

    return NextResponse.json({
      success: true,
      analysis: nlpAnalysis,
      ticketId: ticketId || `T-${Date.now().toString(36).toUpperCase()}`,
      response: {
        content: "Support response generated",
        metadata: {
          model: "kevesta-support-v1",
          nlpAnalysis,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function analyzeSentiment(text: string): string {
  const negative = /angry|frustrated|terrible|worst|hate|awful|broken|unacceptable/i;
  const positive = /great|thank|love|excellent|amazing|wonderful|perfect/i;
  if (negative.test(text)) return "negative";
  if (positive.test(text)) return "positive";
  return "neutral";
}

function analyzeUrgency(text: string): string {
  const high = /urgent|emergency|immediately|asap|critical|dangerous/i;
  const medium = /soon|important|need help|problem|issue/i;
  if (high.test(text)) return "high";
  if (medium.test(text)) return "medium";
  return "low";
}

function detectIntent(text: string): string {
  const t = text.toLowerCase();
  if (/password|reset|login|access/.test(t)) return "account_access";
  if (/bill|charge|payment|refund/.test(t)) return "billing";
  if (/update|change|modify|edit/.test(t)) return "account_update";
  if (/cancel|stop|end/.test(t)) return "cancellation";
  if (/status|track|where|when/.test(t)) return "status_inquiry";
  return "general_inquiry";
}

function checkAutoResolvable(text: string): boolean {
  return /password|reset|status|tracking|update address|change email|cancel subscription|refund status/i.test(text);
}

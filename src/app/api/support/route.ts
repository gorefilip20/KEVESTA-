import { NextRequest, NextResponse } from "next/server";
import { generateSupportResponse } from "@/lib/ai-engine";

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
    const result = await generateSupportResponse(sanitizedMessage, []);

    return NextResponse.json({
      success: true,
      analysis: {
        sentiment: result.sentiment,
        urgency: result.urgency,
        intent: "general_inquiry",
        canAutoResolve: result.canAutoResolve,
      },
      ticketId: ticketId || `T-${Date.now().toString(36).toUpperCase()}`,
      response: result.message,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

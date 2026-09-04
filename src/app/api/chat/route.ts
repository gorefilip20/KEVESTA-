import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, country, type, conversationHistory } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const sanitizedMessage = message.slice(0, 5000);
    const sanitizedCountry = (country || "US").slice(0, 5);

    return NextResponse.json({
      success: true,
      response: {
        content: `AI response for "${sanitizedMessage}" in ${sanitizedCountry}`,
        type: type || "travel",
        metadata: {
          country: sanitizedCountry,
          timestamp: new Date().toISOString(),
          model: "kevesta-rag-v1",
          ragSourcesUsed: true,
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

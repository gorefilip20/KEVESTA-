import { NextRequest, NextResponse } from "next/server";
import { getPaymentMetrics } from "@/lib/monitoring";

export async function GET(request: NextRequest) {
  const secret = process.env.MONITORING_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || request.headers.get("x-monitoring-secret");
  if (!secret || supplied !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const metrics = getPaymentMetrics(15);
  return NextResponse.json({ service: "kevesta-payments", checkedAt: new Date().toISOString(), ...metrics }, { status: metrics.status === "degraded" ? 503 : 200, headers: { "Cache-Control": "no-store" } });
}

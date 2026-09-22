import { getCurrentMobileUser, getCurrentUser } from "@/lib/server/auth";
import type { NextRequest } from "next/server";
export async function getRequestUser(request: NextRequest) {
  if (request.headers.has("authorization")) return getCurrentMobileUser(request);
  return getCurrentUser();
}

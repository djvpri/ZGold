// lib/api-helpers.ts
// Helper untuk extract tenant dari request
import { NextRequest } from "next/server";
import { getSession } from "./auth";

export async function getTenantFromRequest(req: NextRequest): Promise<{ tenantId: number; userId: number; role: string } | null> {
  const sessionId = req.headers.get("x-session-id");
  if (!sessionId) return null;

  const session = await getSession(sessionId);
  if (!session) return null;

  return {
    tenantId: session.tenant_id,
    userId: session.user_id,
    role: session.role,
  };
}
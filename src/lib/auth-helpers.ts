import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Get the current authenticated session on the server.
 * Throws if not authenticated.
 */
export async function getRequiredSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

/**
 * Middleware helper: returns a 401 response if not authenticated,
 * or a 403 response if the user lacks the required role.
 */
export async function requireRole(requiredRole: "ADMIN" | "MEMBER") {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      authorized: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  // ADMIN can do everything a MEMBER can
  if (requiredRole === "ADMIN" && session.user.role !== "ADMIN") {
    return {
      authorized: false as const,
      response: NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 }),
    };
  }

  return {
    authorized: true as const,
    session,
  };
}

/**
 * Simple auth check — returns session or error response.
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      authorized: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return {
    authorized: true as const,
    session,
  };
}

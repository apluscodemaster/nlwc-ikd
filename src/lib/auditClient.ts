"use client";

/**
 * Report an admin action to the audit log from the browser.
 *
 * Only for the flows that write straight to Firestore from the client
 * (devotionals, testimonies) and therefore have no server route to hook. Actions
 * that already go through an API route are recorded server-side — do NOT call
 * this for those, or they will be logged twice.
 *
 * The server takes the actor from the verified ID token, so the identity on the
 * entry is trustworthy even though the description originates here.
 *
 * Fire-and-forget by design: a failed audit write must never surface as a failed
 * save to the user, so this swallows everything.
 */

import { auth } from "@/lib/firebase";
import type { AuditAction, AuditResource } from "@/lib/auditLog";

export interface ClientAuditInput {
  action: AuditAction;
  resource: AuditResource;
  target?: string | null;
  targetId?: string | number | null;
  status?: "success" | "failure";
  detail?: Record<string, string | number | boolean | null> | null;
}

export async function reportAudit(input: ClientAuditInput): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const token = await user.getIdToken();

    await fetch("/api/admin/audit-log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
      // Let the request outlive a navigation triggered right after the save.
      keepalive: true,
    });
  } catch {
    // Best-effort only.
  }
}

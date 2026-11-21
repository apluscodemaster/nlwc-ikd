import { NextResponse, NextRequest } from "next/server";
import { requireAuthActor } from "@/lib/auth";
import { recordAudit } from "@/lib/auditLog";
import { rateLimitMiddleware } from "@/lib/rateLimit";
import { s3Config } from "@/lib/s3.server";
import {
  isS3DevotionalKey,
  newDevotionalKey,
  uploadDevotionalPdf,
} from "@/lib/devotionalFiles.server";

/**
 * POST /api/devotionals/upload — admin only.
 *
 * Stores a devotional PDF in S3 (nlwc-ikorodu/Daily_Devotionals/, public
 * read) and returns { url, publicId }, where publicId is the S3 key (saved as
 * the devotional's storagePath). Devotional PDFs used to go to Cloudinary;
 * scripts/migrate-devotionals-to-s3.mts moved the existing ones.
 *
 * Form fields: file (PDF); title (names a new file); publicId (replace: the
 * devotional's current storagePath; an S3 key is overwritten in place, an old
 * Cloudinary id gets a new S3 key).
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuthActor(request);
  if (auth.response) return auth.response;

  const rateLimitError = await rateLimitMiddleware(request, "authenticated");
  if (rateLimitError) return rateLimitError;

  const config = s3Config();
  if (!config) {
    return NextResponse.json(
      { error: "S3 credentials not configured" },
      { status: 500 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const isPdf =
      file.type === "application/pdf" || /\.pdf$/i.test(file.name || "");
    if (!isPdf) {
      return NextResponse.json(
        { error: "Devotionals must be PDF files" },
        { status: 400 },
      );
    }

    const existing = (formData.get("publicId") as string | null) || "";
    const title = (formData.get("title") as string | null) || "";
    const key = isS3DevotionalKey(existing)
      ? existing
      : newDevotionalKey(title || file.name || "devotional");

    const body = Buffer.from(await file.arrayBuffer());
    const url = await uploadDevotionalPdf(config, key, body);

    void recordAudit({
      actor: auth.actor,
      action: "upload",
      resource: "media",
      target: url,
      targetId: key,
      detail: { context: "devotional", storage: "s3" },
      request,
    });

    return NextResponse.json({ url, publicId: key });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Devotional upload failed:", error);
    return NextResponse.json(
      { error: "Upload failed: " + message },
      { status: 500 },
    );
  }
}

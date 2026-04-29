import { NextResponse, NextRequest } from "next/server";
import crypto from "crypto";
import { requireAuth } from "@/lib/auth";
import { rateLimitMiddleware } from "@/lib/rateLimit";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

export async function POST(request: NextRequest) {
  // Verify authentication
  const authError = requireAuth(request);
  if (authError) {
    return authError;
  }

  // Apply rate limiting
  const rateLimitError = rateLimitMiddleware(request, "authenticated");
  if (rateLimitError) {
    return rateLimitError;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const publicId = formData.get("publicId") as string | undefined;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
      return NextResponse.json(
        { error: "Cloudinary credentials not configured" },
        { status: 500 },
      );
    }

    const timestamp = Math.round(new Date().getTime() / 1000).toString();
    const title = formData.get("title") as string | undefined;

    // Create a sanitized filename from title if no publicId is provided
    let finalPublicId = publicId;
    if (!finalPublicId && title) {
      finalPublicId = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, "") // Remove non-alphanumeric except spaces/hyphens
        .replace(/[\s_-]+/g, "-") // Replace spaces/underscores with hyphens
        .trim();

      // Add a small random suffix to prevent exact duplicate collisions if titles are generic
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      finalPublicId = `${finalPublicId}-${randomSuffix}`;
    }

    // Cloudinary signature params (alphabetical order)
    let paramsToSign = "";
    if (finalPublicId) {
      paramsToSign = `access_mode=public&folder=devotionals&overwrite=true&public_id=${finalPublicId}&timestamp=${timestamp}${API_SECRET}`;
    } else {
      paramsToSign = `access_mode=public&folder=devotionals&timestamp=${timestamp}${API_SECRET}`;
    }

    const signature = crypto
      .createHash("sha1")
      .update(paramsToSign)
      .digest("hex");

    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append("file", file);
    cloudinaryFormData.append("api_key", API_KEY);
    cloudinaryFormData.append("timestamp", timestamp);
    cloudinaryFormData.append("signature", signature);
    cloudinaryFormData.append("folder", "devotionals");
    cloudinaryFormData.append("access_mode", "public");

    if (finalPublicId) {
      cloudinaryFormData.append("public_id", finalPublicId);
      cloudinaryFormData.append("overwrite", "true");
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: cloudinaryFormData,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || "Cloudinary upload failed" },
        { status: response.status },
      );
    }

    return NextResponse.json({
      url: data.secure_url,
      publicId: data.public_id,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Cloudinary upload failed:", error);
    return NextResponse.json(
      { error: "Upload failed: " + message },
      { status: 500 },
    );
  }
}

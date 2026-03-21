import { NextResponse } from "next/server";
import crypto from "crypto";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

export async function DELETE(request: Request) {
  try {
    const { publicId } = await request.json();

    if (!publicId) {
      return NextResponse.json(
        { error: "No publicId provided" },
        { status: 400 },
      );
    }

    if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
      return NextResponse.json(
        { error: "Cloudinary credentials not configured" },
        { status: 500 },
      );
    }

    const timestamp = Math.round(new Date().getTime() / 1000).toString();
    const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
    const signature = crypto
      .createHash("sha1")
      .update(paramsToSign)
      .digest("hex");

    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append("public_id", publicId);
    cloudinaryFormData.append("api_key", API_KEY);
    cloudinaryFormData.append("timestamp", timestamp);
    cloudinaryFormData.append("signature", signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`,
      {
        method: "POST",
        body: cloudinaryFormData,
      },
    );

    const data = await response.json();

    if (!response.ok || data.result !== "ok") {
      return NextResponse.json(
        { error: data.error?.message || "Cloudinary deletion failed" },
        { status: response.status || 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Cloudinary deletion failed:", error);
    return NextResponse.json(
      { error: "Deletion failed: " + message },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import crypto from "crypto";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

export async function POST(request: Request) {
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

    // Cloudinary signature params (alphabetical order)
    let paramsToSign = "";
    if (publicId) {
      paramsToSign = `folder=devotionals&overwrite=true&public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
    } else {
      paramsToSign = `folder=devotionals&timestamp=${timestamp}${API_SECRET}`;
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

    if (publicId) {
      cloudinaryFormData.append("public_id", publicId);
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

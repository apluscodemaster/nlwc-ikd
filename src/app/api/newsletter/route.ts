import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { rateLimitMiddleware } from "@/lib/rateLimit";

const bodySchema = z.object({ email: z.string().trim().max(254).email() });

export async function POST(request: NextRequest) {
  // Public signup form — "strict" (10/min) so the list can't be stuffed
  // automatically. A real person signs up once.
  const limited = await rateLimitMiddleware(request, "strict");
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!bodySchema.safeParse(body).success) {
    return NextResponse.json(
      { error: "Invalid email address" },
      { status: 400 },
    );
  }

  // Here you would typically integrate with Mailchimp, ConvertKit, etc.
  // The address is deliberately not logged: logs are no place for personal data.
  return NextResponse.json({
    success: true,
    message: "Successfully subscribed to newsletter!",
  });
}

import { NextResponse, type NextRequest } from "next/server";
import { rateLimitMiddleware } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  // Public signup form — "strict" (10/min) so the list can't be stuffed
  // automatically. A real person signs up once.
  const limited = rateLimitMiddleware(request, "strict");
  if (limited) return limited;

  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 },
      );
    }

    // Here you would typically integrate with Mailchimp, ConvertKit, etc.
    console.log(`Newsletter signup for: ${email}`);

    return NextResponse.json({
      success: true,
      message: "Successfully subscribed to newsletter!",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to subscribe. Please try again later." },
      { status: 500 },
    );
  }
}

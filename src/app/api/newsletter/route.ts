import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 },
      );
    }

    // Simulate database operation
    await new Promise((resolve) => setTimeout(resolve, 800));

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

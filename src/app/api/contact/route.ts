import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    console.log("Contact form submission received:", body);

    // Here you would typically send an email via Resend, SendGrid, etc.

    return NextResponse.json(
      { message: "Message sent successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error processing contact form:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
}

import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { rateLimitMiddleware } from "@/lib/rateLimit";

// Validation schema for contact form
const contactSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be under 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name contains invalid characters"),
  email: z.string().email("Invalid email address"),
  subject: z
    .string()
    .min(3, "Subject must be at least 3 characters")
    .max(200, "Subject must be under 200 characters"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(5000, "Message must be under 5000 characters"),
});

export async function POST(req: NextRequest) {
  // Apply rate limiting to prevent spam (100 requests per minute per IP)
  const rateLimitError = rateLimitMiddleware(req, "public");
  if (rateLimitError) {
    return rateLimitError;
  }

  try {
    const body = await req.json();

    // Validate input with Zod
    const validation = contactSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const { name, email, subject, message } = validation.data;

    // Log submission (for admin purposes)
    console.log(`📧 Contact form submission from ${name} <${email}>:`, {
      subject,
      messageLength: message.length,
    });

    // TODO: Send email via Nodemailer, SendGrid, Resend, etc.
    // Example:
    // await sendContactEmail({ name, email, subject, message });

    return NextResponse.json(
      {
        success: true,
        message: "Thank you for your message. We will get back to you soon.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error processing contact form:", error);
    return NextResponse.json(
      { error: "Failed to process your message. Please try again later." },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { z } from "zod";

// ──────────────────────────────────────────────
// Validation schema
// ──────────────────────────────────────────────

const testimonySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  location: z.string().min(2, "Location must be at least 2 characters"),
  phone: z.string().min(7, "Phone number must be at least 7 digits"),
  email: z.string().email("Invalid email address"),
  testimony: z
    .string()
    .min(20, "Testimony must be at least 20 characters")
    .max(5000, "Testimony must be under 5000 characters"),
  displayPreference: z.enum(["public", "private"]),
});

// ──────────────────────────────────────────────
// SMTP transporter (one.com webmail)
// ──────────────────────────────────────────────

function createTransporter() {
  const host = process.env.SMTP_HOST || "send.one.com";
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.CHURCH_EMAIL_ADDRESS;

  console.log(`📡 Initializing SMTP transporter: ${host}:${port} (${user})`);

  return nodemailer.createTransport({
    host,
    port,
    secure: true, // SSL
    auth: {
      user,
      pass: process.env.CHURCH_EMAIL_PASSWORD,
    },
    tls: {
      // One.com often has incomplete cert chains
      rejectUnauthorized: false,
    },
  });
}

// ──────────────────────────────────────────────
// Email templates
// ──────────────────────────────────────────────

function buildAdminNotificationEmail(data: z.infer<typeof testimonySchema>) {
  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return {
    subject: `📢 New Testimony Submission from ${data.name}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #f0f0f0;">
        <div style="background: linear-gradient(135deg, #FF7C18 0%, #FF9A47 100%); padding: 32px 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">New Testimony Received</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">${dateStr}</p>
        </div>
        
        <div style="padding: 32px 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; font-weight: 600; color: #666; width: 140px; vertical-align: top;">Name:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; color: #333;">${data.name}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; font-weight: 600; color: #666; vertical-align: top;">Location:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; color: #333;">${data.location}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; font-weight: 600; color: #666; vertical-align: top;">Phone:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; color: #333;">${data.phone}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; font-weight: 600; color: #666; vertical-align: top;">Email:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; color: #333;">
                <a href="mailto:${data.email}" style="color: #FF7C18; text-decoration: none;">${data.email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; font-weight: 600; color: #666; vertical-align: top;">Display:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; color: #333;">
                <span style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; ${
                  data.displayPreference === "public"
                    ? "background: #ecfdf5; color: #059669;"
                    : "background: #fef3c7; color: #d97706;"
                }">${data.displayPreference === "public" ? "Public" : "Private"}</span>
              </td>
            </tr>
          </table>
          
          <div style="margin-top: 24px; padding: 20px; background: #fafafa; border-radius: 12px; border-left: 4px solid #FF7C18;">
            <h3 style="margin: 0 0 12px; color: #333; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Testimony</h3>
            <p style="margin: 0; color: #444; line-height: 1.7; font-size: 15px; white-space: pre-wrap;">${data.testimony}</p>
          </div>
          
          <div style="margin-top: 28px; padding: 16px; background: #fff7ed; border-radius: 12px; text-align: center;">
            <p style="margin: 0; color: #9a3412; font-size: 13px;">
              ⚡ <strong>Action Required:</strong> Log in to the 
              <a href="https://ikorodu.nlwc.church/admin/testimonies" style="color: #FF7C18; text-decoration: underline;">Admin Dashboard</a> 
              to review and verify this testimony.
            </p>
          </div>
        </div>
        
        <div style="padding: 16px 24px; background: #f9fafb; text-align: center; border-top: 1px solid #f0f0f0;">
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">NLWC Ikorodu • Testimony Management System</p>
        </div>
      </div>
    `,
  };
}

function buildAutoReplyEmail(data: z.infer<typeof testimonySchema>) {
  return {
    subject: "Thank You for Sharing Your Testimony — NLWC Ikorodu",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #f0f0f0;">
        <div style="background: linear-gradient(135deg, #FF7C18 0%, #FF9A47 100%); padding: 32px 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Thank You, ${data.name}!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Your testimony has been received</p>
        </div>
        
        <div style="padding: 32px 24px;">
          <p style="color: #444; line-height: 1.7; font-size: 15px; margin: 0 0 16px;">
            Dear ${data.name},
          </p>
          <p style="color: #444; line-height: 1.7; font-size: 15px; margin: 0 0 16px;">
            We are deeply grateful that you shared your testimony with us. Your story of God's faithfulness 
            is a powerful encouragement to the body of Christ!
          </p>
          <p style="color: #444; line-height: 1.7; font-size: 15px; margin: 0 0 16px;">
            Your testimony is currently being reviewed by our Pastors. ${
              data.displayPreference === "public"
                ? "Once verified, it will be displayed on our testimonies page for others to be blessed by your story."
                : "As you requested, your testimony will remain private and will not be displayed publicly."
            }
          </p>
          
          <div style="margin: 28px 0; padding: 20px; background: #fafafa; border-radius: 12px; border-left: 4px solid #FF7C18;">
            <h3 style="margin: 0 0 8px; color: #333; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Your Testimony</h3>
            <p style="margin: 0; color: #666; line-height: 1.6; font-size: 14px; font-style: italic; white-space: pre-wrap;">"${data.testimony}"</p>
          </div>
          
          <p style="color: #444; line-height: 1.7; font-size: 15px; margin: 0;">
            God bless you!<br/>
            <strong style="color: #333;">NLWC Ikorodu</strong>
          </p>
        </div>
        
        <div style="padding: 16px 24px; background: #f9fafb; text-align: center; border-top: 1px solid #f0f0f0;">
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">
            The New & Living Way Church, Ikorodu • 
            <a href="https://ikorodu.nlwc.church" style="color: #FF7C18; text-decoration: none;">ikorodu.nlwc.church</a>
          </p>
        </div>
      </div>
    `,
  };
}

// ──────────────────────────────────────────────
// POST handler
// ──────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate
    const result = testimonySchema.safeParse(body);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message || "Invalid form data" },
        { status: 400 },
      );
    }

    const data = result.data;
    const churchEmail = process.env.CHURCH_EMAIL_ADDRESS;

    // Send emails (don't block the response if SMTP is not configured)
    if (churchEmail && process.env.CHURCH_EMAIL_PASSWORD) {
      const transporter = createTransporter();

      // 1. Notification to church admin
      try {
        const adminEmail = buildAdminNotificationEmail(data);
        await transporter.sendMail({
          from: `"NLWC Ikorodu" <${churchEmail}>`,
          to: churchEmail,
          replyTo: data.email,
          ...adminEmail,
        });
        console.log(
          `✅ Admin notification sent for testimony from ${data.name}`,
        );
      } catch (adminError) {
        console.error("⚠️ Failed to send admin notification:", adminError);
      }

      // 2. Auto-reply acknowledgement to sender
      try {
        const replyEmail = buildAutoReplyEmail(data);
        await transporter.sendMail({
          from: `"NLWC Ikorodu" <${churchEmail}>`,
          to: data.email,
          replyTo: churchEmail,
          ...replyEmail,
        });
        console.log(`✅ Auto-reply sent to ${data.email}`);
      } catch (replyError) {
        console.error(
          `⚠️ Failed to send auto-reply to ${data.email}:`,
          replyError,
        );
      }
    } else {
      console.warn(
        "⚠️ SMTP credentials not configured — skipping email notifications",
      );
    }

    return NextResponse.json(
      { message: "Testimony submitted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error processing testimony submission:", error);
    return NextResponse.json(
      { error: "Failed to submit testimony" },
      { status: 500 },
    );
  }
}

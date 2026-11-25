import { NextResponse, type NextRequest } from "next/server";
import { rateLimitMiddleware } from "@/lib/rateLimit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import nodemailer from "nodemailer";
import { z } from "zod";

// ──────────────────────────────────────────────
// Validation schema
// ──────────────────────────────────────────────

const testimonySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  location: z
    .string()
    .trim()
    .min(2, "Location must be at least 2 characters")
    .max(100),
  phone: z
    .string()
    .trim()
    .min(7, "Phone number must be at least 7 digits")
    .max(30),
  email: z.string().trim().email("Invalid email address").max(254),
  testimony: z
    .string()
    .trim()
    .min(20, "Testimony must be at least 20 characters")
    .max(5000, "Testimony must be under 5000 characters"),
  displayPreference: z.enum(["public", "private"]),
  // null/absent when the bot-check widget never completed.
  turnstileToken: z.string().nullish(),
});

/** Escape user input before it goes into email HTML. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * The name to greet the sender by in the auto-reply — only when it looks like
 * a person's name. The auto-reply goes to whatever address was typed into the
 * form, so anything free-form in it (links, numbers, long text) would let a
 * spammer use the church's mailbox to deliver their message to third parties.
 */
function greetingName(name: string): string {
  return /^[\p{L}][\p{L}\s.'’-]{1,59}$/u.test(name) ? esc(name) : "friend";
}

// ──────────────────────────────────────────────
// SMTP transporter (one.com webmail)
// ──────────────────────────────────────────────

function createTransporter() {
  const host = process.env.SMTP_HOST || "send.one.com";
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.CHURCH_EMAIL_ADDRESS;

  console.info(`📡 Initializing SMTP transporter: ${host}:${port} (${user})`);

  return nodemailer.createTransport({
    host,
    port,
    secure: true, // SSL
    auth: {
      user,
      pass: process.env.CHURCH_EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "development" ? false : true,
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
    subject: `📢 New Testimony Submission from ${data.name.replace(/[\r\n]+/g, " ")}`,
    html: `
      <div style="font-family: 'Jost', 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #f0f0f0;">
        <div style="background: linear-gradient(135deg, #FF7C18 0%, #FF9A47 100%); padding: 32px 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">New Testimony Received</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">${dateStr}</p>
        </div>
        
        <div style="padding: 32px 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; font-weight: 600; color: #666; width: 140px; vertical-align: top;">Name:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; color: #333;">${esc(data.name)}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; font-weight: 600; color: #666; vertical-align: top;">Location:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; color: #333;">${esc(data.location)}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; font-weight: 600; color: #666; vertical-align: top;">Phone:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; color: #333;">${esc(data.phone)}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; font-weight: 600; color: #666; vertical-align: top;">Email:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; color: #333;">
                <a href="mailto:${encodeURIComponent(data.email)}" style="color: #FF7C18; text-decoration: none;">${esc(data.email)}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; font-weight: 600; color: #666; vertical-align: top;">Display:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; color: #333;">
                <span style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; ${
                  data.displayPreference === "public"
                    ? "background: #ecfdf5; color: #059669;"
                    : "background: #fef3c7; color: #333333;"
                }">${data.displayPreference === "public" ? "Public" : "Private"}</span>
              </td>
            </tr>
          </table>
          
          <div style="margin-top: 24px; padding: 20px; background: #fafafa; border-radius: 12px; border-left: 4px solid #FF7C18;">
            <h3 style="margin: 0 0 12px; color: #333; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Testimony</h3>
            <p style="margin: 0; color: #444; line-height: 1.7; font-size: 15px; white-space: pre-wrap;">${esc(data.testimony)}</p>
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
      <div style="font-family: 'Jost', 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #f0f0f0;">
        <div style="background: linear-gradient(135deg, #FF7C18 0%, #FF9A47 100%); padding: 32px 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Thank You, ${greetingName(data.name)}!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Your testimony has been received</p>
        </div>
        
        <div style="padding: 32px 24px;">
          <p style="color: #444; line-height: 1.7; font-size: 15px; margin: 0 0 16px;">
            Dear ${greetingName(data.name)},
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

export async function POST(req: NextRequest) {
  // Public + unauthenticated + sends mail on every accepted submission, so an
  // unthrottled caller could spam the testimony store AND mail-bomb the church
  // inbox (risking the SMTP account being flagged). "strict" (10/min), not
  // "public" (100/min) — nobody submits ten testimonies a minute, and 100
  // emails/min is still an email bomb.
  const limited = await rateLimitMiddleware(req, "strict");
  if (limited) return limited;

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

    // Bot check (Cloudflare Turnstile, same as the contact form; treated as
    // passed while TURNSTILE_SECRET_KEY is unset). It only gates the
    // AUTO-REPLY: that goes to whatever address was typed into the form, so
    // it is the part a spammer could abuse. The church notification only
    // reaches the church's own inbox, so it is sent either way (flagged when
    // unverified) — a widget problem must never hide a real testimony.
    const verified = await verifyTurnstileToken(data.turnstileToken);
    if (!verified) {
      console.warn("⚠️ Testimony bot check failed or missing — no auto-reply");
    }

    const emails: {
      adminNotified: boolean;
      autoReplySent: boolean;
      /** Why the auto-reply wasn't sent, when it wasn't. */
      autoReplySkipped:
        null | "verification" | "smtp-not-configured" | "send-failed";
    } = { adminNotified: false, autoReplySent: false, autoReplySkipped: null };

    const churchEmail = process.env.CHURCH_EMAIL_ADDRESS;

    // Send emails (don't block the response if SMTP is not configured)
    if (churchEmail && process.env.CHURCH_EMAIL_PASSWORD) {
      const transporter = createTransporter();

      // 1. Notification to church admin(s)
      try {
        const adminEmail = buildAdminNotificationEmail(data);
        const notifyEmails = process.env.TESTIMONY_NOTIFY_EMAILS
          ? process.env.TESTIMONY_NOTIFY_EMAILS.split(",")
              .map((e) => e.trim())
              .filter(Boolean)
          : [churchEmail];
        await transporter.sendMail({
          from: `"NLWC Ikorodu" <${churchEmail}>`,
          to: notifyEmails,
          replyTo: data.email,
          ...adminEmail,
          subject: verified
            ? adminEmail.subject
            : `[Bot check not passed] ${adminEmail.subject}`,
        });
        emails.adminNotified = true;
        console.info(
          `✅ Admin notification sent for testimony from ${data.name}`,
        );
      } catch (adminError) {
        console.error("⚠️ Failed to send admin notification:", adminError);
      }

      // 2. Auto-reply acknowledgement to sender — verified submissions only.
      if (!verified) {
        emails.autoReplySkipped = "verification";
      } else {
        try {
          const replyEmail = buildAutoReplyEmail(data);
          await transporter.sendMail({
            from: `"NLWC Ikorodu" <${churchEmail}>`,
            to: data.email,
            replyTo: churchEmail,
            ...replyEmail,
          });
          emails.autoReplySent = true;
          console.info(`✅ Auto-reply sent to ${data.email}`);
        } catch (replyError) {
          emails.autoReplySkipped = "send-failed";
          console.error(
            `⚠️ Failed to send auto-reply to ${data.email}:`,
            replyError,
          );
        }
      }
    } else {
      emails.autoReplySkipped = "smtp-not-configured";
      console.warn(
        "⚠️ SMTP credentials not configured — skipping email notifications",
      );
    }

    return NextResponse.json(
      { message: "Testimony submitted successfully", emails },
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

"use client";

import React, { useState, useEffect } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import PageHeader from "@/components/shared/PageHeader";
import SectionContainer from "@/components/shared/SectionContainer";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Send,
  CheckCircle2,
  Quote,
  Loader2,
  MapPin,
  Phone,
  Mail,
  Eye,
  EyeOff,
  PenLine,
  Sparkles,
  MessageCircleHeart,
} from "lucide-react";
import { toast } from "sonner";
import {
  submitTestimony,
  subscribeToVerifiedTestimonies,
  fetchVerifiedTestimonies,
  type Testimony,
  type DisplayPreference,
} from "@/lib/testimonyService";

// ──────────────────────────────────────────────
// Public Testimony Card (name + body only)
// ──────────────────────────────────────────────

const TESTIMONY_CHAR_LIMIT = 250;

function PublicTestimonyCard({
  testimony,
  index,
}: {
  testimony: Testimony;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = testimony.testimony.length > TESTIMONY_CHAR_LIMIT;
  const displayText = expanded || !isLong
    ? testimony.testimony
    : testimony.testimony.slice(0, TESTIMONY_CHAR_LIMIT).trimEnd() + "…";

  const date = new Date(testimony.createdAt).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="group relative"
    >
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-500">
        {/* Quote icon */}
        <div className="mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Quote className="w-5 h-5 text-primary" />
          </div>
        </div>

        {/* Testimony body */}
        <div className="mb-6">
          <p className="text-gray-700 leading-relaxed text-[15px] whitespace-pre-wrap">
            &ldquo;{displayText}&rdquo;
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded((prev) => !prev)}
              className="mt-2 text-primary text-sm font-semibold hover:underline"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>

        {/* Footer: name + date */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-primary/20">
            {testimony.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">
              {testimony.name}
            </h4>
            <p className="text-xs text-muted-foreground">{date}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────
// Testimony Form
// ──────────────────────────────────────────────

function TestimonyForm() {
  const [formStatus, setFormStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [displayPref, setDisplayPref] = useState<DisplayPreference>("public");
  const [phone, setPhone] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormStatus("loading");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      location: formData.get("location") as string,
      phone: "+" + phone,
      email: formData.get("email") as string,
      testimony: formData.get("testimony") as string,
      displayPreference: displayPref,
    };

    // Client-side validation
    if (
      !data.name?.trim() ||
      !data.location?.trim() ||
      !phone?.trim() ||
      !data.email?.trim() ||
      !data.testimony?.trim()
    ) {
      toast.error("Please fill in all required fields.");
      setFormStatus("idle");
      return;
    }

    if (data.testimony.trim().length < 20) {
      toast.error("Your testimony must be at least 20 characters.");
      setFormStatus("idle");
      return;
    }

    try {
      // 1. Store in Firestore
      const result = await submitTestimony(data);
      if (!result) {
        throw new Error("Failed to save testimony");
      }

      // 2. Send email notifications via API
      const response = await fetch("/api/testimonies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.warn("Testimony email API failed, but testimony was saved to database.");
      }

      setFormStatus("success");
      toast.success("Testimony submitted successfully!");
    } catch {
      setFormStatus("error");
      toast.error("Failed to submit testimony. Please try again.");
      setTimeout(() => setFormStatus("idle"), 3000);
    }
  };

  if (formStatus === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-primary/5 rounded-3xl border border-primary/10 min-h-[400px]"
      >
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
          Testimony Received!
        </h3>
        <p className="text-base sm:text-lg text-muted-foreground mb-2 max-w-md">
          Thank you for sharing your testimony. We&apos;ve received it.
        </p>
        <p className="text-sm text-muted-foreground mb-8 max-w-md">
          Your testimony will be reviewed by our Pastors and, if approved,
          displayed publicly for others to be blessed.
        </p>
        <Button
          onClick={() => setFormStatus("idle")}
          className="rounded-full px-8 h-12 cursor-pointer"
        >
          Share Another Testimony
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="bg-white p-5 xs:p-8 md:p-12 rounded-3xl shadow-xl shadow-gray-100 border border-gray-100">
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <PenLine className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-gray-900">
            Share Your Testimony
          </h3>
        </div>
        <p className="text-muted-foreground font-medium text-sm md:text-base">
          Tell us what God has done for you. Fields marked * are required.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
        {/* Name + Location */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-5">
          <div className="space-y-2">
            <label
              htmlFor="testimony-name"
              className="text-xs md:text-sm font-bold text-gray-700"
            >
              Full Name *
            </label>
            <input
              name="name"
              required
              type="text"
              id="testimony-name"
              placeholder="John Abiodun"
              className="w-full h-12 md:h-14 px-4 md:px-6 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm md:text-base"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="testimony-location"
              className="text-xs md:text-sm font-bold text-gray-700 flex items-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5 text-gray-400" /> Location *
            </label>
            <input
              name="location"
              required
              type="text"
              id="testimony-location"
              placeholder="Ikorodu, Lagos"
              className="w-full h-12 md:h-14 px-4 md:px-6 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm md:text-base"
            />
          </div>
        </div>

        {/* Phone + Email */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-5">
          <div className="space-y-2">
            <label
              htmlFor="testimony-phone"
              className="text-xs md:text-sm font-bold text-gray-700 flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5 text-gray-400" /> Phone Number *
            </label>
            <PhoneInput
              country="ng"
              value={phone}
              onChange={(value) => setPhone(value)}
              inputProps={{
                id: "testimony-phone",
                required: true,
              }}
              enableSearch
              searchPlaceholder="Search country..."
              containerClass="!w-full"
              inputClass="!w-full !h-12 md:!h-14 !px-4 md:!px-6 !pl-[48px] md:!pl-[56px] !rounded-2xl !border !border-gray-200 focus:!border-primary focus:!ring-[2px] focus:!ring-primary/20 !outline-none !transition-all !font-medium !text-sm md:!text-base !bg-white"
              buttonClass="!bg-transparent !border-0 !rounded-l-2xl hover:!bg-transparent focus:!bg-transparent !pl-1 md:!pl-2"
              dropdownClass="!rounded-2xl !shadow-xl !border-gray-100 !mt-1"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="testimony-email"
              className="text-xs md:text-sm font-bold text-gray-700 flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5 text-gray-400" /> Email Address *
            </label>
            <input
              name="email"
              required
              type="email"
              id="testimony-email"
              placeholder="john@example.com"
              className="w-full h-12 md:h-14 px-4 md:px-6 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm md:text-base"
            />
          </div>
        </div>

        {/* Testimony body */}
        <div className="space-y-2">
          <label
            htmlFor="testimony-body"
            className="text-xs md:text-sm font-bold text-gray-700"
          >
            Your Testimony *
          </label>
          <textarea
            required
            name="testimony"
            id="testimony-body"
            rows={6}
            minLength={20}
            maxLength={5000}
            placeholder="Share what God has done for you..."
            className="w-full p-4 md:p-6 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium resize-none text-sm md:text-base"
          />
        </div>

        {/* Display preference toggle */}
        <div className="p-4 md:p-5 rounded-2xl bg-gray-50 border border-gray-100">
          <label className="text-xs md:text-sm font-bold text-gray-700 block mb-3">
            Display Preference
          </label>
          <div className="flex flex-col xs:flex-row gap-3">
            <button
              type="button"
              onClick={() => setDisplayPref("public")}
              className={`flex-1 flex items-center gap-3 p-3 md:p-4 rounded-xl border-2 transition-all cursor-pointer ${
                displayPref === "public"
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  displayPref === "public"
                    ? "bg-primary/15 text-primary"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                <Eye className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p
                  className={`text-sm font-bold ${displayPref === "public" ? "text-primary" : "text-gray-700"}`}
                >
                  Public
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Share with the community
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDisplayPref("private")}
              className={`flex-1 flex items-center gap-3 p-3 md:p-4 rounded-xl border-2 transition-all cursor-pointer ${
                displayPref === "private"
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  displayPref === "private"
                    ? "bg-primary/15 text-primary"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                <EyeOff className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p
                  className={`text-sm font-bold ${displayPref === "private" ? "text-primary" : "text-gray-700"}`}
                >
                  Private
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Only shared with church admin
                </p>
              </div>
            </button>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={formStatus === "loading"}
          className="w-full h-12 sm:h-14 md:h-16 rounded-full text-sm sm:text-base md:text-lg font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all cursor-pointer"
        >
          {formStatus === "loading" ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Submit Testimony <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
          )}
        </Button>
      </form>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────

const TESTIMONIES_PER_PAGE = 9;

export default function TestimoniesPage() {
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(TESTIMONIES_PER_PAGE);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;

    // Attempt a one-time fetch first (fails fast on permission errors).
    // Then subscribe to real-time updates if successful.
    const init = async () => {
      try {
        const data = await fetchVerifiedTestimonies();
        if (!cancelled) {
          setTestimonies(data);
          setLoading(false);

          // Subscribe to real-time updates
          unsubscribe = subscribeToVerifiedTestimonies((liveData) => {
            if (!cancelled) setTestimonies(liveData);
          });
        }
      } catch {
        // Permission error or missing index — show empty state
        if (!cancelled) setLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return (
    <main>
      <PageHeader
        title="Testimonies"
        subtitle="Share what God has done and be inspired by the testimonies of others in the NLWC Ikorodu family."
        backgroundImage="https://res.cloudinary.com/dj7rh8h6r/image/upload/v1776643342/testimony_yrcuxa.jpg"
      />

      {/* ─── Share Section ─── */}
      <SectionContainer id="share" containerClassName="max-w-7xl">
        <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-10 md:gap-16 items-start">
          {/* Left column — description */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            suppressHydrationWarning
          >
            <div className="space-y-3 md:space-y-4 mb-8 md:mb-10 text-center lg:text-left">
              <h4 className="text-primary font-bold uppercase tracking-widest text-[10px] md:text-sm">
                — SHARE YOUR STORY
              </h4>
              <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-[1.1]">
                What Has God <br className="hidden xs:block" />
                <span className="text-primary">Done For You?</span>
              </h2>
              <p className="text-sm md:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
                We love to hear how God is moving in your life. Your testimony
                is a seed of faith that inspires others and glorifies the name
                of the Lord.
              </p>
            </div>

            {/* Encouragement cards */}
            <div className="space-y-3 hidden lg:block">
              {[
                {
                  icon: Sparkles,
                  title: "Your Story Matters",
                  text: "Every testimony is a reminder of God's faithfulness and a weapon in the spirit.",
                },
                {
                  icon: MessageCircleHeart,
                  title: "Inspire Others",
                  text: "Your experience can be the encouragement someone needs to hold on to faith.",
                },
                {
                  icon: CheckCircle2,
                  title: "Reviewed & Published",
                  text: "Submitted testimonies are reviewed by our Pastors before being displayed publicly.",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  suppressHydrationWarning
                  className="group flex items-center gap-4 p-4 md:p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                    <item.icon className="w-5 h-5 text-gray-500 group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1 opacity-70">
                      {item.title}
                    </h3>
                    <p className="text-sm font-bold text-gray-900 leading-snug">
                      {item.text}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right column — form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:mt-0"
            suppressHydrationWarning
          >
            <div className="lg:hidden mb-8 h-px bg-gray-100 w-1/2 mx-auto" />
            <TestimonyForm />
          </motion.div>
        </div>
      </SectionContainer>

      {/* ─── View Section ─── */}
      <SectionContainer
        id="view"
        className="bg-gray-50 border-t border-gray-100"
        containerClassName="max-w-7xl"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10 md:mb-16"
          suppressHydrationWarning
        >
          <h4 className="text-primary font-bold uppercase tracking-widest text-[10px] md:text-sm mb-3">
            — TESTIMONIES
          </h4>
          <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-[1.1] mb-4">
            Stories of{" "}
            <span className="text-primary">God&apos;s Faithfulness</span>
          </h2>
          <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Be inspired by the testimonies of members in our community. God is
            still in the business of doing great things!
          </p>
        </motion.div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-muted-foreground text-sm">
              Loading testimonies...
            </p>
          </div>
        ) : testimonies.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <MessageCircleHeart className="w-10 h-10 text-primary/40" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              No Testimonies Yet
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
              Be the first to share what God has done in your life. Your
              testimony could be the blessing someone needs today.
            </p>
            <a
              href="#share"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              <PenLine className="w-4 h-4" /> Share Your Testimony
            </a>
          </motion.div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              {testimonies.slice(0, visibleCount).map((t, i) => (
                <PublicTestimonyCard key={t.id} testimony={t} index={i} />
              ))}
            </div>
            {visibleCount < testimonies.length && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={() => setVisibleCount((prev) => prev + TESTIMONIES_PER_PAGE)}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </SectionContainer>
    </main>
  );
}

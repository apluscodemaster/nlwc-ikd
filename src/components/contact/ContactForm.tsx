"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ContactForm() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");

    // Simulate API call
    setTimeout(() => {
      setStatus("success");
    }, 2000);
  };

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="h-full flex flex-col items-center justify-center text-center p-6 xs:p-8 bg-primary/5 rounded-3xl border border-primary/10"
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
          Message Sent!
        </h3>
        <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-sm">
          Thank you for reaching out. The church Admin will get back to you
          shortly.
        </p>
        <Button
          onClick={() => setStatus("idle")}
          className="rounded-full px-8 h-12"
        >
          Send Another Message
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="bg-white p-5 xs:p-8 md:p-12 rounded-3xl shadow-xl shadow-gray-100 border border-gray-100">
      <div className="mb-6 md:mb-8 font-bold">
        <h3 className="text-xl md:text-2xl text-gray-900">Send us a message</h3>
        <p className="text-muted-foreground font-medium mt-2 text-sm md:text-base">
          Required fields are marked *
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-xs md:text-sm font-bold text-gray-700"
            >
              Full Name *
            </label>
            <input
              required
              type="text"
              id="name"
              placeholder="John Abiodun"
              className="w-full h-12 md:h-14 px-4 md:px-6 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm md:text-base"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-xs md:text-sm font-bold text-gray-700"
            >
              Email Address *
            </label>
            <input
              required
              type="email"
              id="email"
              placeholder="john@example.com"
              className="w-full h-12 md:h-14 px-4 md:px-6 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm md:text-base"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="subject"
            className="text-xs md:text-sm font-bold text-gray-700"
          >
            Subject *
          </label>
          <div className="relative">
            <select
              required
              id="subject"
              className="w-full h-12 md:h-14 px-4 md:px-6 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium appearance-none bg-white text-sm md:text-base pr-10"
            >
              <option value="" selected disabled>
                Select a subject
              </option>
              <option value="general">General Inquiry</option>
              <option value="prayer">Prayer Request</option>
              <option value="testimony">Testimony</option>
              <option value="ministry">Join a House Fellowship</option>
              <option value="counseling">Counseling</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="message"
            className="text-xs md:text-sm font-bold text-gray-700"
          >
            Message *
          </label>
          <textarea
            required
            id="message"
            rows={5}
            placeholder="How can we help you today?"
            className="w-full p-4 md:p-6 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium resize-none text-sm md:text-base"
          ></textarea>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={status === "loading"}
          className="w-full h-12 sm:h-14 md:h-16 rounded-full text-sm sm:text-base md:text-lg font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
        >
          {status === "loading" ? (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Sending...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Send Message <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
          )}
        </Button>
      </form>
    </div>
  );
}

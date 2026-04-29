"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function ContactForm() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  // Real-time validation
  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case "name":
        if (!value) return "Name is required";
        if (value.length < 2) return "Name must be at least 2 characters";
        if (value.length > 100) return "Name must be under 100 characters";
        if (!/^[a-zA-Z\s'-]+$/.test(value))
          return "Name contains invalid characters";
        return undefined;

      case "email":
        if (!value) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          return "Invalid email address";
        return undefined;

      case "subject":
        if (!value) return "Subject is required";
        return undefined;

      case "message":
        if (!value) return "Message is required";
        if (value.length < 10) return "Message must be at least 10 characters";
        if (value.length > 5000) return "Message must be under 5000 characters";
        return undefined;

      default:
        return undefined;
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Real-time validation
    const error = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: FormErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof FormData]);
      if (error) newErrors[key as keyof FormErrors] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      // Send to API
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
      setErrors({});

      // Auto-dismiss success after 5 seconds
      setTimeout(() => {
        setStatus("idle");
      }, 5000);
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to send message. Please try again."
      );
    }
  };

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="h-full flex flex-col items-center justify-center text-center p-6 xs:p-8 bg-green-50 rounded-3xl border border-green-200"
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Message Sent!
        </h3>
        <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-sm">
          Thank you for reaching out. We will get back to you as soon as possible.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="bg-white p-5 xs:p-8 md:p-12 rounded-3xl shadow-xl shadow-gray-100 border border-gray-100">
      <div className="mb-6 md:mb-8 font-bold">
        <h3 className="text-xl md:text-2xl text-gray-900">Send us a message</h3>
        <p className="text-muted-foreground font-medium mt-2 text-sm md:text-base">
          Required fields are marked <span className="text-red-500">*</span>
        </p>
      </div>

      {/* Error Alert */}
      {status === "error" && errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-900">Error</p>
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-xs md:text-sm font-bold text-gray-700"
            >
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              type="text"
              id="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Abiodun"
              className={`w-full h-12 md:h-14 px-4 md:px-6 rounded-2xl border-2 transition-all font-medium text-sm md:text-base outline-none ${
                errors.name
                  ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                  : "border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
              }`}
            />
            {errors.name && (
              <p className="text-xs text-red-600 font-medium">{errors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-xs md:text-sm font-bold text-gray-700"
            >
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              name="email"
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              className={`w-full h-12 md:h-14 px-4 md:px-6 rounded-2xl border-2 transition-all font-medium text-sm md:text-base outline-none ${
                errors.email
                  ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                  : "border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
              }`}
            />
            {errors.email && (
              <p className="text-xs text-red-600 font-medium">{errors.email}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="subject"
            className="text-xs md:text-sm font-bold text-gray-700"
          >
            Subject <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className={`w-full h-12 md:h-14 px-4 md:px-6 rounded-2xl border-2 transition-all font-medium appearance-none bg-white text-sm md:text-base pr-10 outline-none ${
                errors.subject
                  ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                  : "border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
              }`}
            >
              <option value="">Select a subject</option>
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
          {errors.subject && (
            <p className="text-xs text-red-600 font-medium">{errors.subject}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="message"
            className="text-xs md:text-sm font-bold text-gray-700"
          >
            Message <span className="text-red-500">*</span>
            {formData.message && (
              <span className="text-xs text-gray-500 float-right">
                {formData.message.length}/5000
              </span>
            )}
          </label>
          <textarea
            name="message"
            id="message"
            rows={5}
            value={formData.message}
            onChange={handleChange}
            placeholder="How can we help you today?"
            className={`w-full p-4 md:p-6 rounded-2xl border-2 transition-all font-medium resize-none text-sm md:text-base outline-none ${
              errors.message
                ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                : "border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
            }`}
          ></textarea>
          {errors.message && (
            <p className="text-xs text-red-600 font-medium">{errors.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={status === "loading" || Object.keys(errors).length > 0}
          size="lg"
          className="w-full h-12 sm:h-14 md:h-16 rounded-full text-sm sm:text-base md:text-lg font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "loading" ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
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

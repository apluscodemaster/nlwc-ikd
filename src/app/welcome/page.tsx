"use client";

import React, { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import SectionContainer from "@/components/shared/SectionContainer";
import { motion } from "framer-motion";
import {
  Send,
  User,
  Mail,
  Phone,
  MapPin,
  Heart,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export default function WelcomePage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <main className="bg-gray-50/30 min-h-screen">
        <PageHeader
          title="Welcome Home!"
          subtitle="We are so glad you joined us today."
          backgroundImage="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop"
        />
        <SectionContainer>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto p-12 rounded-[40px] bg-white shadow-2xl shadow-primary/5 border border-gray-100 text-center space-y-8"
          >
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              Details Received!
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Thank you for sharing your details with us. Someone from our
              welcome team will reach out to you shortly. We hope you enjoy the
              rest of our service!
            </p>
            <div className="pt-6">
              <button
                onClick={() => window.history.back()}
                className="h-14 px-10 rounded-full bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Back to Stream
              </button>
            </div>
          </motion.div>
        </SectionContainer>
      </main>
    );
  }

  return (
    <main className="bg-gray-50/30 min-h-screen">
      <PageHeader
        title="First Time Here?"
        subtitle="You are a special guest and we would love to know you better."
        backgroundImage="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop"
      />

      <SectionContainer>
        <div className="max-w-5xl mx-auto grid lg:grid-cols-[1fr_550px] gap-12 lg:gap-20 items-start">
          {/* Welcome Message Column */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" />
                You are welcome
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
                We are <span className="text-primary italic">honored</span> to
                have you join us.
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                At New and Living Way Church, we believe there are no accidents
                in the kingdom of God. Your presence today is a blessing to us,
                and we want to ensure you feel right at home.
              </p>
            </div>

            <div className="space-y-6">
              {[
                {
                  icon: <Heart className="w-5 h-5" />,
                  title: "Personal Connection",
                  desc: "We'd love to pray for you and support your spiritual journey.",
                },
                {
                  icon: <CheckCircle2 className="w-5 h-5" />,
                  title: "Stay Informed",
                  desc: "Get updates about upcoming events and special programs.",
                },
              ].map((benefit, i) => (
                <div
                  key={i}
                  className="flex gap-4 p-6 rounded-3xl bg-white border border-gray-100 shadow-sm"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                    {benefit.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{benefit.title}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {benefit.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Form Column */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-primary/5 rounded-[48px] transform rotate-2 blur-2xl" />
            <div className="relative p-8 sm:p-12 rounded-[48px] bg-white border border-gray-100 shadow-2xl shadow-gray-200/50">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                      <User className="w-4 h-4 text-primary/60" /> Full Name
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="John Doe"
                      className="w-full h-14 px-6 rounded-2xl border border-gray-100 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-primary/60" /> Phone Number
                    </label>
                    <input
                      required
                      type="tel"
                      placeholder="+234 ..."
                      className="w-full h-14 px-6 rounded-2xl border border-gray-100 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary/60" /> Email Address
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="john@example.com"
                    className="w-full h-14 px-6 rounded-2xl border border-gray-100 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary/60" /> Residential
                    Address
                  </label>
                  <textarea
                    required
                    placeholder="Where are you joining us from?"
                    rows={3}
                    className="w-full p-6 rounded-2xl border border-gray-100 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium resize-none"
                  />
                </div>

                <div className="pt-4">
                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full h-16 rounded-2xl bg-primary text-white font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Submit My Details
                      </>
                    )}
                  </button>
                </div>

                <p className="text-center text-xs text-gray-400 font-medium px-4">
                  By submitting this form, you agree to allow our welcome team
                  to contact you. Your privacy is important to us.
                </p>
              </form>
            </div>
          </motion.div>
        </div>
      </SectionContainer>
    </main>
  );
}

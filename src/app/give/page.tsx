"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Heart,
  Copy,
  Check,
  CreditCard,
  Building2,
  User,
  Info,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const BANK_DETAILS = {
  accountName: "Life in the Spirit Ministry Ikorodu.",
  bankName: "ZENITH BANK",
  accountNumber: "1014942555",
};

export default function GivePage() {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Account number copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy account number");
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Heart className="w-4 h-4 fill-primary" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Support Our Mission
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
              Honour God with <br />
              <span className="text-primary">Your Giving</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              &quot;Honour the Lord with thy substance, and with the firstfruits
              of all thine increase: So shall thy barns be filled with plenty,
              and thy presses shall burst out with new wine.&quot;
              <span className="block mt-2 font-bold text-foreground">
                — Proverbs 3:9-10
              </span>
            </p>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start max-w-6xl mx-auto">
          {/* Bank Transfer Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="border-none shadow-2xl shadow-primary/10 overflow-hidden bg-white/80 backdrop-blur-sm">
              <div className="h-2 bg-primary w-full" />
              <CardHeader className="pt-8 px-8">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl font-bold mb-2">
                      Bank Transfer
                    </CardTitle>
                    <CardDescription className="text-md">
                      Transfer directly to the church account
                    </CardDescription>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10">
                    <Building2 className="w-8 h-8 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-10 space-y-6">
                {/* Zenith Bank Logo & Name */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="relative w-12 h-12 rounded-xl bg-white p-1 overflow-hidden shadow-sm flex items-center justify-center border border-gray-200">
                    <Image
                      src="/Zenith-Bank-logo.png"
                      alt="Zenith Bank Logo"
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Bank Name
                    </p>
                    <p className="font-black text-xl text-foreground">
                      {BANK_DETAILS.bankName}
                    </p>
                  </div>
                </div>

                {/* Account Number Section */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative p-6 rounded-2xl border-2 border-primary/20 bg-primary/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                      <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">
                        Account Number
                      </p>
                      <p className="text-4xl sm:text-5xl font-black tracking-wider text-primary tabular-nums">
                        {BANK_DETAILS.accountNumber}
                      </p>
                    </div>
                    <Button
                      onClick={() =>
                        copyToClipboard(BANK_DETAILS.accountNumber)
                      }
                      size="lg"
                      className={cn(
                        "rounded-xl px-6 h-14 font-bold transition-all shrink-0 w-full sm:w-auto",
                        copied
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-primary hover:bg-primary/90",
                      )}
                    >
                      {copied ? (
                        <>
                          <Check className="w-5 h-5 mr-2" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5 mr-2" />
                          Copy Account
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Account Name Section */}
                <div className="flex items-start gap-4 p-5 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="mt-1">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Account Name
                    </p>
                    <p className="font-bold text-lg text-foreground">
                      {BANK_DETAILS.accountName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 px-2">
                  <Info className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground italic">
                    Please include the purpose of your gift (e.g. Tithe,
                    Offering) in the transaction description.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Side Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-8 lg:pt-8"
          >
            <div>
              <h2 className="text-3xl font-black mb-4">Why We Give</h2>
              <div className="w-20 h-2 bg-primary rounded-full mb-8" />
              <div className="space-y-6">
                {[
                  {
                    title: "Eternal Impact",
                    desc: "Your giving fuels the ministry, helping us spread the message of Eternal Life to many.",
                  },
                  {
                    title: "Kingdom Support",
                    desc: "Supporting the church allows us to maintain the sanctuary and support the needs of the body.",
                  },
                  {
                    title: "A Heart of Worship",
                    desc: "Giving is a primary way we express our gratitude and reliance on God's provision.",
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{item.title}</h3>
                      <p className="text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Card className="border-none bg-black text-white p-8 rounded-[32px] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                <Heart className="w-24 h-24 rotate-12" />
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-black mb-4">Have Questions?</h3>
                <p className="text-gray-400 mb-8 leading-relaxed">
                  If you need assistance with your donation or have questions
                  about how funds are used, please reach out to our
                  administration.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-full border-white/20 hover:bg-white/10 text-black hover:text-white h-12 px-6"
                  >
                    <a href="mailto:ikoroduchurchadmin@nlwc.church">
                      Contact Admin
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    className="rounded-full text-white hover:bg-white/5 h-12 px-6 group"
                    asChild
                  >
                    <a href="/contact" className="flex items-center gap-2">
                      Visit Contact Page
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </Button>
                </div>
              </div>
            </Card>

            <div className="p-6 rounded-2xl border border-dashed border-muted-foreground/30 flex items-center justify-center text-center">
              <p className="text-sm text-muted-foreground">
                All donations are securely processed and used directly for
                ministry operations.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Bottom Decorative Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="mt-20 pt-20 border-t border-gray-100 text-center"
        >
          <div className="flex justify-center gap-4 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-primary" />
            ))}
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto italic">
            &quot;Every man according as he purposeth in his heart, so let him
            give; not grudgingly, or of necessity: for God loveth a cheerful
            giver.&quot;
          </p>
          <p className="font-bold mt-2">— 2 Corinthians 9:7</p>
        </motion.div>
      </div>
    </div>
  );
}

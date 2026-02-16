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

interface GivingOption {
  id: string;
  title: string;
  description: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  logo: string;
  accentColor: "primary" | "blue";
  note?: string;
}

const GIVING_OPTIONS: GivingOption[] = [
  {
    id: "general",
    title: "Tithes & Offerings",
    description: "General support for church operations",
    accountName: "Life in the Spirit Ministry Ikorodu.",
    bankName: "ZENITH BANK",
    accountNumber: "1014942555",
    logo: "/Zenith-Bank-logo.png",
    accentColor: "primary",
    note: "Please include the purpose (e.g. Tithe, Offering, SOTS) in the description.",
  },
  {
    id: "project",
    title: "Church Project 🌱",
    description: "Sow a seed towards the ongoing church building project",
    accountName: "Life in the Spirit Ministry IKD-PRJT",
    bankName: "ZENITH BANK",
    accountNumber: "1227683067",
    logo: "/Zenith-Bank-logo.png",
    accentColor: "primary",
  },
  {
    id: "welfare",
    title: "Welfare Offering",
    description: "Supporting those in need within our community",
    accountName: "Olusegun Adefolu Adeeko",
    bankName: "Polaris Bank",
    accountNumber: "3011163846",
    logo: "/Polaris-Bank-logo.png",
    accentColor: "blue",
    note: "Please kindly indicate 'Welfare' when making the transfer.",
  },
];

function BankCard({
  option,
  copyToClipboard,
  copiedId,
}: {
  option: GivingOption;
  copyToClipboard: (text: string, id: string) => void;
  copiedId: string | null;
}) {
  const isCopied = copiedId === option.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-none shadow-xl shadow-gray-200/50 overflow-hidden bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-500">
        <div
          className={cn(
            "h-1.5 w-full",
            option.accentColor === "primary" ? "bg-primary" : "bg-blue-600",
          )}
        />
        <CardHeader className="pt-6 px-6 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-bold mb-1">
                {option.title}
              </CardTitle>
              <CardDescription className="text-sm">
                {option.description}
              </CardDescription>
            </div>
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center border",
                option.accentColor === "primary"
                  ? "bg-primary/5 border-primary/10 text-primary"
                  : "bg-blue-50 border-blue-100 text-blue-600",
              )}
            >
              <Building2 className="w-6 h-6" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-8 space-y-4">
          {/* Bank Info */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div className="relative w-10 h-10 rounded-lg bg-white p-1 overflow-hidden shadow-sm flex items-center justify-center border border-gray-200 shrink-0">
              <Image
                src={option.logo}
                alt={`${option.bankName} Logo`}
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">
                Bank Name
              </p>
              <p className="font-black text-lg text-foreground leading-none">
                {option.bankName}
              </p>
            </div>
          </div>

          {/* Account Number */}
          <div className="relative p-5 rounded-xl border-2 border-gray-100 bg-white flex items-center justify-between gap-4 group hover:border-primary/30 transition-colors">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                Account Number
              </p>
              <p className="text-2xl sm:text-3xl font-black tracking-wider text-foreground tabular-nums leading-none">
                {option.accountNumber}
              </p>
            </div>
            <Button
              onClick={() => copyToClipboard(option.accountNumber, option.id)}
              size="default"
              variant={isCopied ? "default" : "outline"}
              className={cn(
                "rounded-xl px-4 h-11 font-bold transition-all shrink-0",
                isCopied
                  ? "bg-green-500 hover:bg-green-600 border-green-500 text-white"
                  : "border-primary/20 hover:border-primary text-primary hover:bg-primary/5",
              )}
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>

          {/* Account Name */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
            <User className="w-4 h-4 text-muted-foreground mt-1" />
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">
                Account Name
              </p>
              <p className="font-bold text-md text-foreground leading-snug">
                {option.accountName}
              </p>
            </div>
          </div>

          {option.note && (
            <div className="flex items-center gap-2 pt-2 px-1">
              <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground italic leading-tight">
                {option.note}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function GivePage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success("Account number copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast.error("Failed to copy account number");
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-linear-to-b from-primary/5 via-background to-background">
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
                Giving Options
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

        <div className="grid lg:grid-cols-12 gap-12 items-start max-w-6xl mx-auto">
          {/* Bank Transfer Cards */}
          <div className="lg:col-span-7 space-y-6">
            {GIVING_OPTIONS.map((option) => (
              <BankCard
                key={option.id}
                option={option}
                copyToClipboard={copyToClipboard}
                copiedId={copiedId}
              />
            ))}
          </div>

          {/* Side Content */}
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-8"
            >
              <div className="p-8 rounded-[32px] bg-white border border-gray-100 shadow-sm">
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
                        <h3 className="font-bold text-lg leading-tight mb-1">
                          {item.title}
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {item.desc}
                        </p>
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
                  <p className="text-gray-400 mb-8 leading-relaxed text-sm">
                    If you need assistance with your donation or have questions
                    about how funds are used, please reach out to our
                    administration.
                  </p>
                  <div className="flex flex-col gap-4">
                    <Button
                      asChild
                      variant="outline"
                      className="rounded-full border-white/20 hover:bg-white/10 text-black hover:text-white h-12 px-6 justify-start transition-all"
                    >
                      <a
                        href="mailto:ikoroduchurchadmin@nlwc.church"
                        className="flex items-center gap-3 w-full"
                      >
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                          <ExternalLink className="w-4 h-4" />
                        </div>
                        Contact Admin
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      className="rounded-full text-white hover:bg-white/5 h-12 px-6 group justify-start transition-all px-0"
                      asChild
                    >
                      <a
                        href="/contact"
                        className="flex items-center gap-2 pl-4"
                      >
                        Visit Contact Page
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </a>
                    </Button>
                  </div>
                </div>
              </Card>

              <div className="p-6 rounded-2xl border border-dashed border-muted-foreground/30 text-center bg-gray-50/50">
                <p className="text-xs text-muted-foreground font-medium">
                  All donations are securely processed and used directly for
                  ministry operations.
                </p>
              </div>
            </motion.div>
          </div>
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
          <p className="text-muted-foreground max-w-2xl mx-auto italic text-sm">
            &quot;Every man according as he purposeth in his heart, so let him
            give; not grudgingly, or of necessity: for God loveth a cheerful
            giver.&quot;
          </p>
          <p className="font-bold mt-2 text-sm">— 2 Corinthians 9:7</p>
        </motion.div>
      </div>
    </div>
  );
}

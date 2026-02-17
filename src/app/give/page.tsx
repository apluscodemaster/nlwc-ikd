"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
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
      <Card className="border-none shadow-xl shadow-gray-200/50 overflow-hidden bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 rounded-[24px] sm:rounded-[32px]">
        <div
          className={cn(
            "h-2 w-full",
            option.accentColor === "primary" ? "bg-primary" : "bg-blue-600",
          )}
        />
        <CardHeader className="pt-6 sm:pt-8 px-5 sm:px-8 pb-4">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <CardTitle className="text-xl sm:text-2xl font-black mb-1.5 tracking-tight">
                {option.title}
              </CardTitle>
              <CardDescription className="text-sm sm:text-base font-medium text-gray-500 leading-snug">
                {option.description}
              </CardDescription>
            </div>
            <div
              className={cn(
                "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border shrink-0",
                option.accentColor === "primary"
                  ? "bg-primary/5 border-primary/10 text-primary"
                  : "bg-blue-50 border-blue-100 text-blue-600",
              )}
            >
              <Building2 className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-5 sm:px-8 pb-8 sm:pb-10 space-y-5 sm:space-y-6">
          {/* Bank Info */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
            <div className="relative w-12 h-12 rounded-xl bg-white p-1.5 overflow-hidden shadow-sm flex items-center justify-center border border-gray-200 shrink-0">
              <Image
                src={option.logo}
                alt={`${option.bankName} Logo`}
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none mb-1.5">
                Bank Name
              </p>
              <p className="font-black text-xl text-foreground leading-none">
                {option.bankName}
              </p>
            </div>
          </div>

          {/* Account Number Area */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 p-5 rounded-2xl border-2 border-gray-100 bg-white group hover:border-primary/30 transition-colors">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 leading-none">
                Account Number
              </p>
              <p className="text-2xl sm:text-3xl font-black tracking-wider text-foreground tabular-nums leading-none">
                {option.accountNumber}
              </p>
            </div>

            <Button
              onClick={() => copyToClipboard(option.accountNumber, option.id)}
              size="lg"
              variant={isCopied ? "default" : "outline"}
              className={cn(
                "rounded-2xl px-8 h-12 sm:h-auto font-black transition-all text-sm shrink-0",
                isCopied
                  ? "bg-green-500 hover:bg-green-600 border-green-500 text-white"
                  : "border-primary/20 hover:border-primary text-primary hover:bg-primary/5 shadow-sm",
              )}
            >
              <AnimatePresence mode="wait">
                {isCopied ? (
                  <motion.div
                    key="copied"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    COPIED
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2"
                  >
                    <Copy className="w-5 h-5" />
                    COPY
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>

          {/* Account Name */}
          <div className="flex items-start gap-4 p-5 rounded-2xl bg-gray-50/50 border border-gray-100">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-gray-100">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none mb-1.5">
                Account Name
              </p>
              <p className="font-bold text-lg text-foreground leading-snug">
                {option.accountName}
              </p>
            </div>
          </div>

          {option.note && (
            <div className="flex items-start gap-3 pt-2 px-1">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground font-medium leading-relaxed italic">
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
    <div className="min-h-screen pt-24 pb-20 bg-linear-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center max-w-4xl mx-auto mb-16 sm:mb-24 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary mb-8 shadow-sm">
              <Heart className="w-4 h-4 fill-primary animate-pulse" />
              <span className="text-xs font-black uppercase tracking-[0.2em]">
                Giving Options
              </span>
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black mb-8 tracking-tighter leading-none">
              Honour God with <br />
              <span className="text-primary">Your Giving</span>
            </h1>
            <div className="relative p-6 sm:p-10 rounded-[32px] bg-white border border-gray-100 shadow-2xl shadow-gray-200/50 mb-4 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
              <p className="text-lg sm:text-2xl text-gray-600 leading-relaxed font-medium italic">
                &quot;Honour the Lord with thy substance, and with the
                firstfruits of all thine increase: So shall thy barns be filled
                with plenty, and thy presses shall burst out with new
                wine.&quot;
              </p>
              <div className="mt-6 flex flex-col items-center gap-2">
                <div className="w-12 h-1 bg-primary/20 rounded-full" />
                <span className="font-black text-gray-900 tracking-widest uppercase text-sm">
                  — Proverbs 3:9-10
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start max-w-6xl mx-auto">
          {/* Bank Transfer Cards */}
          <div className="lg:col-span-12 xl:col-span-7 space-y-8 sm:space-y-10 order-2 xl:order-1">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white text-base">
                1
              </span>
              Local Bank Transfers
            </h2>
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
          <div className="lg:col-span-12 xl:col-span-5 order-1 xl:order-2 xl:sticky xl:top-28">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-8"
            >
              <div className="p-8 sm:p-10 rounded-[32px] bg-white border border-gray-100 shadow-xl shadow-gray-200/50 relative overflow-hidden group">
                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-gray-50 rounded-full group-hover:scale-110 transition-transform duration-700" />
                <div className="relative z-10">
                  <h2 className="text-3xl font-black mb-6 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white text-base">
                      2
                    </span>
                    Why We Give
                  </h2>
                  <div className="space-y-8">
                    {[
                      {
                        title: "Eternal Impact",
                        desc: "Your giving fuels the ministry, helping us spread the message of Eternal Life to many across the world.",
                      },
                      {
                        title: "Kingdom Support",
                        desc: "Supporting the church allows us to maintain the sanctuary and support the physical needs of the body.",
                      },
                      {
                        title: "A Heart of Worship",
                        desc: "Giving is a primary way we express our deep gratitude and total reliance on God's provision.",
                      },
                    ].map((item, idx) => (
                      <div key={idx} className="flex gap-5">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                          <Check className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-black text-lg leading-tight mb-2">
                            {item.title}
                          </h3>
                          <p className="text-gray-500 text-sm sm:text-base leading-relaxed font-medium">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Card className="border-none bg-black text-white p-8 sm:p-10 rounded-[32px] relative overflow-hidden group shadow-2xl shadow-black/20">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
                  <CreditCard className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-3xl font-black mb-4">Need Help?</h3>
                  <p className="text-gray-400 mb-10 leading-relaxed font-medium">
                    If you need assistance with your donation or have questions
                    about our financial stewardship, we are here to help.
                  </p>
                  <div className="flex flex-col sm:flex-row xl:flex-col gap-4">
                    <Button
                      asChild
                      variant="outline"
                      className="rounded-full bg-white/10 border-white/10 hover:bg-white/20 text-white h-14 px-8 justify-start transition-all flex-1"
                    >
                      <a
                        href="mailto:ikoroduchurchadmin@nlwc.church"
                        className="flex items-center gap-3"
                      >
                        <ExternalLink className="w-5 h-5" />
                        Contact Admin
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      className="rounded-full text-white/70 hover:text-white hover:bg-white/5 h-14 px-8 group justify-start transition-all flex-1"
                      asChild
                    >
                      <a href="/contact" className="flex items-center gap-2">
                        Visit Contact Page
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                      </a>
                    </Button>
                  </div>
                </div>
              </Card>

              <div className="p-6 rounded-2xl border border-dashed border-gray-200 text-center bg-gray-50/50">
                <p className="text-xs text-gray-400 font-bold tracking-wider uppercase">
                  Secure & Trusted • NLWC Stewardship
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
          className="mt-24 sm:mt-32 pt-20 border-t border-gray-100 text-center"
        >
          <div className="flex justify-center gap-6 mb-12">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                className="w-2.5 h-2.5 rounded-full bg-primary/30"
              />
            ))}
          </div>
          <p className="text-gray-500 max-w-2xl mx-auto italic text-lg sm:text-xl font-medium leading-relaxed">
            &quot;Every man according as he purposeth in his heart, so let him
            give; not grudgingly, or of necessity: for God loveth a cheerful
            giver.&quot;
          </p>
          <p className="font-black mt-4 text-gray-900 tracking-widest uppercase text-sm">
            — 2 Corinthians 9:7
          </p>
        </motion.div>
      </div>
    </div>
  );
}

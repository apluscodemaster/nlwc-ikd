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
  ShieldCheck,
  Zap,
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
    description: "Sow a seed towards the building project",
    accountName: "Life in the Spirit Ministry IKD-PRJT",
    bankName: "ZENITH BANK",
    accountNumber: "1227683067",
    logo: "/Zenith-Bank-logo.png",
    accentColor: "primary",
  },
  {
    id: "welfare",
    title: "Welfare Offering",
    description: "Supporting those in need in our community",
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
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group"
    >
      <Card className="relative overflow-hidden border-none shadow-2xl shadow-black/5 bg-white/70 backdrop-blur-xl rounded-[32px] transition-all duration-500 hover:shadow-primary/10 hover:-translate-y-1">
        {/* Decorative Gradient Background */}
        <div
          className={cn(
            "absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 transition-opacity group-hover:opacity-20",
            option.accentColor === "primary" ? "bg-primary" : "bg-blue-600",
          )}
        />

        <CardHeader className="p-6 sm:p-8 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                {option.title}
              </CardTitle>
              <CardDescription className="text-base font-medium text-gray-500">
                {option.description}
              </CardDescription>
            </div>
            <div
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0",
                option.accentColor === "primary"
                  ? "bg-primary/10 border-primary/20 text-primary"
                  : "bg-blue-50 border-blue-100 text-blue-600",
              )}
            >
              {option.id === "project" ? (
                <Zap className="w-6 h-6" />
              ) : (
                <Building2 className="w-6 h-6" />
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 pt-0 space-y-6">
          {/* Main Info Block */}
          <div className="bg-gray-50/50 rounded-[24px] border border-gray-100/50 p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm border border-gray-100 shrink-0">
                <Image
                  src={option.logo}
                  alt={option.bankName}
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">
                  Bank Name
                </span>
                <span className="text-xl font-black text-gray-900 leading-none">
                  {option.bankName}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block px-1">
                Account Number
              </span>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                <div className="flex-1 px-5 h-14 bg-white rounded-2xl border-2 border-gray-100 flex items-center justify-between group-hover:border-primary/20 transition-all">
                  <span className="text-2xl sm:text-3xl font-black tracking-[0.1em] text-gray-900 tabular-nums">
                    {option.accountNumber}
                  </span>
                </div>
                <Button
                  onClick={() =>
                    copyToClipboard(option.accountNumber, option.id)
                  }
                  className={cn(
                    "h-14 px-8 rounded-2xl font-black shadow-lg transition-all active:scale-95 shrink-0",
                    isCopied
                      ? "bg-green-500 hover:bg-green-600 shadow-green-200"
                      : "bg-primary hover:bg-primary/90 shadow-primary/20",
                  )}
                >
                  <AnimatePresence mode="wait">
                    {isCopied ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-2"
                      >
                        <Check className="w-5 h-5" /> COPIED
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-2"
                      >
                        <Copy className="w-5 h-5" /> COPY
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white/50 p-4 rounded-xl border border-gray-100">
              <User className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                  Account Name
                </span>
                <span className="text-base font-bold text-gray-800 leading-tight">
                  {option.accountName}
                </span>
              </div>
            </div>
          </div>

          {option.note && (
            <div className="flex gap-3 px-2">
              <Info className="w-5 h-5 text-primary shrink-0 opacity-50" />
              <p className="text-sm font-medium text-gray-500 italic leading-snug">
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
      toast.success("Account details copied!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="min-h-screen relative bg-linear-to-b from-gray-50 to-white pt-24 pb-20 overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30 overflow-hidden">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-amber-200/20 rounded-full blur-[100px]"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Header Hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto mb-16 sm:mb-24"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white shadow-xl shadow-black/5 border border-gray-100 text-primary mb-8">
            <Heart className="w-4 h-4 fill-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              Giving & Stewardship
            </span>
          </div>
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black mb-8 tracking-tighter leading-none text-gray-900">
            Honour God with <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-amber-500">
              Your Giving
            </span>
          </h1>
          <div className="relative group inline-block">
            <div className="absolute -inset-4 bg-linear-to-r from-primary/10 to-transparent blur-2xl rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="relative text-xl sm:text-2xl md:text-3xl text-gray-500 font-medium leading-relaxed italic max-w-3xl mx-auto px-4">
              &quot;Honour the Lord with thy substance, and with the firstfruits
              of all thine increase...&quot;
              <span className="block mt-6 font-black text-gray-900 tracking-[0.3em] uppercase text-sm">
                — Proverbs 3:9-10
              </span>
            </p>
          </div>
        </motion.div>

        {/* Layout Grid */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start max-w-6xl mx-auto text-left">
          {/* Main Giving Cards */}
          <div className="space-y-8">
            <h2 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-4">
              <span className="w-10 h-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center text-lg">
                01
              </span>
              Local Transfers
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

          {/* Context & Support Side */}
          <div className="space-y-10 lg:sticky lg:top-32">
            <div>
              <h2 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-4">
                <span className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center text-lg">
                  02
                </span>
                The Impact
              </h2>
              <div className="grid sm:grid-cols-1 gap-6">
                {[
                  {
                    icon: Zap,
                    title: "Eternal Impact",
                    desc: "Fuels global ministry efforts to reach every soul.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Sanctuary Maintenance",
                    desc: "Keeps the house of the Lord in excellent condition.",
                  },
                  {
                    icon: Heart,
                    title: "Body Ministry",
                    desc: "Supports the physical needs of our local community.",
                  },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex gap-5 p-6 rounded-[24px] bg-white border border-gray-100 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black mb-1">{item.title}</h3>
                      <p className="text-gray-500 font-medium leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Help Card */}
            <Card className="border-none bg-gray-900 text-white p-8 sm:p-10 rounded-[40px] relative overflow-hidden group shadow-2xl">
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl transition-transform group-hover:scale-150" />
              <div className="relative z-10 space-y-8">
                <div>
                  <h3 className="text-3xl font-black mb-3">Questions?</h3>
                  <p className="text-gray-400 font-medium leading-relaxed">
                    Need help or have questions about how these funds are
                    allocated? Our administration team is available to assist
                    you.
                  </p>
                </div>
                <div className="flex flex-col gap-4">
                  <Button
                    asChild
                    className="h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-sm px-8"
                  >
                    <a
                      href="mailto:ikoroduchurchadmin@nlwc.church"
                      className="flex items-center gap-3"
                    >
                      <ExternalLink className="w-5 h-5" /> CONTACT ADMIN
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    asChild
                    className="h-14 rounded-2xl text-white hover:bg-white/10 font-bold transition-all px-8 justify-start"
                  >
                    <a href="/contact" className="flex items-center gap-2">
                      EXPLORE CONTACT OPTIONS{" "}
                      <ChevronRight className="w-5 h-5" />
                    </a>
                  </Button>
                </div>
              </div>
            </Card>

            <div className="text-center p-6 border-2 border-dashed border-gray-100 rounded-[32px]">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                Secure & Confidential Stewardship
              </p>
            </div>
          </div>
        </div>

        {/* Footer Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-24 pt-20 border-t border-gray-100"
        >
          <p className="text-2xl sm:text-3xl text-gray-500 font-medium italic max-w-2xl mx-auto leading-relaxed mb-6">
            &quot;Every man according as he purposeth in his heart... for God
            loveth a cheerful giver.&quot;
          </p>
          <span className="font-black text-gray-900 tracking-[0.4em] uppercase text-xs">
            — 2 Corinthians 9:7
          </span>
        </motion.div>
      </div>
    </div>
  );
}

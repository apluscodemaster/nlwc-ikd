"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { KeyRound, Loader2, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecoverProgressModalProps {
  onClose: () => void;
  onRecovered: (session: { session_id: string; username: string }) => void;
}

export default function RecoverProgressModal({
  onClose,
  onRecovered,
}: RecoverProgressModalProps) {
  const [step, setStep] = useState<"username" | "answer">("username");
  const [username, setUsername] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const lookUp = async () => {
    const name = username.trim();
    if (name.length < 2) {
      setError("Enter your name.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/quiz/recover?username=${encodeURIComponent(name)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not find that name.");
        setLoading(false);
        return;
      }
      setQuestion(data.question);
      setStep("answer");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    if (!answer.trim()) {
      setError("Enter your answer.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/quiz/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), answer }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Incorrect answer.");
        setLoading(false);
        return;
      }
      onRecovered({ session_id: data.session_id, username: data.username });
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 sm:p-8">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-6 top-6 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 text-center mb-1">
            Recover your progress
          </h3>
          <p className="text-sm text-muted-foreground text-center mb-5">
            Answer your security question to continue with your existing name and
            score on this device.
          </p>

          {step === "username" ? (
            <>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your name"
                autoFocus
                maxLength={30}
                onKeyDown={(e) => e.key === "Enter" && lookUp()}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
              {error && (
                <p className="mt-3 text-xs text-red-500 font-medium text-center">
                  {error}
                </p>
              )}
              <Button
                onClick={lookUp}
                disabled={loading}
                className="w-full h-12 rounded-full font-bold cursor-pointer mt-5"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 mb-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                  Your question
                </p>
                <p className="text-sm font-medium text-gray-900">{question}</p>
              </div>
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Your answer"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && verify()}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
              {error && (
                <p className="mt-3 text-xs text-red-500 font-medium">{error}</p>
              )}
              <Button
                onClick={verify}
                disabled={loading}
                className="w-full h-12 rounded-full font-bold cursor-pointer mt-5"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Recover progress"
                )}
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { KeyRound, Loader2, ArrowRight, X, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRecoveryCode } from "@/lib/quizSecurity";

export interface RecoveredSession {
  session_id: string;
  username: string;
  /** True after a code/link redemption — the old question was cleared, so
   *  the player should set a fresh one right away. */
  mustSetSecurity?: boolean;
}

interface RecoverProgressModalProps {
  onClose: () => void;
  onRecovered: (session: RecoveredSession) => void;
}

type Step = "username" | "answer" | "code";

const inputClass =
  "w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

export default function RecoverProgressModal({
  onClose,
  onRecovered,
}: RecoverProgressModalProps) {
  const [step, setStep] = useState<Step>("username");
  const [username, setUsername] = useState("");
  const [question, setQuestion] = useState<string | null>(null);
  const [hasRecoveryCode, setHasRecoveryCode] = useState(false);
  const [answer, setAnswer] = useState("");
  const [code, setCode] = useState("");
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
      setQuestion(data.question ?? null);
      setHasRecoveryCode(Boolean(data.hasRecoveryCode));
      // No question on file (pre-security-question player) → straight to the
      // admin-issued code the lookup confirmed exists.
      setStep(data.question ? "answer" : "code");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    const credential =
      step === "code" ? { code: code.trim() } : { answer };
    if (step === "code" ? !code.trim() : !answer.trim()) {
      setError(step === "code" ? "Enter your recovery code." : "Enter your answer.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/quiz/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), ...credential }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not verify.");
        setLoading(false);
        return;
      }
      onRecovered({
        session_id: data.session_id,
        username: data.username,
        mustSetSecurity: Boolean(data.mustSetSecurity),
      });
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const switchStep = (next: Step) => {
    setStep(next);
    setError("");
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
            {step === "code" ? (
              <LifeBuoy className="w-7 h-7 text-primary" />
            ) : (
              <KeyRound className="w-7 h-7 text-primary" />
            )}
          </div>
          <h3 className="text-lg font-bold text-gray-900 text-center mb-1">
            Recover your progress
          </h3>
          <p className="text-sm text-muted-foreground text-center mb-5">
            {step === "code"
              ? "Enter the recovery code the church admin gave you to continue with your existing name and score."
              : "Answer your security question to continue with your existing name and score on this device."}
          </p>

          {step === "username" && (
            <>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your name"
                autoFocus
                maxLength={30}
                onKeyDown={(e) => e.key === "Enter" && lookUp()}
                className={`${inputClass} text-center`}
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
          )}

          {step === "answer" && (
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
                className={inputClass}
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
              {hasRecoveryCode && (
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  Forgot the answer?{" "}
                  <button
                    type="button"
                    onClick={() => switchStep("code")}
                    className="font-medium text-primary hover:underline cursor-pointer"
                  >
                    Use the recovery code from the admin
                  </button>
                </p>
              )}
            </>
          )}

          {step === "code" && (
            <>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(formatRecoveryCode(e.target.value))}
                placeholder="e.g. KJ7Q-4PXW"
                autoFocus
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                maxLength={9}
                onKeyDown={(e) => e.key === "Enter" && verify()}
                className={`${inputClass} text-center font-mono tracking-[0.3em] uppercase`}
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
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Codes work once and expire after a day.
                {question && (
                  <>
                    {" "}
                    <button
                      type="button"
                      onClick={() => switchStep("answer")}
                      className="font-medium text-primary hover:underline cursor-pointer"
                    >
                      Answer the question instead
                    </button>
                  </>
                )}
              </p>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

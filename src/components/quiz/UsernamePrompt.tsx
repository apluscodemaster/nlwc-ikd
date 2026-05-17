"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { User, ArrowRight, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabase } from "@/lib/supabase";

interface UsernamePromptProps {
  onSubmit: (username: string) => Promise<unknown>;
}

export default function UsernamePrompt({ onSubmit }: UsernamePromptProps) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trimmed = username.trim();
  const isValidLength = trimmed.length >= 2 && trimmed.length <= 30;

  // Live username availability check (debounced)
  useEffect(() => {
    // Reset state when input changes
    setIsAvailable(null);
    setError("");

    if (!isValidLength) {
      setChecking(false);
      return;
    }

    setChecking(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const { data, error: checkError } = await getSupabase()
          .from("sessions")
          .select("username")
          .ilike("username", trimmed)
          .maybeSingle();

        if (checkError && checkError.code !== "PGRST116") {
          setError("Could not check availability");
          setIsAvailable(null);
        } else if (data) {
          setIsAvailable(false);
          setError("This name is already taken. Please try another name.");
        } else {
          setIsAvailable(true);
          setError("");
        }
      } catch {
        setError("Could not check availability");
        setIsAvailable(null);
      } finally {
        setChecking(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [trimmed, isValidLength]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (trimmed.length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }
    if (trimmed.length > 30) {
      setError("Name must be under 30 characters");
      return;
    }
    if (isAvailable === false) return;

    setError("");
    setLoading(true);
    try {
      await onSubmit(trimmed);
    } catch (err) {
      const error = err as Error & { code?: string };
      if (error.code === "USERNAME_EXISTS") {
        setError("This name is already taken. Please try another name.");
        setIsAvailable(false);
      } else {
        setError("Something went wrong. Please try again.");
      }
      setLoading(false);
    }
  };

  // Determine input border color based on state
  const inputBorderClass = error
    ? "border-red-300 focus:border-red-400 focus:ring-red-200/50"
    : isAvailable === true
      ? "border-green-300 focus:border-green-400 focus:ring-green-200/50"
      : "border-gray-200 focus:border-primary focus:ring-primary/20";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto"
    >
      <div className="p-8 rounded-3xl bg-white border border-gray-100 shadow-xl shadow-gray-100/50 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <User className="w-8 h-8 text-primary" />
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Welcome to the Quiz!
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Enter your name to track your score on the leaderboard. No account
          needed.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your name"
                autoFocus
                maxLength={30}
                className={`w-full h-12 px-5 pr-10 rounded-2xl border focus:ring-2 outline-none transition-all font-medium text-sm text-center ${inputBorderClass}`}
              />
              {/* Status indicator inside input */}
              {isValidLength && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checking ? (
                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                  ) : isAvailable === true ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : isAvailable === false ? (
                    <XCircle className="w-4 h-4 text-red-500" />
                  ) : null}
                </span>
              )}
            </div>
            {/* Feedback messages */}
            {error ? (
              <p className="mt-2 text-xs text-red-500 font-medium">{error}</p>
            ) : isAvailable === true ? (
              <p className="mt-2 text-xs text-green-600 font-medium">
                Name is available!
              </p>
            ) : checking && isValidLength ? (
              <p className="mt-2 text-xs text-gray-400 font-medium">
                Checking availability...
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            disabled={loading || !isValidLength || checking || isAvailable !== true}
            className="w-full h-12 rounded-full font-bold cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Start Quiz <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>
      </div>
    </motion.div>
  );
}

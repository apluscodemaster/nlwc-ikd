"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UsernamePromptProps {
  onSubmit: (username: string) => Promise<void>;
}

export default function UsernamePrompt({ onSubmit }: UsernamePromptProps) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();

    if (trimmed.length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }
    if (trimmed.length > 30) {
      setError("Name must be under 30 characters");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await onSubmit(trimmed);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

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
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name"
              autoFocus
              maxLength={30}
              className="w-full h-12 px-5 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm text-center"
            />
            {error && (
              <p className="mt-2 text-xs text-red-500 font-medium">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading || username.trim().length < 2}
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

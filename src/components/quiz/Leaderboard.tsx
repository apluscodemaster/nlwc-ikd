"use client";

import React from "react";
import { motion } from "framer-motion";
import { Crown, Medal } from "lucide-react";
import type { LeaderboardEntry } from "@/types/quiz";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentSessionId?: string;
}

export default function Leaderboard({
  entries,
  currentSessionId,
}: LeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-8">
        No scores yet. Be the first!
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex items-center gap-2">
        <Crown className="w-5 h-5 text-amber-500" />
        <h3 className="font-bold text-gray-900">Leaderboard</h3>
      </div>

      <div className="divide-y divide-gray-50">
        {entries.slice(0, 20).map((entry, i) => {
          const isMe = entry.session_id === currentSessionId;
          const rankColors = [
            "text-amber-500",
            "text-gray-400",
            "text-amber-700",
          ];

          return (
            <motion.div
              key={`${entry.session_id}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 px-5 py-3 ${isMe ? "bg-primary/5" : ""}`}
            >
              {/* Rank */}
              <span className="w-8 text-center">
                {i < 3 ? (
                  <Medal className={`w-5 h-5 mx-auto ${rankColors[i]}`} />
                ) : (
                  <span className="text-sm font-bold text-gray-400">
                    {i + 1}
                  </span>
                )}
              </span>

              {/* Name */}
              <span
                className={`flex-1 text-sm font-medium truncate ${isMe ? "text-primary font-bold" : "text-gray-800"}`}
              >
                {entry.username}
                {isMe && (
                  <span className="text-xs text-primary/60 ml-1">(You)</span>
                )}
              </span>

              {/* Score */}
              <span className="text-sm font-bold text-gray-900">
                {entry.total_score}
              </span>

              {/* Quizzes */}
              <span className="text-xs text-muted-foreground w-16 text-right">
                {entry.quizzes_taken} quiz
                {entry.quizzes_taken !== 1 ? "zes" : ""}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

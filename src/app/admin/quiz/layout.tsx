"use client";

import React from "react";
import { BrainCircuit } from "lucide-react";

export default function QuizAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-full">
      {/* Quiz sub-header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-10 flex items-center justify-between h-12">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-gray-900">
              Quiz Manager
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">{children}</div>
    </div>
  );
}

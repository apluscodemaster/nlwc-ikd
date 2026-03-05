"use client";

import React from "react";
import { useAdminAuth } from "@/app/admin/layout";
import { BookOpen, LogOut } from "lucide-react";

/**
 * Devotionals sub-layout.
 *
 * Authentication is handled by the parent /admin/layout.tsx.
 * This layout only adds a devotional-specific sub-header with
 * user info and sign-out button.
 */
export default function DevotionalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAdminAuth();

  return (
    <div className="flex flex-col min-h-full">
      {/* Devotional sub-header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-10 flex items-center justify-between h-12">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-gray-900">
              Devotional Manager
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground hidden sm:block">
              {user?.email}
            </span>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 h-8 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-600 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}

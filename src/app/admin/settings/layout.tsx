"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { SETTINGS_SECTIONS } from "./sections";

/**
 * Settings hub — groups the admin's operational tools (schedule, audit log)
 * under one nav entry with a shared sub-nav. Auth is handled by the parent
 * /admin layout; this only adds the section switcher above each page.
 */
export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isOverview = pathname === "/admin/settings";

  return (
    <div className="min-h-screen">
      <div className="px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 lg:pt-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <Link
            href="/admin/settings"
            className={`flex items-center gap-2 text-sm font-bold transition-colors ${
              isOverview
                ? "text-gray-900"
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
          <nav
            aria-label="Settings sections"
            className="overflow-x-auto hide-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0"
          >
            <div className="flex items-center gap-1 p-1 bg-gray-100/80 rounded-2xl w-max">
              {SETTINGS_SECTIONS.map((section) => {
                const active = pathname.startsWith(section.href);
                return (
                  <Link
                    key={section.slug}
                    href={section.href}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                      active
                        ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5"
                        : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                    }`}
                  >
                    <section.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    {section.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
      {children}
    </div>
  );
}

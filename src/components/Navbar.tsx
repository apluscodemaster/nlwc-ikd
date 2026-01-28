"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface NavLink {
  label: string;
  href: string;
  isExternal?: boolean;
}

interface NavItem {
  label: string;
  href?: string;
  children?: NavLink[];
}

const NAVIGATION_DATA: NavItem[] = [
  { label: "About Us", href: "/about" },
  {
    label: "Live Streaming",
    children: [
      {
        label: "Audio Broadcast",
        href: "/listen-live",
      },
      {
        label: "Video Broadcast",
        href: "/live",
      },
    ],
  },
  {
    label: "Media Resources",
    children: [
      {
        label: "Audio Messages",
        href: "/media?type=audio",
      },
      {
        label: "Blog",
        href: "https://nlwc.church/blog/",
        isExternal: true,
      },
      {
        label: "House Fellowship",
        href: "/fellowship",
      },
      {
        label: "Sunday School Manual",
        href: "https://ikorodu.nlwc.church/category/sunday-school-manual/",
        isExternal: true,
      },
      {
        label: "Message Transcripts",
        href: "https://ikorodu.nlwc.church/category/message-transcripts/",
        isExternal: true,
      },
      { label: "Image Gallery", href: "/gallery" },
    ],
  },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        isScrolled
          ? "bg-white/80 backdrop-blur-xl shadow-lg shadow-black/5 py-4"
          : "bg-black/30 backdrop-blur-sm py-6",
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="relative z-10 transition-transform hover:scale-105 active:scale-95"
          >
            <Image
              src="/logo-200-x-80.png"
              alt="NLWC Logo"
              width={100}
              height={40}
              className={cn(
                "h-auto w-auto transition-all duration-500",
                isScrolled ? "brightness-100" : "brightness-0 invert",
              )}
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {NAVIGATION_DATA.map((item) => (
              <div key={item.label} className="relative group">
                {item.href ? (
                  <Link
                    href={item.href}
                    className={cn(
                      "px-5 py-2.5 rounded-full text-sm font-bold transition-all relative overflow-hidden group/link",
                      isScrolled
                        ? pathname === item.href
                          ? "text-primary"
                          : "text-gray-600 hover:text-primary"
                        : pathname === item.href
                          ? "text-primary"
                          : "text-white hover:text-white/80",
                    )}
                  >
                    {item.label}
                    {pathname === item.href && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                      />
                    )}
                  </Link>
                ) : (
                  <div className="relative">
                    <button
                      className={cn(
                        "flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold transition-all",
                        isScrolled
                          ? "text-gray-600 group-hover:text-primary"
                          : "text-white group-hover:text-white/80",
                      )}
                    >
                      {item.label}
                      <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
                    </button>

                    {/* Dropdown Menu */}
                    <div className="absolute top-full left-0 pt-2 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300">
                      <div className="w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 overflow-hidden">
                        {item.children?.map((child) => (
                          <Link
                            key={child.label}
                            href={child.href}
                            target={child.isExternal ? "_blank" : undefined}
                            rel={
                              child.isExternal
                                ? "noopener noreferrer"
                                : undefined
                            }
                            className={cn(
                              "block px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-primary/5 hover:text-primary",
                              pathname === child.href
                                ? "text-primary bg-primary/5"
                                : "text-gray-700",
                            )}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  className={cn(
                    "p-2.5 rounded-xl transition-all active:scale-90",
                    isScrolled
                      ? "bg-primary/10 text-primary"
                      : "bg-white/10 text-white",
                  )}
                >
                  <Menu className="w-6 h-6" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-full sm:w-[400px] p-0 border-none bg-white"
              >
                <SheetHeader className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <SheetTitle>
                      <Image
                        src="/logo-200-x-80.png"
                        alt="NLWC Logo"
                        width={100}
                        height={40}
                        className="h-auto w-auto"
                      />
                    </SheetTitle>
                  </div>
                </SheetHeader>

                <div className="p-6 overflow-y-auto h-[calc(100vh-100px)]">
                  <Accordion
                    type="single"
                    collapsible
                    className="w-full space-y-2"
                  >
                    {NAVIGATION_DATA.map((item, idx) => (
                      <div key={item.label}>
                        {item.href ? (
                          <Link
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              "flex w-full py-4 text-lg font-bold transition-all",
                              pathname === item.href
                                ? "text-primary px-4 bg-primary/5 rounded-2xl"
                                : "text-gray-900 border-b border-gray-50",
                            )}
                          >
                            {item.label}
                          </Link>
                        ) : (
                          <AccordionItem
                            value={`item-${idx}`}
                            className="border-b border-gray-50"
                          >
                            <AccordionTrigger className="text-lg font-bold py-4 hover:no-underline hover:text-primary">
                              {item.label}
                            </AccordionTrigger>
                            <AccordionContent className="pb-4">
                              <div className="grid gap-1 pl-4">
                                {item.children?.map((child) => (
                                  <Link
                                    key={child.label}
                                    href={child.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={cn(
                                      "block py-3 px-4 rounded-xl text-md font-semibold transition-all",
                                      pathname === child.href
                                        ? "text-primary bg-primary/5"
                                        : "text-gray-600 hover:text-primary",
                                    )}
                                  >
                                    {child.label}
                                  </Link>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        )}
                      </div>
                    ))}
                  </Accordion>

                  <div className="mt-12 space-y-6">
                    <div className="p-6 rounded-[32px] bg-primary/5 border border-primary/10">
                      <h4 className="font-bold text-gray-900 mb-2">
                        Visit Us This Sunday
                      </h4>
                      <p className="text-sm text-gray-600 mb-4 font-medium">
                        8:00 AM @ Main Sanctuary, Ikorodu
                      </p>
                      <Link
                        href="/contact"
                        onClick={() => setMobileOpen(false)}
                        className="inline-flex items-center h-12 px-6 rounded-full bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20"
                      >
                        Get Directions
                      </Link>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
}

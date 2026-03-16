"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Menu,
  Heart,
  Youtube,
  Facebook,
  Instagram,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
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
    label: "Media",
    children: [
      {
        label: "Audio Messages",
        href: "/sermons",
      },
      {
        label: "Video Messages",
        href: "/video-messages",
      },
      {
        label: "Church Gallery",
        href: "/gallery",
      },
    ],
  },
  {
    label: "Spiritual Resources",
    children: [
      {
        label: "Daily Devotionals",
        href: "/devotionals",
      },
      {
        label: "Sunday School Manual",
        href: "/manuals",
      },
      {
        label: "Message Transcripts",
        href: "/transcripts",
      },
    ],
  },
  {
    label: "Connect",
    children: [
      {
        label: "House Fellowship",
        href: "/fellowship",
      },
      {
        label: "Blog",
        href: "https://nlwc.church/blog/",
        isExternal: true,
      },
    ],
  },
  { label: "Contact Us", href: "/contact" },
];

const SOCIAL_LINKS = [
  { icon: Facebook, href: "https://facebook.com/nlwclife", label: "Facebook" },
  {
    icon: Instagram,
    href: "https://www.instagram.com/nlwclife/",
    label: "Instagram",
  },
  {
    icon: Youtube,
    href: "https://www.youtube.com/@nlwclife",
    label: "YouTube",
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Hide Navbar on admin routes
  if (pathname?.startsWith("/admin")) return null;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        isScrolled
          ? "bg-white/80 backdrop-blur-xl shadow-lg shadow-black/5 py-3 border-b border-primary/10"
          : "bg-white/70 backdrop-blur-md py-3",
      )}
    >
      <nav className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="relative z-10 transition-transform hover:scale-105 active:scale-95"
          >
            <Image
              src="/logo-512x512-transparent.png"
              alt="NLWC Logo"
              width={110}
              height={44}
              className="h-auto w-auto transition-all duration-500 brightness-100"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {NAVIGATION_DATA.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setActiveDropdown(item.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                {item.href ? (
                  <Link
                    href={item.href}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-bold transition-all relative overflow-hidden group",
                      isScrolled
                        ? pathname === item.href
                          ? "text-primary"
                          : "text-gray-600 hover:text-primary"
                        : pathname === item.href
                          ? "text-primary"
                          : "text-black hover:text-black/80",
                    )}
                  >
                    {item.label}
                    {pathname === item.href && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-primary/10 rounded-full -z-10"
                        transition={{
                          type: "spring",
                          bounce: 0.3,
                          duration: 0.6,
                        }}
                      />
                    )}
                  </Link>
                ) : (
                  <div className="relative">
                    <button
                      className={cn(
                        "flex items-center gap-1 px-4 py-2 rounded-full text-sm font-bold transition-all",
                        isScrolled
                          ? activeDropdown === item.label
                            ? "text-primary bg-primary/5"
                            : "text-gray-600 hover:text-primary"
                          : activeDropdown === item.label
                            ? "text-primary bg-primary/5"
                            : "text-black hover:text-primary",
                      )}
                    >
                      {item.label}
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 transition-transform duration-300",
                          activeDropdown === item.label && "rotate-180",
                        )}
                      />
                    </button>

                    <AnimatePresence>
                      {activeDropdown === item.label && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full left-0 pt-2 z-50"
                        >
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
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {/* CTA Button */}
            <Link
              href="/give"
              className={cn(
                "hidden sm:flex items-center gap-2 h-10 px-5 rounded-full font-bold text-sm transition-all active:scale-95 shadow-lg shadow-primary/20",
                isScrolled
                  ? "bg-primary text-white hover:bg-primary/90"
                  : "bg-white text-primary hover:bg-white/90",
              )}
            >
              <Heart className="w-4 h-4" />
              Give Now
            </Link>

            {/* Mobile Menu Trigger */}
            <div className="lg:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <button
                    className={cn(
                      "p-2.5 rounded-xl transition-all active:scale-90",
                      isScrolled
                        ? "bg-primary/10 text-primary"
                        : "bg-black/5 text-black",
                    )}
                  >
                    <Menu className="w-6 h-6" />
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-full sm:w-[400px] p-0 border-none bg-white flex flex-col"
                >
                  <SheetHeader className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <SheetTitle>
                        <Link href="/">
                          <Image
                            src="/logo-512x512-transparent.png"
                            alt="NLWC Logo"
                            width={100}
                            height={40}
                            className="h-auto w-auto"
                          />
                        </Link>
                      </SheetTitle>
                    </div>
                  </SheetHeader>

                  <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    <Accordion
                      type="single"
                      collapsible
                      className="w-full space-y-2"
                    >
                      {NAVIGATION_DATA.map((item, idx) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                        >
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
                        </motion.div>
                      ))}
                    </Accordion>

                    <div className="mt-8 space-y-4">
                      <div className="p-6 rounded-[32px] bg-primary/5 border border-primary/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                          <Heart className="w-12 h-12 text-primary fill-primary" />
                        </div>
                        <h4 className="font-bold text-gray-900 mb-2">
                          Support Our Mission
                        </h4>
                        <p className="text-sm text-gray-600 mb-4 font-medium">
                          Honour the Lord with your substance and firstfruits.
                        </p>
                        <Link
                          href="/give"
                          onClick={() => setMobileOpen(false)}
                          className="inline-flex items-center h-12 px-6 rounded-full bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95"
                        >
                          Give Now
                        </Link>
                      </div>

                      <div className="p-6 rounded-[32px] bg-gray-50 border border-gray-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                          <MapPin className="w-12 h-12 text-gray-400" />
                        </div>
                        <h4 className="font-bold text-gray-900 mb-2">
                          Visit Us This Sunday
                        </h4>
                        <p className="text-sm text-gray-600 mb-4 font-medium">
                          8:00 AM @ Church Auditorium, Ikorodu
                        </p>
                        <Link
                          href="/contact"
                          onClick={() => setMobileOpen(false)}
                          className="inline-flex items-center h-12 px-6 rounded-full bg-black text-white font-bold text-sm shadow-lg shadow-black/20 hover:shadow-black/30 transition-all active:scale-95"
                        >
                          Get Directions
                        </Link>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-8">
                        <a
                          href="tel:+2348137436770"
                          className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 hover:bg-gray-50 transition-colors shadow-sm"
                        >
                          <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                            <Phone className="w-5 h-5" />
                          </div>
                          <span className="text-sm font-bold text-gray-900">
                            Call Us
                          </span>
                        </a>
                        <a
                          href="mailto:ikoroduchurchadmin@nlwc.church"
                          className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 hover:bg-gray-50 transition-colors shadow-sm"
                        >
                          <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                            <Mail className="w-5 h-5" />
                          </div>
                          <span className="text-sm font-bold text-gray-900">
                            Email
                          </span>
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                    <div className="flex items-center justify-center gap-6">
                      {SOCIAL_LINKS.map((social) => (
                        <a
                          key={social.label}
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-gray-600 hover:text-primary shadow-sm hover:shadow-md transition-all active:scale-90"
                        >
                          <social.icon className="w-5 h-5" />
                        </a>
                      ))}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

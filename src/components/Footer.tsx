"use client";

import Link from "next/link";
import {
  Youtube,
  Facebook,
  Instagram,
  Twitter,
  MessageCircle,
  Mail,
  Phone,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { usePathname } from "next/navigation";
import ObfuscatedContact from "@/components/ObfuscatedContact";

// Social media links - update these with actual URLs
const SOCIAL_LINKS = {
  youtube: "https://www.youtube.com/@nlwclife",
  facebook: "https://facebook.com/nlwclife",
  instagram: "https://www.instagram.com/nlwclife/",
  twitter: "https://x.com/nlwclife",
  whatsapp: "https://wa.me/2348137436770",
};

const QUICK_LINKS = [
  { label: "About", href: "/about" },
  { label: "Audio Messages", href: "/sermons" },
  { label: "Listen Live", href: "/listen-live" },
  { label: "Watch Live", href: "/live" },
  { label: "Church Gallery", href: "/gallery" },
];

const RESOURCES_LINKS = [
  { label: "Daily Devotionals", href: "/devotionals" },
  { label: "Sunday School Manuals", href: "/manuals" },
  { label: "Message Transcripts", href: "/transcripts" },
  { label: "Become Born-Again", href: "/salvation" },
  { label: "Take Quiz", href: "/sermons/quiz" },
];

const CONNECT_LINKS = [
  { label: "House Fellowships", href: "/fellowship" },
  { label: "Testimonies", href: "/testimonies" },
  { label: "Blog", href: "https://nlwc.church/blog/", external: true },
  { label: "Contact Us", href: "/contact" },
  { label: "Give", href: "/give" },
];

export default function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // Hide Footer on admin and offline routes
  if (pathname?.startsWith("/admin") || pathname === "/offline") return null;

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setEmail("");
      } else {
        toast.error(data.error || "Failed to subscribe");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const year = new Date().getFullYear();
  const orange = "#FF7C18";

  return (
    <footer className="w-full mt-12 bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
        {/* Column 1 */}
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="mb-4">
            <Link href="/" className="inline-block">
              <Image
                src="/logo-200-x-80.png"
                alt="NLWC logo"
                width={200}
                height={80}
                style={{ width: "auto", height: "auto" }}
              />
            </Link>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            The New and Living Way Church (NLWC) is an amiable community of
            believers who are focused on inheriting the promise of Eternal Life
            in its fullness. Day after day we are learning to walk by the Spirit
            as we grow in the faith of the precious Son of God.
          </p>
        </div>

        {/* Middle Columns: Quick Links, Resources & Connect */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-8 sm:gap-8 sm:col-span-2 lg:col-span-2">
          {/* Column 2: Quick Links (hidden on mobile) */}
          <div className="hidden sm:block">
            <h3 className="font-semibold mb-4 text-white text-lg">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-2 text-gray-300 hover:text-primary transition-colors text-sm"
                  >
                    <ChevronRight color={orange} size={16} className="shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h3 className="font-semibold mb-4 text-white text-lg">Resources</h3>
            <ul className="space-y-3">
              {RESOURCES_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-2 text-gray-300 hover:text-primary transition-colors text-sm"
                  >
                    <ChevronRight color={orange} size={16} className="shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Connect */}
          <div>
            <h3 className="font-semibold mb-4 text-white text-lg">Connect</h3>
            <ul className="space-y-3">
              {CONNECT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    {...(link.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="flex items-center gap-2 text-gray-300 hover:text-primary transition-colors text-sm"
                  >
                    <ChevronRight color={orange} size={16} className="shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Column 4: Subscribe & contact */}
        <div>
          <h3 className="font-semibold mb-4 text-white text-lg">Follow Us</h3>
          <p className="text-sm mb-4 text-gray-300">
            Don&apos;t miss our future updates. Follow us today!
          </p>

          {/* <form onSubmit={handleSubscribe} className="space-y-3 mb-6">
            <div className="relative">
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-12 pl-4 pr-16 rounded-full bg-gray-700 border border-gray-600 text-white placeholder:text-gray-400 focus:outline-none focus:border-primary transition-colors text-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-1 top-1 h-10 px-4 rounded-full bg-primary text-white font-bold text-xs hover:bg-opacity-90 transition-all disabled:opacity-50"
              >
                {loading ? "..." : "JOIN"}
              </button>
            </div>
          </form> */}

          <div className="flex items-center gap-2 mb-6">
            <a
              href={SOCIAL_LINKS.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all"
              aria-label="YouTube"
            >
              <Youtube size={18} />
            </a>
            <a
              href={SOCIAL_LINKS.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all"
              aria-label="Facebook"
            >
              <Facebook size={16} />
            </a>
            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all"
              aria-label="Instagram"
            >
              <Instagram size={18} />
            </a>
            <a
              href={SOCIAL_LINKS.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all"
              aria-label="Twitter"
            >
              <Twitter size={16} />
            </a>
            <a
              href={SOCIAL_LINKS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all"
              aria-label="WhatsApp"
            >
              <MessageCircle size={18} />
            </a>
          </div>

          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex items-center gap-2">
              <Mail color={orange} size={18} />
              <ObfuscatedContact
                type="email"
                className="hover:text-primary transition-colors"
              />
            </li>
            <li className="flex items-center gap-2">
              <Phone color={orange} size={18} />
              <ObfuscatedContact
                type="phone"
                className="hover:text-primary transition-colors"
              />
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between text-center sm:text-left text-sm text-gray-400 gap-4">
          <div>© {year} NLWC IKORODU. All rights Reserved.</div>
          <div className="flex items-center gap-4">
            <Link
              href="/about"
              className="hover:text-primary transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/contact"
              className="hover:text-primary transition-colors"
            >
              Terms of Use
            </Link>
          </div>
        </div>
      </div>
      <Toaster position="bottom-right" />
    </footer>
  );
}

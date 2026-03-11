"use client";

import Link from "next/link";
import {
  FaYoutube,
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaWhatsapp,
} from "react-icons/fa";
import { HiOutlineMail, HiPhone, HiChevronRight } from "react-icons/hi";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { usePathname } from "next/navigation";

// Social media links - update these with actual URLs
const SOCIAL_LINKS = {
  youtube: "https://www.youtube.com/@nlwclife",
  facebook: "https://facebook.com/nlwclife",
  instagram: "https://www.instagram.com/nlwclife/",
  twitter: "https://x.com/nlwclife",
  whatsapp: "https://wa.me/2347035760085",
};

export default function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // Hide Footer on admin routes
  if (pathname?.startsWith("/admin")) return null;

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
                width={100}
                height={80}
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

        {/* Middle Columns: Quick Links & Resources - Side by side on mobile */}
        <div className="grid grid-cols-2 gap-8 sm:col-span-2 lg:col-span-2">
          {/* Column 2: Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-white text-lg">
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="flex items-center gap-2 text-gray-300 hover:text-primary transition-colors text-sm"
                >
                  <HiChevronRight color={orange} />
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/sermons"
                  className="flex items-center gap-2 text-gray-300 hover:text-primary transition-colors text-sm"
                >
                  <HiChevronRight color={orange} />
                  Audio Messages
                </Link>
              </li>
              <li>
                <Link
                  href="/fellowship"
                  className="flex items-center gap-2 text-gray-300 hover:text-primary transition-colors text-sm"
                >
                  <HiChevronRight color={orange} />
                  House Fellowships
                </Link>
              </li>
              <li>
                <Link
                  href="https://nlwc.church/blog/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-300 hover:text-primary transition-colors text-sm"
                >
                  <HiChevronRight color={orange} />
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/gallery"
                  className="flex items-center gap-2 text-gray-300 hover:text-primary transition-colors text-sm"
                >
                  <HiChevronRight color={orange} />
                  Church Gallery
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="flex items-center gap-2 text-gray-300 hover:text-primary transition-colors text-sm"
                >
                  <HiChevronRight color={orange} />
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h3 className="font-semibold mb-4 text-white text-lg">Resources</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/devotionals"
                  className="flex items-center gap-2 text-gray-300 hover:text-primary transition-colors text-sm"
                >
                  <HiChevronRight color={orange} />
                  Daily Devotionals
                </Link>
              </li>
              <li>
                <Link
                  href="/listen-live"
                  className="flex items-center gap-2 text-gray-300 hover:text-primary transition-colors text-sm"
                >
                  <HiChevronRight color={orange} />
                  Listen live
                </Link>
              </li>
              <li>
                <Link
                  href="/live"
                  className="flex items-center gap-2 text-gray-300 hover:text-primary transition-colors text-sm"
                >
                  <HiChevronRight color={orange} />
                  Watch live
                </Link>
              </li>
              <li>
                <Link
                  href="/manuals"
                  className="flex items-center gap-2 text-gray-300 hover:text-primary transition-colors text-sm"
                >
                  <HiChevronRight color={orange} />
                  Sunday School Manuals
                </Link>
              </li>
              <li>
                <Link
                  href="/transcripts"
                  className="flex items-center gap-2 text-gray-300 hover:text-primary transition-colors text-sm"
                >
                  <HiChevronRight color={orange} />
                  Message Transcripts
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Column 4: Subscribe & contact */}
        <div>
          <h3 className="font-semibold mb-4 text-white text-lg">
            Get Subscribed
          </h3>
          <p className="text-sm mb-4 text-gray-300">
            Don&apos;t miss our future updates. Get Subscribed today!
          </p>

          <form onSubmit={handleSubscribe} className="space-y-3 mb-6">
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
          </form>

          <div className="flex items-center gap-2 mb-6">
            <a
              href={SOCIAL_LINKS.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all"
              aria-label="YouTube"
            >
              <FaYoutube size={18} />
            </a>
            <a
              href={SOCIAL_LINKS.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all"
              aria-label="Facebook"
            >
              <FaFacebookF size={16} />
            </a>
            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all"
              aria-label="Instagram"
            >
              <FaInstagram size={18} />
            </a>
            <a
              href={SOCIAL_LINKS.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all"
              aria-label="Twitter"
            >
              <FaTwitter size={16} />
            </a>
            <a
              href={SOCIAL_LINKS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all"
              aria-label="WhatsApp"
            >
              <FaWhatsapp size={18} />
            </a>
          </div>

          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex items-center gap-2">
              <HiOutlineMail color={orange} size={18} />
              <a
                href="mailto:ikoroduchurchadmin@nlwc.church"
                className="hover:text-primary transition-colors"
              >
                ikoroduchurchadmin@nlwc.church
              </a>
            </li>
            <li className="flex items-center gap-2">
              <HiPhone color={orange} size={18} />
              <a
                href="tel:+2347035760085"
                className="hover:text-primary transition-colors"
              >
                +234 703 576 0085
              </a>
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

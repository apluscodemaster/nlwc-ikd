"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Home } from "lucide-react";
import { usePathname } from "next/navigation";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  showBreadcrumbs?: boolean;
}

// Map paths to readable names
const PATH_NAMES: Record<string, string> = {
  about: "About Us",
  contact: "Contact",
  devotionals: "Daily Devotionals",
  fellowship: "House Fellowship",
  gallery: "Image Gallery",
  live: "Video Broadcast",
  "listen-live": "Audio Broadcast",
  media: "Media Resources",
};

export default function PageHeader({
  title,
  subtitle,
  backgroundImage = "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073&auto=format&fit=crop",
  showBreadcrumbs = true,
}: PageHeaderProps) {
  const pathname = usePathname();

  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = () => {
    const paths = pathname.split("/").filter(Boolean);

    return paths.map((path, index) => {
      const href = "/" + paths.slice(0, index + 1).join("/");
      const name =
        PATH_NAMES[path] || path.charAt(0).toUpperCase() + path.slice(1);
      const isLast = index === paths.length - 1;

      return { name, href, isLast };
    });
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <section className="relative h-[320px] md:h-[500px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <motion.div
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0"
      >
        <Image
          src={backgroundImage}
          alt={title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/60" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 mt-12 md:mt-20">
        {/* Breadcrumbs */}
        {showBreadcrumbs && breadcrumbs.length > 0 && (
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2 mb-4 md:mb-6 text-[10px] xs:text-xs md:text-sm"
            aria-label="Breadcrumb"
          >
            <Link
              href="/"
              className="flex items-center gap-1 text-white/70 hover:text-white transition-colors"
            >
              <Home className="w-3 h-3 md:w-4 md:h-4" />
              <span>Home</span>
            </Link>

            {breadcrumbs.map((crumb) => (
              <React.Fragment key={crumb.href}>
                <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-white/40" />
                {crumb.isLast ? (
                  <span className="text-primary font-semibold">
                    {crumb.name}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    {crumb.name}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </motion.nav>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-3xl md:text-6xl font-bold mb-4"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-base md:text-xl text-gray-200 max-w-2xl mx-auto px-2"
          >
            {subtitle}
          </motion.p>
        )}
      </div>
    </section>
  );
}

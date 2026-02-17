"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft, Ghost } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center px-4 overflow-hidden bg-linear-to-b from-gray-50 to-white">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-2xl">
        {/* Animated Icon */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="mb-8"
        >
          <div className="w-24 h-24 rounded-3xl bg-linear-to-br from-primary to-amber-600 flex items-center justify-center shadow-2xl shadow-primary/30 relative group">
            <Ghost className="w-12 h-12 text-white animate-bounce" />
            <div className="absolute -inset-1 bg-white/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </motion.div>

        {/* Big 404 Text */}
        <div className="relative mb-6">
          <motion.h1
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-[10rem] md:text-[14rem] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-gray-900 via-gray-800 to-gray-500"
          >
            404
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-6 py-2 bg-white/80 backdrop-blur-xl border border-gray-100 rounded-full shadow-lg"
          >
            <span className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-primary to-amber-600">
              Page Not Found
            </span>
          </motion.div>
        </div>

        {/* Informative Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center space-y-4 px-4"
        >
          <h2 className="text-2xl font-bold text-gray-900">
            Oops! This path doesn&apos;t exist.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-md mx-auto">
            It seems you&apos;ve wandered into a quiet corner of the church
            gallery. The page you&apos;re looking for might have moved or is
            still being prepared.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-12 flex flex-col sm:flex-row gap-4"
        >
          <Button
            asChild
            size="lg"
            className="rounded-full px-8 h-14 text-base font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
          >
            <Link href="/" className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              Return Home
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-full px-8 h-14 text-base font-bold bg-white/50 backdrop-blur-sm border-gray-200 hover:bg-white hover:border-primary hover:text-primary hover:scale-105 transition-all shadow-sm"
          >
            <Link href="/sermons" className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Sermons
            </Link>
          </Button>
        </motion.div>

        {/* Go Back Link */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          onClick={() => window.history.back()}
          className="mt-8 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary transition-colors transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Go back to previous page
        </motion.button>
      </div>

      {/* Dynamic Background Circles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
          className="absolute w-2 h-2 rounded-full bg-primary/30"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}
    </div>
  );
}

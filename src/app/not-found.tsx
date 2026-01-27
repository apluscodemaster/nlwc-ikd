"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center pt-20">
        <div className="relative">
          <h1 className="text-[12rem] md:text-[16rem] font-bold text-gray-100 select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 border-b-4 border-primary pb-2 px-4 bg-white/50 backdrop-blur-sm rounded-lg">
              Lost in Reflection?
            </h2>
          </div>
        </div>

        <p className="mt-8 text-xl text-muted-foreground max-w-lg mx-auto">
          The page you&apos;re looking for has wandered off. But don&apos;t
          worry, there are plenty of joyful moments waiting for you back in the
          gallery.
        </p>

        <motion.div
          className="mt-10"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            asChild
            size="lg"
            className="rounded-full px-12 h-14 text-lg font-bold shadow-xl"
          >
            <Link href="/">Back to Homepage</Link>
          </Button>
        </motion.div>
      </div>
    </>
  );
}

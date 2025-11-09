"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

// const menuItemVariants = {
//   hidden: { opacity: 0, y: -5 },
//   visible: { opacity: 1, y: 0 },
// };

const dropdownVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 15 },
};

const mobileMenuVariants = {
  hidden: { x: "100%", opacity: 0 },
  visible: { x: 0, opacity: 1 },
  exit: { x: "100%", opacity: 0 },
};

const subMenuVariants = {
  hidden: { height: 0, opacity: 0 },
  visible: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 },
};

export default function Navbar() {
  const [openLive, setOpenLive] = useState(false);
  const [openMedia, setOpenMedia] = useState(false);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileLiveOpen, setMobileLiveOpen] = useState(false);
  const [mobileMediaOpen, setMobileMediaOpen] = useState(false);

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-30 bg-black/30 backdrop-blur-sm">
      <nav>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-30">
            <div className="flex items-center">
              <Link
                href="https://ikorodu.nlwc.church/"
                className="inline-block"
              >
                <Image
                  src="/logo-200-x-80.png"
                  alt="logo"
                  width={80}
                  height={60}
                  priority
                />
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="https://ikorodu.nlwc.church/about/"
                className="text-white hover:text-[#FF7C18] transition-colors"
              >
                About Us
              </Link>

              <div className="relative group">
                <button
                  onMouseEnter={() => setOpenLive(true)}
                  onMouseLeave={() => setOpenLive(false)}
                  onClick={() => setOpenLive((s) => !s)}
                  onKeyDown={(e) =>
                    handleKeyPress(e, () => setOpenLive((s) => !s))
                  }
                  className="text-white flex items-center gap-2 cursor-pointer"
                  aria-expanded={openLive}
                  aria-haspopup="true"
                >
                  Live Streaming
                </button>
                <AnimatePresence mode="wait">
                  {openLive && (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      variants={dropdownVariants}
                      onMouseEnter={() => setOpenLive(true)}
                      onMouseLeave={() => setOpenLive(false)}
                      className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg text-gray-800"
                    >
                      <Link
                        href="https://ikorodu.nlwc.church/audio-broadcast/"
                        className="block px-4 py-2 hover:bg-[#FF7C18] hover:text-white transition-colors cursor-pointer"
                      >
                        Audio Broadcast
                      </Link>
                      <Link
                        href="https://ikorodu.nlwc.church/video-broadcast/"
                        className="block px-4 py-2 hover:bg-[#FF7C18] hover:text-white transition-colors cursor-pointer"
                      >
                        Video Broadcast
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative group">
                <button
                  onMouseEnter={() => setOpenMedia(true)}
                  onMouseLeave={() => setOpenMedia(false)}
                  onClick={() => setOpenMedia((s) => !s)}
                  onKeyDown={(e) =>
                    handleKeyPress(e, () => setOpenMedia((s) => !s))
                  }
                  className="text-white flex items-center gap-2 cursor-pointer"
                  aria-expanded={openMedia}
                  aria-haspopup="true"
                >
                  Media Resources
                </button>
                <AnimatePresence mode="wait">
                  {openMedia && (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      variants={dropdownVariants}
                      onMouseEnter={() => setOpenMedia(true)}
                      onMouseLeave={() => setOpenMedia(false)}
                      className="absolute left-0 mt-1 w-56 bg-white rounded-md shadow-lg text-gray-800"
                    >
                      <Link
                        href="https://ikorodu.nlwc.church/audio-messages/"
                        className="block px-4 py-2 hover:bg-[#FF7C18] hover:text-white transition-colors cursor-pointer"
                      >
                        Audio Messages
                      </Link>
                      <Link
                        href="https://nlwc.church/blog/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-2 hover:bg-[#FF7C18] hover:text-white transition-colors cursor-pointer"
                      >
                        Blog
                      </Link>
                      <Link
                        href="https://ikorodu.nlwc.church/house-fellowship/"
                        className="block px-4 py-2 hover:bg-[#FF7C18] hover:text-white transition-colors cursor-pointer"
                      >
                        House Fellowship
                      </Link>
                      <Link
                        href="https://ikorodu.nlwc.church/category/sunday-school-manual/"
                        className="block px-4 py-2 hover:bg-[#FF7C18] hover:text-white transition-colors cursor-pointer"
                      >
                        Sunday School Manual
                      </Link>
                      <Link
                        href="https://ikorodu.nlwc.church/category/message-transcripts/"
                        className="block px-4 py-2 hover:bg-[#FF7C18] hover:text-white transition-colors cursor-pointer"
                      >
                        Message Transcripts
                      </Link>
                      <Link
                        href="/"
                        className="block px-4 py-2 hover:bg-[#FF7C18] hover:text-white transition-colors cursor-pointer"
                      >
                        Image Gallery
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link
                href="https://ikorodu.nlwc.church/contact/"
                className="text-white hover:text-[#FF7C18] transition-colors"
              >
                Contact
              </Link>
            </div>

            {/* Mobile: hamburger */}
            <motion.div
              className="md:hidden flex items-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <button
                onClick={() => setMobileOpen((s) => !s)}
                onKeyDown={(e) =>
                  handleKeyPress(e, () => setMobileOpen((s) => !s))
                }
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                aria-controls="mobile-menu"
                className="text-white p-2"
              >
                {mobileOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
              </button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Mobile menu panel */}
      <AnimatePresence mode="wait">
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={mobileMenuVariants}
            className="md:hidden absolute inset-x-0 top-16 bg-white text-gray-900 shadow-lg z-40"
          >
            <div className="px-4 py-4 space-y-2">
              <Link
                href="https://ikorodu.nlwc.church/about/"
                className="block py-2"
              >
                About Us
              </Link>

              <div>
                <button
                  onClick={() => setMobileLiveOpen((s) => !s)}
                  onKeyDown={(e) =>
                    handleKeyPress(e, () => setMobileLiveOpen((s) => !s))
                  }
                  aria-expanded={mobileLiveOpen}
                  className="flex items-center justify-between w-full py-2 hover:text-[#FF7C18] transition-colors"
                >
                  <span>Live Streaming</span>
                  <span>{mobileLiveOpen ? "−" : "+"}</span>
                </button>
                <AnimatePresence mode="wait">
                  {mobileLiveOpen && (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={subMenuVariants}
                      className="pl-4 overflow-hidden"
                    >
                      <Link
                        href="https://ikorodu.nlwc.church/audio-broadcast/"
                        className="block py-2 hover:text-[#FF7C18] transition-colors"
                      >
                        Audio Broadcast
                      </Link>
                      <Link
                        href="https://ikorodu.nlwc.church/video-broadcast/"
                        className="block py-2 hover:text-[#FF7C18] transition-colors"
                      >
                        Video Broadcast
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <button
                  onClick={() => setMobileMediaOpen((s) => !s)}
                  onKeyDown={(e) =>
                    handleKeyPress(e, () => setMobileMediaOpen((s) => !s))
                  }
                  aria-expanded={mobileMediaOpen}
                  className="flex items-center justify-between w-full py-2 hover:text-[#FF7C18] transition-colors"
                >
                  <span>Media Resources</span>
                  <span>{mobileMediaOpen ? "−" : "+"}</span>
                </button>
                <AnimatePresence mode="wait">
                  {mobileMediaOpen && (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={subMenuVariants}
                      className="pl-4 overflow-hidden"
                    >
                      <Link
                        href="https://ikorodu.nlwc.church/audio-messages/"
                        className="block py-2 hover:text-[#FF7C18] transition-colors"
                      >
                        Audio Messages
                      </Link>
                      <Link
                        href="https://nlwc.church/blog/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block py-2 hover:text-[#FF7C18] transition-colors"
                      >
                        Blog
                      </Link>
                      <Link
                        href="https://ikorodu.nlwc.church/house-fellowship/"
                        className="block py-2 hover:text-[#FF7C18] transition-colors"
                      >
                        House Fellowship
                      </Link>
                      <Link
                        href="https://ikorodu.nlwc.church/category/sunday-school-manual/"
                        className="block py-2 hover:text-[#FF7C18] transition-colors"
                      >
                        Sunday School Manual
                      </Link>
                      <Link
                        href="https://ikorodu.nlwc.church/category/message-transcripts/"
                        className="block py-2 hover:text-[#FF7C18] transition-colors"
                      >
                        Message Transcripts
                      </Link>
                      <Link
                        href="/"
                        className="block py-2 hover:text-[#FF7C18] transition-colors"
                      >
                        Image Gallery
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link
                href="https://ikorodu.nlwc.church/contact/"
                className="block py-2"
              >
                Contact
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

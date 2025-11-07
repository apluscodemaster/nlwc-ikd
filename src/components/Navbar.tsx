"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function Navbar() {
  const [openLive, setOpenLive] = useState(false);
  const [openMedia, setOpenMedia] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-30">
      <nav className="backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <Link href="/" className="inline-block">
                <Image
                  src="/logo-200-x-80.png"
                  alt="logo"
                  width={100}
                  height={80}
                  priority
                />
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              <Link
                href="https://ikorodu.nlwc.church/about/"
                className="text-white hover:underline cursor-pointer"
              >
                About Us
              </Link>

              <div className="relative">
                <button
                  onMouseEnter={() => setOpenLive(true)}
                  onMouseLeave={() => setOpenLive(false)}
                  onClick={() => setOpenLive((s) => !s)}
                  className="text-white flex items-center gap-2 cursor-pointer"
                >
                  Live Streaming
                </button>
                {openLive && (
                  <div
                    onMouseEnter={() => setOpenLive(true)}
                    onMouseLeave={() => setOpenLive(false)}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg text-gray-800"
                  >
                    <Link
                      href="https://ikorodu.nlwc.church/audio-broadcast/"
                      className="block px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      Audio Broadcast
                    </Link>
                    <Link
                      href="https://ikorodu.nlwc.church/video-broadcast/"
                      className="block px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      Video Broadcast
                    </Link>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onMouseEnter={() => setOpenMedia(true)}
                  onMouseLeave={() => setOpenMedia(false)}
                  onClick={() => setOpenMedia((s) => !s)}
                  className="text-white flex items-center gap-2 cursor-pointer"
                >
                  Media Resources
                </button>
                {openMedia && (
                  <div
                    onMouseEnter={() => setOpenMedia(true)}
                    onMouseLeave={() => setOpenMedia(false)}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg text-gray-800"
                  >
                    <Link
                      href="https://ikorodu.nlwc.church/audio-messages/"
                      className="block px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      Audio Messages
                    </Link>
                    <Link
                      href="https://nlwc.church/blog/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      Blog
                    </Link>
                    <Link
                      href="https://ikorodu.nlwc.church/house-fellowship/"
                      className="block px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      House Fellowship
                    </Link>
                    <Link
                      href="https://ikorodu.nlwc.church/category/sunday-school-manual/"
                      className="block px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      Sunday School Manual
                    </Link>
                    <Link
                      href="https://ikorodu.nlwc.church/category/message-transcripts/"
                      className="block px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      Message Transcripts
                    </Link>
                    <Link
                      href="https://ikorodu.nlwc.church/image-gallery/"
                      className="block px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      Image Gallery
                    </Link>
                  </div>
                )}
              </div>

              <Link
                href="https://ikorodu.nlwc.church/contact/"
                className="text-white hover:underline cursor-pointer"
              >
                Contact
              </Link>
            </div>

            {/* Mobile: simple menu button */}
            <div className="md:hidden">
              <Link
                href="https://ikorodu.nlwc.church/contact/"
                className="text-white cursor-pointer"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

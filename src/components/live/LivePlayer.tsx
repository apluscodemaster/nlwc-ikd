"use client";

import React from "react";
import { motion } from "framer-motion";
import { Radio, Users, Share2, Info } from "lucide-react";

export default function LivePlayer() {
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Video Container */}
      <div className="lg:col-span-2 space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl bg-black border border-white/5"
        >
          {/* Pulsing Live indicator */}
          <div className="absolute top-6 left-6 z-10 flex items-center gap-3 px-4 py-2 bg-red-600 rounded-full text-white text-xs font-black uppercase tracking-widest shadow-xl animate-pulse">
            <Radio className="w-4 h-4" />
            Live Now
          </div>

          {/* YouTube Embed Placeholder */}
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/live_stream?channel=UCmj7Ugn86LZe2vuOdv4mdSw"
            title="NLWC Ikorodu Live Stream"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full"
          ></iframe>
        </motion.div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Sunday Worship Experience
            </h1>
            <p className="text-muted-foreground font-medium">
              Started Jan 26, 2026 • 245 people watching
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="h-12 px-6 rounded-full border border-gray-100 font-bold flex items-center gap-2 hover:bg-gray-50 transition-all">
              <Users className="w-5 h-5 text-primary" />
              Join Community
            </button>
            <button className="h-12 px-6 rounded-full bg-primary text-white font-bold flex items-center gap-2 hover:scale-105 transition-all">
              <Share2 className="w-5 h-5" />
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Chat / Sidebar */}
      <div className="flex flex-col h-[600px] lg:h-auto bg-gray-50 rounded-3xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-white flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Live Community Chat</h3>
          <Info className="w-4 h-4 text-muted-foreground" />
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex-shrink-0" />
            <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-sm">
              <p className="font-bold text-primary mb-1">Sis. Esther</p>
              <p className="text-gray-700">
                Bless the Lord for this powerful word!
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex-shrink-0" />
            <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-sm">
              <p className="font-bold text-blue-600 mb-1">Bro. Segun</p>
              <p className="text-gray-700">Hallelujah!</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex-shrink-0" />
            <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-sm">
              <p className="font-bold text-orange-600 mb-1">Admin</p>
              <p className="text-gray-700">
                Welcome everyone to our service today.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border-t border-gray-100">
          <div className="relative">
            <input
              type="text"
              placeholder="Say something..."
              className="w-full h-12 pl-6 pr-12 rounded-full bg-gray-50 border-none focus:ring-2 focus:ring-primary/20 outline-none"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add missing import to the top
import { Send } from "lucide-react";

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Youtube,
  Calendar,
  Play,
  Search,
  Loader2,
  User,
  X,
  Filter,
  ChevronDown,
} from "lucide-react";

interface VideoMessage {
  date: string;
  youtubeUrl: string;
  title?: string;
  minister?: string;
  id: string;
}

export default function VideoMessagesContent() {
  const [videos, setVideos] = useState<VideoMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMinister, setSelectedMinister] = useState<string>("All");
  const [selectedVideo, setSelectedVideo] = useState<VideoMessage | null>(null);

  useEffect(() => {
    async function fetchVideos() {
      try {
        const response = await fetch("/api/video-messages");
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setVideos(data.messages);
      } catch (err) {
        setError("Unable to load video messages. Please try again later.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchVideos();
  }, []);

  // Extract unique ministers for filter
  const ministers = [
    "All",
    ...(Array.from(
      new Set(videos.map((v) => v.minister).filter(Boolean)),
    ) as string[]),
  ];

  const filteredVideos = videos.filter((v) => {
    const matchesSearch =
      v.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.date.includes(searchQuery) ||
      v.minister?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMinister =
      selectedMinister === "All" || v.minister === selectedMinister;

    return matchesSearch && matchesMinister;
  });

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-medium animate-pulse">
          Fetching latest video messages...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <Youtube className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Oops!</h3>
        <p className="text-muted-foreground max-w-xs">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Controls: Search + Filter */}
      <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto">
        {/* Search */}
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search by title, date, or minister..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 sm:h-14 pl-12 pr-4 rounded-2xl border border-gray-200 bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-gray-900 shadow-sm"
          />
        </div>

        {/* Minister Filter */}
        <div className="relative w-full md:w-64">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <select
            value={selectedMinister}
            onChange={(e) => setSelectedMinister(e.target.value)}
            className="w-full h-12 sm:h-14 pl-12 pr-10 rounded-2xl border border-gray-200 bg-white appearance-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-gray-900 shadow-sm font-medium cursor-pointer"
          >
            {ministers.map((m) => (
              <option key={m} value={m}>
                {m === "All" ? "All Ministers" : m}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {filteredVideos.map((video, index) => (
          <motion.div
            key={video.id + index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative flex flex-col bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 cursor-pointer"
            onClick={() => setSelectedVideo(video)}
          >
            {/* Video Preview */}
            <div className="relative aspect-video overflow-hidden bg-gray-900">
              <img
                src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
                alt={video.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    `https://img.youtube.com/vi/${video.id}/0.jpg`;
                }}
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />

              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-300 shadow-xl"
                >
                  <Play className="w-6 h-6 text-white fill-white ml-1" />
                </motion.div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-gray-500">
                      {video.date}
                    </span>
                  </div>
                  {video.minister && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 text-gray-600 text-[10px] font-bold uppercase tracking-wider">
                      <User className="w-3 h-3" />
                      {video.minister}
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                  {video.title}
                </h3>
              </div>

              <div className="mt-5 pt-5 border-t border-gray-50 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">
                  Video Message
                </span>
                <Youtube className="w-5 h-5 text-gray-300 group-hover:text-red-600 transition-colors" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredVideos.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
          <p className="text-muted-foreground font-medium">
            No results found matching your criteria
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedMinister("All");
            }}
            className="mt-4 text-primary font-bold hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Video Modal Popup */}
      <AnimatePresence>
        {selectedVideo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedVideo(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all hover:scale-110 active:scale-90"
              >
                <X className="w-5 h-5" />
              </button>

              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1&rel=0`}
                title={selectedVideo.title}
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />

              {/* Info Overlay (Optional, but adds premium feel) */}
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 bg-linear-to-t from-black/80 to-transparent pointer-events-none">
                <div className="max-w-3xl">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-widest">
                      Now Playing
                    </span>
                    <span className="text-white/60 text-sm font-medium">
                      {selectedVideo.date} • {selectedVideo.minister}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                    {selectedVideo.title}
                  </h2>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

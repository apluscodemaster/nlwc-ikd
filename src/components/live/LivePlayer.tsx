"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Users, Share2, Info, Send, Mail, X } from "lucide-react";

const TELEGRAM_URL = "https://bit.ly/nlwcikorodu_audio";
const PAGE_URL = "https://nlwc-ikd-gallery.vercel.app/live";
const PAGE_TITLE = "NLWC Ikorodu — Live Video Broadcast";

// Fallback embed URL from env if API fails
const FALLBACK_EMBED_URL = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID
  ? `https://www.youtube.com/embed/live_stream?channel=${process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID}`
  : "";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function XTwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function LivePlayer() {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [streamEmbedUrl, setStreamEmbedUrl] = useState(FALLBACK_EMBED_URL);
  const shareRef = useRef<HTMLDivElement>(null);

  // Fetch the live stream URL from Google Sheets
  useEffect(() => {
    async function fetchStreamUrl() {
      try {
        const res = await fetch("/api/video-stream");
        if (res.ok) {
          const data = await res.json();
          if (data.embedUrl) {
            setStreamEmbedUrl(data.embedUrl);
          }
        }
      } catch {
        // Silently fall back to env var
      }
    }
    fetchStreamUrl();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShowShareMenu(false);
      }
    }
    if (showShareMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showShareMenu]);

  const shareOptions = [
    {
      label: "WhatsApp",
      icon: <WhatsAppIcon className="w-4 h-4" />,
      color: "text-green-600 bg-green-50 hover:bg-green-100",
      href: `https://wa.me/?text=${encodeURIComponent(`${PAGE_TITLE}\n${PAGE_URL}`)}`,
    },
    {
      label: "X (Twitter)",
      icon: <XTwitterIcon className="w-4 h-4" />,
      color: "text-gray-900 bg-gray-50 hover:bg-gray-100",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(PAGE_TITLE)}&url=${encodeURIComponent(PAGE_URL)}`,
    },
    {
      label: "Facebook",
      icon: <FacebookIcon className="w-4 h-4" />,
      color: "text-blue-600 bg-blue-50 hover:bg-blue-100",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(PAGE_URL)}`,
    },
    {
      label: "Email",
      icon: <Mail className="w-4 h-4" />,
      color: "text-orange-600 bg-orange-50 hover:bg-orange-100",
      href: `mailto:?subject=${encodeURIComponent(PAGE_TITLE)}&body=${encodeURIComponent(`Watch the NLWC Ikorodu live service here:\n${PAGE_URL}`)}`,
    },
  ];

  return (
    <div className="grid lg:grid-cols-3 gap-8 lg:items-start">
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

          {/* YouTube Embed */}
          <iframe
            width="100%"
            height="100%"
            src={streamEmbedUrl}
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
          </div>
          <div className="flex items-center gap-3">
            {/* Join Community → Telegram */}
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 px-6 rounded-full border border-gray-100 font-bold flex items-center gap-2 hover:bg-gray-50 transition-all"
            >
              <Users className="w-5 h-5 text-primary" />
              Join Community
            </a>

            {/* Share Dropdown */}
            <div className="relative" ref={shareRef}>
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="h-12 px-6 rounded-full bg-primary text-white font-bold flex items-center gap-2 hover:scale-105 transition-all"
              >
                {showShareMenu ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Share2 className="w-5 h-5" />
                )}
                Share
              </button>

              <AnimatePresence>
                {showShareMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
                  >
                    <div className="p-2 space-y-1">
                      {shareOptions.map((option) => (
                        <a
                          key={option.label}
                          href={option.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setShowShareMenu(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${option.color}`}
                        >
                          {option.icon}
                          {option.label}
                        </a>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Chat / Sidebar — wrapped in a relative container so the chat
         can be absolutely positioned and never push the grid row taller */}
      <div className="relative h-[600px] lg:h-auto lg:self-stretch">
        <div className="lg:absolute lg:inset-0">
          <LiveChat />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// LIVE CHAT COMPONENT
// =============================================================================

interface ChatMessage {
  id: string;
  name: string;
  message: string;
  timestamp: number;
  color: string;
}

function formatChatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function LiveChat() {
  const [userName, setUserName] = useState("");
  const [hasSetName, setHasSetName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastFetchTimestamp = useRef(0);

  // Load saved name from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("nlwc-chat-name");
    if (saved) {
      setUserName(saved);
      setHasSetName(true);
    }
  }, []);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    async function fetchMessages() {
      try {
        const url = lastFetchTimestamp.current
          ? `/api/live-chat?since=${lastFetchTimestamp.current}`
          : "/api/live-chat";
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();

        if (lastFetchTimestamp.current === 0) {
          // Initial load — replace all
          setChatMessages(data.messages);
        } else if (data.messages.length > 0) {
          // Append new messages
          setChatMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newMsgs = data.messages.filter(
              (m: ChatMessage) => !existingIds.has(m.id),
            );
            return [...prev, ...newMsgs];
          });
        }

        if (data.messages.length > 0) {
          lastFetchTimestamp.current =
            data.messages[data.messages.length - 1].timestamp;
        } else if (data.serverTime) {
          lastFetchTimestamp.current = data.serverTime;
        }
      } catch {
        // Silently fail — chat is non-critical
      }
    }

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current && chatContainerRef.current) {
      const container = chatContainerRef.current;
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        120;
      if (isNearBottom) {
        chatEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [chatMessages]);

  const handleSetName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setUserName(trimmed);
    setHasSetName(true);
    localStorage.setItem("nlwc-chat-name", trimmed);
  };

  const handleSend = async () => {
    if (!messageInput.trim() || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/live-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: userName, message: messageInput.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [...prev, data.message]);
        lastFetchTimestamp.current = data.message.timestamp;
        setMessageInput("");
      }
    } catch {
      // Silently fail
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!hasSetName) {
        handleSetName();
      } else {
        handleSend();
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-3xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-gray-900">Live Community Chat</h3>
          <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full font-medium">
            {chatMessages.length}
          </span>
        </div>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Info banner */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-3 bg-primary/5 border-b border-primary/10 text-xs text-muted-foreground leading-relaxed">
              💬 Messages are visible to all visitors and automatically cleared
              after 24 hours. Be respectful and stay blessed!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div
        ref={chatContainerRef}
        className="flex-1 p-5 overflow-y-auto space-y-3"
      >
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Send className="w-7 h-7 text-primary/40" />
            </div>
            <p className="text-sm font-semibold text-gray-500">
              No messages yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Be the first to say something during the service!
            </p>
          </div>
        ) : (
          chatMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex gap-3"
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: msg.color }}
              >
                {msg.name.charAt(0).toUpperCase()}
              </div>
              <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-sm flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p
                    className="font-bold text-sm truncate"
                    style={{ color: msg.color }}
                  >
                    {msg.name}
                  </p>
                  <span className="text-[10px] text-gray-400 shrink-0">
                    {formatChatTime(msg.timestamp)}
                  </span>
                </div>
                <p className="text-gray-700 wrap-break-word">{msg.message}</p>
              </div>
            </motion.div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        {!hasSetName ? (
          /* Name Entry */
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium text-center">
              Enter your name to join the chat
            </p>
            <div className="relative">
              <input
                type="text"
                placeholder="Your name (e.g. Bro. John)"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={30}
                className="w-full h-12 pl-6 pr-24 rounded-full bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
              />
              <button
                onClick={handleSetName}
                disabled={!nameInput.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-4 rounded-full bg-primary text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
              >
                Join Chat
              </button>
            </div>
          </div>
        ) : (
          /* Message Input */
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] text-muted-foreground">
                Chatting as{" "}
                <span className="font-bold text-gray-700">{userName}</span>
              </p>
              <button
                onClick={() => {
                  setHasSetName(false);
                  setNameInput(userName);
                  localStorage.removeItem("nlwc-chat-name");
                }}
                className="text-[10px] text-primary hover:underline font-medium"
              >
                Change name
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Say something..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={500}
                className="w-full h-12 pl-6 pr-12 rounded-full bg-gray-50 border-none focus:ring-2 focus:ring-primary/20 outline-none text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!messageInput.trim() || isSending}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

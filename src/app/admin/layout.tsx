"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  BookOpen,
  Church,
  Menu,
  X,
  LayoutDashboard,
  ExternalLink,
  Loader2,
  Lock,
  LogOut,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  MessageCircleHeart,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ──────────────────────────────────────────────
// Auth Context — shared across all /admin routes
// ──────────────────────────────────────────────
const AdminAuthContext = createContext<{
  user: User | null;
  logout: () => void;
}>({
  user: null,
  logout: () => {},
});

export const useAdminAuth = () => useContext(AdminAuthContext);

// ──────────────────────────────────────────────
// Nav items
// ──────────────────────────────────────────────
const NAV_ITEMS = [
  {
    label: "Church Content",
    href: "/admin",
    icon: Church,
    description: "Sermons, Transcripts & Manuals",
  },
  {
    label: "Devotionals",
    href: "/admin/devotionals",
    icon: BookOpen,
    description: "Daily Devotionals Management",
  },
  {
    label: "Testimonies",
    href: "/admin/testimonies",
    icon: MessageCircleHeart,
    description: "Review & Verify Testimonies",
  },
];

// ──────────────────────────────────────────────
// Firebase error messages
// ──────────────────────────────────────────────
interface FirebaseAuthError {
  code?: string;
  message?: string;
}

function getFriendlyErrorMessage(err: FirebaseAuthError): string {
  const code = err?.code;
  const message = err?.message || "";

  switch (code) {
    case "auth/invalid-email":
      return "The email address is not valid. Please check and try again.";
    case "auth/user-disabled":
      return "This administrator account has been disabled.";
    case "auth/user-not-found":
      return "No account found with this email address.";
    case "auth/wrong-password":
      return "The password you entered is incorrect.";
    case "auth/invalid-credential":
      return "Invalid login credentials. Please check your email and password.";
    case "auth/too-many-requests":
      return "Too many failed login attempts. Please try again in a few minutes.";
    case "auth/operation-not-allowed":
      return "This sign-in method is currently disabled.";
    case "auth/popup-closed-by-user":
      return "The login window was closed before completion.";
    case "auth/cancelled-popup-request":
      return "The login request was cancelled. Please try again.";
    case "auth/network-request-failed":
      return "A network error occurred. Please check your internet connection.";
    case "auth/internal-error":
      return "An internal server error occurred. Please try again later.";
    default:
      if (message.includes("Firebase:")) {
        return message.split("Firebase:")[1].split("(")[0].trim();
      }
      return "An unexpected error occurred during login. Please try again.";
  }
}

// ══════════════════════════════════════════════
// Layout
// ══════════════════════════════════════════════
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Auth state ──
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChecking(false);
    });
    return unsub;
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      setLoginError(getFriendlyErrorMessage(err as FirebaseAuthError));
    } finally {
      setLoggingIn(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  // ════════════════════════════════════════════
  // Loading State
  // ════════════════════════════════════════════
  if (checking) {
    return (
      <div className="-mt-16 min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">Checking access…</p>
      </div>
    );
  }

  // ════════════════════════════════════════════
  // Login Gate — blocks ALL /admin/* routes
  // ════════════════════════════════════════════
  if (!user) {
    return (
      <div className="-mt-16 min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 via-white to-primary/5 p-4">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="rounded-3xl border border-gray-100 bg-white shadow-2xl shadow-primary/5 overflow-hidden">
            {/* Top accent */}
            <div className="h-1.5 bg-linear-to-r from-primary via-amber-400 to-primary" />

            <div className="p-8 sm:p-10">
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
              </div>

              <h1 className="text-2xl font-bold text-center text-gray-900 mb-1">
                Admin Access
              </h1>
              <p className="text-sm text-center text-muted-foreground mb-8">
                Sign in to manage church content
              </p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      placeholder="admin@nlwc.church"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-12 pl-11 pr-12 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {loginError && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl"
                    >
                      {loginError}
                    </motion.p>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loggingIn}
                  className="w-full h-12 rounded-xl bg-primary cursor-pointer text-white font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loggingIn ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  {loggingIn ? "Signing in…" : "Sign In"}
                </button>
              </form>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            <Link href="/" className="hover:text-primary transition-colors">
              ← Back to website
            </Link>
          </p>
        </motion.div>
      </div>
    );
  }

  // ════════════════════════════════════════════
  // Authenticated Layout — sidebar + content
  // ════════════════════════════════════════════
  return (
    <AdminAuthContext.Provider value={{ user, logout }}>
      <div className="-mt-16 min-h-screen bg-gray-50 flex">
        {/* ── Desktop Sidebar ── */}
        <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-gray-100 fixed inset-y-0 left-0 z-40">
          {/* Brand */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-100">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-primary to-amber-500 flex items-center justify-center shadow-lg shadow-primary/20">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight">
                NLWC Admin
              </p>
              <p className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">
                Content Hub
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-3 py-5 space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                    active
                      ? "bg-primary/10 text-primary font-semibold shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon
                    className={`w-5 h-5 ${active ? "text-primary" : "text-gray-400 group-hover:text-gray-600"}`}
                  />
                  <div>
                    <p className="leading-tight">{item.label}</p>
                    <p
                      className={`text-[11px] mt-0.5 ${active ? "text-primary/60" : "text-gray-400"}`}
                    >
                      {item.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* User info + footer */}
          <div className="p-4 border-t border-gray-100 space-y-3">
            {/* Logged-in user */}
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                {user.email?.charAt(0).toUpperCase() || "A"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate">
                  {user.email}
                </p>
                <p className="text-[10px] text-gray-400">Administrator</p>
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            <a
              href="/wp-admin"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              WordPress Dashboard
            </a>
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
            >
              ← Back to Website
            </Link>
          </div>
        </aside>

        {/* ── Mobile Top Bar ── */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-white/90 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-primary to-amber-500 flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900">NLWC Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={logout}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5 text-gray-600" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* ── Mobile Sidebar Overlay ── */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 bg-black z-40"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl"
              >
                <div className="h-14 flex items-center justify-between px-5 border-b border-gray-100">
                  <span className="text-sm font-bold text-gray-900">
                    Navigation
                  </span>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <nav className="px-3 py-4 space-y-1">
                  {NAV_ITEMS.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                          active
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 space-y-2">
                  <p className="text-xs text-gray-400 truncate px-1">
                    {user.email}
                  </p>
                  <Link
                    href="/"
                    className="text-xs text-gray-500 hover:text-primary transition-colors"
                  >
                    ← Back to Website
                  </Link>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ── Main Content ── */}
        <main className="flex-1 min-w-0 lg:ml-72 pt-14 lg:pt-0 min-h-screen overflow-x-hidden">
          {children}
        </main>
      </div>
    </AdminAuthContext.Provider>
  );
}

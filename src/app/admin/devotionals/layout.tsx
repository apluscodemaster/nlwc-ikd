"use client";

import React, { useEffect, useState, createContext, useContext } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
  getAdditionalUserInfo,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Lock,
  LogOut,
  BookOpen,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";

// ──────────────────────────────────────────────
// Auth Context
// ──────────────────────────────────────────────
const AuthContext = createContext<{ user: User | null; logout: () => void }>({
  user: null,
  logout: () => {},
});

export const useAdminAuth = () => useContext(AuthContext);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [googleLoggingIn, setGoogleLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChecking(false);
    });
    return unsub;
  }, []);

  interface FirebaseAuthError {
    code?: string;
    message?: string;
  }

  const getFriendlyErrorMessage = (err: FirebaseAuthError): string => {
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
        // Attempt to clean up raw firebase messages if code isn't matched
        if (message.includes("Firebase:")) {
          return message.split("Firebase:")[1].split("(")[0].trim();
        }
        return "An unexpected error occurred during login. Please try again.";
    }
  };

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

  const handleGoogleLogin = async () => {
    setLoginError("");
    setGoogleLoggingIn(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const additionalInfo = getAdditionalUserInfo(result);

      if (additionalInfo?.isNewUser) {
        // Sign out immediately if the user was just created (not pre-existing)
        await signOut(auth);
        setLoginError(
          "Access Denied: This account is not registered as an administrator. Please contact the system owner.",
        );
      }
    } catch (err: unknown) {
      setLoginError(getFriendlyErrorMessage(err as FirebaseAuthError));
    } finally {
      setGoogleLoggingIn(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  // ── Loading ──
  if (checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">Checking access...</p>
      </div>
    );
  }

  // ── Login Gate ──
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
                Sign in to manage devotional content
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
                  disabled={loggingIn || googleLoggingIn}
                  className="w-full h-12 rounded-xl bg-primary cursor-pointer text-white font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loggingIn ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  {loggingIn ? "Signing in..." : "Sign In"}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs font-medium text-muted-foreground">
                  or continue with
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Google Sign-In */}
              <button
                onClick={handleGoogleLogin}
                disabled={googleLoggingIn || loggingIn}
                className="w-full h-12 rounded-xl border cursor-pointer border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700 shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {googleLoggingIn ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                {googleLoggingIn ? "Signing in..." : "Sign in with Google"}
              </button>
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

  // ── Authenticated Layout ──
  return (
    <AuthContext.Provider value={{ user, logout }}>
      <div className="-mt-16 min-h-screen bg-gray-50 flex flex-col">
        {/* Admin Top Bar */}
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-bold text-gray-900">
                Devotional Admin
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground hidden sm:block">
                {user.email}
              </span>
              <button
                onClick={logout}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-600 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {children}
      </div>
    </AuthContext.Provider>
  );
}

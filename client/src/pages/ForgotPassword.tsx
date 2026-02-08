import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Sprout, Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.message || "Failed to send reset link");
      }
    } catch {
      setError("Connection error");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-violet-500/8 rounded-full blur-3xl -translate-x-1/2" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <Link href="/login">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white mb-4">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-3xl">🌱</span>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">PlantaTON</h1>
          </div>
          <p className="text-xl text-slate-300 font-medium">🔑 Reset Password</p>
          <p className="text-sm text-slate-500 mt-1">We'll help you get back in! 💪</p>
        </div>

        <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-xl">
          {success ? (
            <div className="text-center space-y-4">
              <span className="text-5xl block">📧</span>
              <h3 className="text-lg font-bold text-white">Check Your Email! ✉️</h3>
              <p className="text-sm text-slate-400">
                If an account with that email exists, we've sent a password reset link. Please check your email.
              </p>
              <Link href="/login">
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 mt-2">
                  🔑 Back to Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <p className="text-sm text-slate-400">📧 Enter your email address and we'll send you a link to reset your password.</p>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">📧 Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold text-base rounded-xl shadow-lg shadow-emerald-500/20"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "📨 Send Reset Link"}
              </Button>

              <p className="text-center text-sm text-slate-400">
                Remember your password?{" "}
                <Link href="/login">
                  <span className="text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer">🔑 Log In</span>
                </Link>
              </p>
            </form>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 mt-4">
          <span className="text-xs text-slate-600 flex items-center gap-1">🔒 Secure</span>
          <span className="text-slate-700">•</span>
          <span className="text-xs text-slate-600 flex items-center gap-1">⚡ Fast Recovery</span>
        </div>
      </motion.div>
    </div>
  );
}

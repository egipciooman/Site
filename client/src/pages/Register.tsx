import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Sprout, Mail, Lock, User, Gift, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/AuthProvider";

declare global {
  interface Window {
    grecaptcha: any;
    onRecaptchaLoad: () => void;
  }
}

export default function Register() {
  const { register } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaConfig, setCaptchaConfig] = useState<{ enabled: boolean; siteKey: string | null }>({ enabled: false, siteKey: null });
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const captchaRef = useRef<HTMLDivElement>(null);
  const captchaRendered = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) setReferralCode(ref);
  }, []);

  useEffect(() => {
    fetch("/api/auth/captcha/config").then(r => r.json()).then(setCaptchaConfig).catch(() => {});
    fetch("/api/auth/google/status").then(r => r.json()).then(d => setGoogleEnabled(d.enabled)).catch(() => {});
  }, []);

  const renderCaptcha = useCallback(() => {
    if (captchaConfig.enabled && captchaConfig.siteKey && captchaRef.current && window.grecaptcha && !captchaRendered.current) {
      captchaRendered.current = true;
      window.grecaptcha.render(captchaRef.current, {
        sitekey: captchaConfig.siteKey,
        theme: "dark",
        callback: (token: string) => setCaptchaToken(token),
        "expired-callback": () => setCaptchaToken(null),
      });
    }
  }, [captchaConfig]);

  useEffect(() => {
    if (!captchaConfig.enabled || !captchaConfig.siteKey) return;

    if (window.grecaptcha && window.grecaptcha.render) {
      renderCaptcha();
      return;
    }

    window.onRecaptchaLoad = () => {
      renderCaptcha();
    };

    const existing = document.querySelector('script[src*="recaptcha"]');
    if (!existing) {
      const script = document.createElement("script");
      script.src = "https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, [captchaConfig, renderCaptcha]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (captchaConfig.enabled && !captchaToken) {
      setError("Please complete the CAPTCHA");
      return;
    }

    setIsSubmitting(true);
    const result = await register({
      email,
      password,
      confirmPassword,
      username,
      referralCode: referralCode || undefined,
      captchaToken: captchaToken || undefined,
    });

    if (result.success) {
      setLocation("/");
    } else {
      setError(result.message || "Registration failed");
      if (captchaConfig.enabled && window.grecaptcha) {
        window.grecaptcha.reset();
        setCaptchaToken(null);
      }
    }
    setIsSubmitting(false);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const ref = referralCode ? `&ref=${encodeURIComponent(referralCode)}` : "";
      const res = await fetch(`/api/auth/google/url?${ref}`);
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Google sign-in is not available");
        setGoogleLoading(false);
      }
    } catch {
      setError("Failed to connect to Google");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-8">
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
        <Link href="/landing">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white mb-4">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>

        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-3xl">🌱</span>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">PlantaTON</h1>
          </div>
          <p className="text-xl text-slate-300 font-medium">Join the Farm! 🚀</p>
          <div className="inline-flex items-center gap-1.5 mt-2 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
            <span className="text-sm">🎁</span>
            <span className="text-xs font-bold text-emerald-400">Free to Join</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-xl space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {googleEnabled && (
            <>
              <Button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full h-12 bg-white hover:bg-gray-100 text-gray-800 font-medium text-base rounded-xl flex items-center justify-center gap-3"
              >
                {googleLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Sign up with Google
                  </>
                )}
              </Button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-600" />
                <span className="text-sm text-slate-500">or</span>
                <div className="flex-1 h-px bg-slate-600" />
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">👤 Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500"
                required
                minLength={2}
              />
            </div>
          </div>

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

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">🔑 Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500"
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">🔐 Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500"
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">🎁 Referral Code <span className="text-slate-500">(optional)</span></label>
            <div className="relative">
              <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="Enter referral code"
                className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500"
              />
            </div>
          </div>

          {captchaConfig.enabled && (
            <div className="flex justify-center">
              <div ref={captchaRef} />
            </div>
          )}

          <motion.div
            animate={{ scale: [1, 1.01, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold text-base rounded-xl shadow-lg shadow-emerald-500/20"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "🚀 Create Account"}
            </Button>
          </motion.div>

          <p className="text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link href="/login">
              <span className="text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer">🔑 Log In</span>
            </Link>
          </p>
        </form>

        <div className="flex items-center justify-center gap-3 mt-4">
          <span className="text-xs text-slate-600 flex items-center gap-1">🔒 Secure</span>
          <span className="text-slate-700">•</span>
          <span className="text-xs text-slate-600 flex items-center gap-1">🎁 Free</span>
          <span className="text-slate-700">•</span>
          <span className="text-xs text-slate-600 flex items-center gap-1">⚡ Instant</span>
        </div>
      </motion.div>
    </div>
  );
}

import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { Decimal } from "decimal.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { Resend } from "resend";
import helmet from "helmet";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function rateLimit(windowMs: number, maxRequests: number) {
  return (req: any, res: any, next: any) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const entry = rateLimitMap.get(key);
    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (entry.count >= maxRequests) {
      return res.status(429).json({ message: "Too many requests, please try again later" });
    }
    entry.count++;
    next();
  };
}
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}, 60000);

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const SENDER_EMAIL = process.env.SENDER_EMAIL || "PlantaTON <onboarding@resend.dev>";

async function sendEmail(to: string, subject: string, html: string) {
  if (!resend) {
    console.log(`[EMAIL] No RESEND_API_KEY configured. Would send to ${to}: ${subject}`);
    return false;
  }
  try {
    await resend.emails.send({
      from: SENDER_EMAIL,
      to,
      subject,
      html,
    });
    console.log(`[EMAIL] Sent "${subject}" to ${to}`);
    return true;
  } catch (err) {
    console.error(`[EMAIL] Failed to send to ${to}:`, err);
    return false;
  }
}

async function sendVerificationEmail(to: string, code: string) {
  return sendEmail(to, "PlantaTON - Verify Your Email", `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: #1e293b; color: #e2e8f0; border-radius: 16px;">
      <h1 style="color: #34d399; text-align: center;">🌱 PlantaTON</h1>
      <p style="text-align: center; font-size: 18px;">Your verification code is:</p>
      <div style="text-align: center; padding: 20px; background: #0f172a; border-radius: 12px; margin: 20px 0;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #34d399;">${code}</span>
      </div>
      <p style="text-align: center; color: #94a3b8; font-size: 14px;">This code expires in 15 minutes.</p>
    </div>
  `);
}

async function sendPasswordResetEmail(to: string, resetUrl: string) {
  return sendEmail(to, "PlantaTON - Reset Your Password", `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: #1e293b; color: #e2e8f0; border-radius: 16px;">
      <h1 style="color: #34d399; text-align: center;">🌱 PlantaTON</h1>
      <p style="text-align: center; font-size: 18px;">Click the button below to reset your password:</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #10b981, #06b6d4); color: white; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px;">Reset Password</a>
      </div>
      <p style="text-align: center; color: #94a3b8; font-size: 14px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    </div>
  `);
}

async function verifyRecaptcha(token: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    console.log("[CAPTCHA] No RECAPTCHA_SECRET_KEY configured, skipping verification");
    return true;
  }
  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${secretKey}&response=${token}`,
    });
    const data = await response.json() as { success: boolean };
    return data.success;
  } catch (err) {
    console.error("[CAPTCHA] Verification error:", err);
    return false;
  }
}

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleOAuthClient = googleClientId ? new OAuth2Client(googleClientId) : null;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

  const requireUser = async (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const banned = await storage.isUserBanned(req.session.userId);
    if (banned) {
      return res.status(403).json({ message: "Your account has been suspended" });
    }
    next();
  };

  function generateReferralCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // ============== AUTH ENDPOINTS ==============

  app.post("/api/auth/register", rateLimit(60000, 5), async (req, res) => {
    try {
      const { email, password, confirmPassword, username, referralCode, captchaToken } = req.body;

      if (process.env.RECAPTCHA_SECRET_KEY) {
        if (!captchaToken) {
          return res.status(400).json({ message: "Please complete the CAPTCHA" });
        }
        const captchaValid = await verifyRecaptcha(captchaToken);
        if (!captchaValid) {
          return res.status(400).json({ message: "CAPTCHA verification failed. Please try again." });
        }
      }

      if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      if (!password || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }
      if (!username || typeof username !== 'string' || username.trim().length < 2) {
        return res.status(400).json({ message: "Username must be at least 2 characters" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email is already registered" });
      }

      const existingUsername = await storage.getUserByUsername(username.trim());
      if (existingUsername) {
        return res.status(400).json({ message: "Username is already taken" });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);

      let newRefCode = generateReferralCode();
      while (await storage.getUserByReferralCode(newRefCode)) {
        newRefCode = generateReferralCode();
      }

      let referrerId: number | undefined;
      if (referralCode) {
        let referrer = await storage.getUserByReferralCode(referralCode);
        if (!referrer) {
          const refId = parseInt(referralCode, 10);
          if (!isNaN(refId)) {
            referrer = await storage.getUser(refId);
          }
        }
        if (!referrer) {
          referrer = await storage.getUserByUsername(referralCode);
        }
        if (referrer) {
          referrerId = referrer.id;
          console.log(`[REFERRAL] New user ${username} referred by user ${referrer.id} (code: ${referralCode})`);
        }
      }

      const user = await storage.createUserWithEmail({
        email: email.toLowerCase(),
        username: username.trim(),
        passwordHash,
        verificationCode,
        verificationCodeExpires,
        referralCode: newRefCode,
        referredBy: referrerId,
      });

      await storage.initializePlots(user.id);

      (req.session as any).userId = user.id;

      storage.trackLogin(user.id, req.ip || req.headers['x-forwarded-for']?.toString() || null, req.headers['user-agent'] || null, req.body.fingerprint || null, 'register');

      await sendVerificationEmail(email, verificationCode);
      console.log(`[AUTH] Verification code for ${email}: ${verificationCode}`);

      res.json({
        success: true,
        message: "Account created. Check your email for verification code.",
        requiresVerification: true,
      });
    } catch (err) {
      console.error("Register error:", err);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", rateLimit(60000, 10), async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      (req.session as any).userId = user.id;

      storage.trackLogin(user.id, req.ip || req.headers['x-forwarded-for']?.toString() || null, req.headers['user-agent'] || null, req.body.fingerprint || null, 'login');

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          emailVerified: user.emailVerified,
          balance: user.balance,
        },
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/verify-email", rateLimit(60000, 5), requireUser, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { code } = req.body;

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (user.emailVerified) {
        return res.json({ success: true, message: "Email already verified" });
      }

      if (!user.verificationCode || user.verificationCode !== code) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      if (user.verificationCodeExpires && new Date() > new Date(user.verificationCodeExpires)) {
        return res.status(400).json({ message: "Verification code has expired. Please request a new one." });
      }

      await storage.verifyUserEmail(userId);

      res.json({ success: true, message: "Email verified successfully" });
    } catch (err) {
      console.error("Verify email error:", err);
      res.status(500).json({ message: "Verification failed" });
    }
  });

  app.post("/api/auth/resend-verification", rateLimit(60000, 3), requireUser, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (user.emailVerified) {
        return res.json({ success: true, message: "Email already verified" });
      }

      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 15 * 60 * 1000);

      await storage.updateVerificationCode(userId, verificationCode, expires);

      if (user.email) {
        await sendVerificationEmail(user.email, verificationCode);
      }
      console.log(`[AUTH] Resend verification code for ${user.email}: ${verificationCode}`);

      res.json({ success: true, message: "Verification code sent" });
    } catch (err) {
      console.error("Resend verification error:", err);
      res.status(500).json({ message: "Failed to resend verification code" });
    }
  });

  app.post("/api/auth/forgot-password", rateLimit(60000, 3), async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (user) {
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 60 * 60 * 1000);

        await storage.setResetToken(user.id, resetToken, expires);

        const baseUrl = process.env.WEBAPP_URL || `https://${process.env.REPLIT_DEV_DOMAIN || 'localhost:5000'}`;
        const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
        await sendPasswordResetEmail(email, resetUrl);
        console.log(`[AUTH] Password reset token for ${email}: ${resetToken}`);
      }

      res.json({ success: true, message: "If that email exists, a reset link has been sent" });
    } catch (err) {
      console.error("Forgot password error:", err);
      res.status(500).json({ message: "Failed to process request" });
    }
  });

  app.post("/api/auth/reset-password", rateLimit(60000, 5), async (req, res) => {
    try {
      const { token, password, confirmPassword } = req.body;

      if (!token) {
        return res.status(400).json({ message: "Reset token is required" });
      }
      if (!password || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      const user = await storage.getUserByResetToken(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      if (user.resetTokenExpires && new Date() > new Date(user.resetTokenExpires)) {
        return res.status(400).json({ message: "Reset token has expired" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      await storage.updatePassword(user.id, passwordHash);

      res.json({ success: true, message: "Password reset successfully" });
    } catch (err) {
      console.error("Reset password error:", err);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.get("/api/auth/session", async (req, res) => {
    try {
      if (req.session?.userId) {
        const user = await storage.getUser((req.session as any).userId);
        if (user) {
          return res.json({
            authenticated: true,
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              emailVerified: user.emailVerified,
              balance: user.balance,
            },
          });
        }
      }
      res.json({ authenticated: false });
    } catch (err) {
      res.json({ authenticated: false });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      req.session.destroy((err: any) => {
        if (err) {
          return res.status(500).json({ message: "Logout failed" });
        }
        res.json({ success: true });
      });
    } catch (err) {
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // ============== GOOGLE OAUTH ENDPOINTS ==============

  app.get("/api/auth/google/url", (req, res) => {
    if (!googleClientId || !googleClientSecret) {
      return res.status(503).json({ message: "Google sign-in is not configured" });
    }

    const baseUrl = process.env.WEBAPP_URL || `https://${process.env.REPLIT_DEV_DOMAIN || 'localhost:5000'}`;
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    const state = crypto.randomBytes(16).toString('hex');
    (req.session as any).oauthState = state;

    const referralCode = req.query.ref as string;
    if (referralCode) {
      (req.session as any).oauthReferral = referralCode;
    }

    const url = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(googleClientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent('openid email profile')}` +
      `&state=${state}` +
      `&access_type=offline` +
      `&prompt=select_account`;

    res.json({ url });
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      if (!googleClientId || !googleClientSecret) {
        return res.redirect("/login?error=google_not_configured");
      }

      const { code, state } = req.query;

      if (!code || typeof code !== 'string') {
        return res.redirect("/login?error=no_code");
      }

      const savedState = (req.session as any).oauthState;
      if (!state || !savedState || state !== savedState) {
        delete (req.session as any).oauthState;
        return res.redirect("/login?error=oauth_failed");
      }

      const baseUrl = process.env.WEBAPP_URL || `https://${process.env.REPLIT_DEV_DOMAIN || 'localhost:5000'}`;
      const redirectUri = `${baseUrl}/api/auth/google/callback`;

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: googleClientId,
          client_secret: googleClientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      const tokenData = await tokenRes.json() as { id_token?: string; error?: string };
      if (!tokenData.id_token) {
        console.error("[GOOGLE] Token exchange failed:", tokenData);
        return res.redirect("/login?error=token_failed");
      }

      const ticket = await googleOAuthClient!.verifyIdToken({
        idToken: tokenData.id_token,
        audience: googleClientId,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return res.redirect("/login?error=no_email");
      }

      const googleId = payload.sub;
      const email = payload.email;
      const firstName = payload.given_name || "";
      const photoUrl = payload.picture || "";

      let user = await storage.getUserByGoogleId(googleId);

      if (!user) {
        user = await storage.getUserByEmail(email);
        if (user) {
          await storage.linkGoogleAccount(user.id, googleId);
        } else {
          let username = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "");
          const existingUsername = await storage.getUserByUsername(username);
          if (existingUsername) {
            username = username + "_" + Math.floor(Math.random() * 9999);
          }

          let refCode = generateReferralCode();
          while (await storage.getUserByReferralCode(refCode)) {
            refCode = generateReferralCode();
          }

          let referrerId: number | undefined;
          const oauthReferral = (req.session as any).oauthReferral;
          if (oauthReferral) {
            let referrer = await storage.getUserByReferralCode(oauthReferral);
            if (!referrer) {
              const refId = parseInt(oauthReferral, 10);
              if (!isNaN(refId)) referrer = await storage.getUser(refId);
            }
            if (!referrer) referrer = await storage.getUserByUsername(oauthReferral);
            if (referrer) referrerId = referrer.id;
          }

          user = await storage.createUserWithGoogle({
            googleId,
            email,
            username,
            firstName,
            photoUrl,
            referralCode: refCode,
            referredBy: referrerId,
          });

          await storage.initializePlots(user.id);
        }
      }

      (req.session as any).userId = user.id;

      storage.trackLogin(user.id, req.ip || req.headers['x-forwarded-for']?.toString() || null, req.headers['user-agent'] || null, null, 'google');

      delete (req.session as any).oauthState;
      delete (req.session as any).oauthReferral;

      res.redirect("/");
    } catch (err) {
      console.error("[GOOGLE] OAuth callback error:", err);
      res.redirect("/login?error=oauth_failed");
    }
  });

  app.get("/api/auth/google/status", (req, res) => {
    res.json({ enabled: !!googleClientId });
  });

  app.get("/api/auth/captcha/config", (req, res) => {
    const siteKey = process.env.RECAPTCHA_SITE_KEY;
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const enabled = !!(siteKey && secretKey);
    res.json({ enabled, siteKey: enabled ? siteKey : null });
  });

  // INIT / LOGIN (Development fallback)
  app.post(api.game.unlock.path, async (req, res) => {
    try {
      const body = api.game.unlock.input.parse(req.body);
      const username = body.username;
      const refCode = body.referralCode;
      
      let user = await storage.getUserByUsername(username);
      if (!user) {
        let referrerId: number | undefined;
        if (refCode) {
          let referrer = await storage.getUserByTelegramId(refCode);
          if (!referrer) {
            const refId = parseInt(refCode, 10);
            if (!isNaN(refId)) {
              referrer = await storage.getUser(refId);
            }
          }
          if (!referrer) {
            referrer = await storage.getUserByReferralCode(refCode);
          }
          
          if (referrer) {
            referrerId = referrer.id;
            console.log(`[REFERRAL] New user ${username} referred by user ${referrer.id} (code: ${refCode})`);
          }
        }
        
        let newRefCode = generateReferralCode();
        while (await storage.getUserByReferralCode(newRefCode)) {
          newRefCode = generateReferralCode();
        }
        
        user = await storage.createUser({ 
          username, 
          balance: "0",
          referralCode: newRefCode,
          referredBy: referrerId,
          completedHarvests: 0,
          referralBonusClaimed: false,
        });
        await storage.initializePlots(user.id);
      } else if (!user.referralCode) {
        let newRefCode = generateReferralCode();
        while (await storage.getUserByReferralCode(newRefCode)) {
          newRefCode = generateReferralCode();
        }
        user = await storage.updateUserReferralCode(user.id, newRefCode);
      }
      
      (req.session as any).userId = user.id;
      
      res.json(user);
    } catch (err) {
      console.error("Init error:", err);
      res.status(500).json({ message: "Failed to init game" });
    }
  });

  // GET STATE
  app.get(api.game.state.path, requireUser, async (req, res) => {
    const userId = (req.session as any).userId;
    const user = await storage.getUser(userId);
    const plots = await storage.getPlots(userId);
    
    if (!user) return res.status(404).json({ message: "User not found" });
    
    res.json({ user, plots });
  });

  // GET PUBLIC GAME SETTINGS (box times/rewards for frontend display)
  app.get("/api/game/settings", async (req, res) => {
    try {
      const adminSettings = await storage.getAdminSettings();
      res.json({ 
        boxes: adminSettings.boxes,
        growthTimeSeconds: adminSettings.growthTimeSeconds,
        harvestReward: adminSettings.harvestReward
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to get settings" });
    }
  });

  // PLANT
  app.post(api.game.plant.path, rateLimit(5000, 10), requireUser, async (req, res) => {
    const userId = (req.session as any).userId;
    const { plotIndex } = api.game.plant.input.parse(req.body);
    
    const plot = await storage.getPlot(userId, plotIndex);
    if (!plot) return res.status(404).json({ message: "Plot not found" });
    
    if (plot.status !== "empty") {
      return res.status(400).json({ message: "Plot is not empty" });
    }
    
    const updated = await storage.updatePlot(plot.id, {
      status: "growing",
      plantedAt: new Date(),
    });
    
    res.json(updated);
  });

  app.post(api.game.harvest.path, rateLimit(5000, 10), requireUser, async (req, res) => {
    const userId = (req.session as any).userId;
    const { plotIndex } = api.game.harvest.input.parse(req.body);
    
    const plot = await storage.getPlot(userId, plotIndex);
    if (!plot) return res.status(404).json({ message: "Plot not found" });
    
    if (plot.status !== "growing") {
      return res.status(400).json({ message: "Nothing to harvest" });
    }
    
    const adminSettings = await storage.getAdminSettings();
    const boxSettings = adminSettings.boxes[plotIndex] || { 
      growthTimeSeconds: adminSettings.growthTimeSeconds, 
      harvestReward: adminSettings.harvestReward 
    };
    
    const now = new Date();
    const plantedAt = plot.plantedAt ? new Date(plot.plantedAt) : now;
    const diffSeconds = (now.getTime() - plantedAt.getTime()) / 1000;
    
    if (diffSeconds < boxSettings.growthTimeSeconds) {
      return res.status(400).json({ message: "Not ready yet", code: "TOO_EARLY" });
    }
    
    const updatedPlot = await storage.updatePlot(plot.id, {
      status: "empty",
      plantedAt: null,
    });
    
    const reward = boxSettings.harvestReward;
    
    const user = await storage.getUser(userId);
    if (!user) throw new Error("User missing");
    
    const newBalance = new Decimal(user.balance).plus(reward).toString();
    const updatedUser = await storage.updateUserBalance(userId, newBalance);
    
    const newHarvestCount = user.completedHarvests + 1;
    const updatedUserWithHarvests = await storage.updateUserHarvests(userId, newHarvestCount);
    console.log(`[HARVEST] User ${userId} harvest count: ${newHarvestCount}`);
    
    if (newHarvestCount >= 9 && user.referredBy && !user.referralBonusClaimed) {
      const referrer = await storage.getUser(user.referredBy);
      if (referrer) {
        const referralBonus = adminSettings.referralBonus || "0.01";
        const newReferrerBalance = new Decimal(referrer.balance).plus(referralBonus).toString();
        await storage.updateUserBalance(referrer.id, newReferrerBalance);
        await storage.markReferralBonusClaimed(userId);
        console.log(`[REFERRAL] Bonus ${referralBonus} awarded to referrer ${referrer.id} for user ${userId}`);
      }
    }
    
    res.json({
      plot: updatedPlot,
      user: { ...updatedUser, completedHarvests: newHarvestCount },
      reward,
    });
  });

  // GET REFERRALS
  app.get("/api/referrals", requireUser, async (req, res) => {
    const userId = (req.session as any).userId;
    const user = await storage.getUser(userId);
    
    if (!user) return res.status(404).json({ message: "User not found" });
    
    const referrals = await storage.getReferrals(userId);
    
    const total = referrals.length;
    const completed = referrals.filter(r => r.isComplete).length;
    const pending = total - completed;
    
    const baseEarnings = new Decimal(completed).times("0.01");
    const totalEarnings = baseEarnings.toString();
    
    const webAppUrl = process.env.WEBAPP_URL || 'https://plantaton.com';
    const referralCode = user.referralCode || String(user.id);
    const referralLink = `${webAppUrl}?ref=${referralCode}`;
    
    res.json({
      referralCode,
      referralLink,
      stats: {
        total,
        pending,
        completed,
        totalEarnings,
      },
      referrals,
    });
  });

  // GET TASKS
  app.get("/api/tasks", requireUser, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const tasks = await storage.getTasksWithStatus(userId);
      res.json({ tasks });
    } catch (err) {
      console.error("Get tasks error:", err);
      res.status(500).json({ message: "Failed to get tasks" });
    }
  });

  // START TASK
  app.post("/api/tasks/:taskId/start", requireUser, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const taskId = parseInt(req.params.taskId);
      
      const existing = await storage.getUserTask(userId, taskId);
      if (existing) {
        return res.status(400).json({ message: "Task already started" });
      }
      
      const userTask = await storage.startTask(userId, taskId);
      res.json(userTask);
    } catch (err) {
      console.error("Start task error:", err);
      res.status(500).json({ message: "Failed to start task" });
    }
  });

  // CLAIM TASK REWARD
  app.post("/api/tasks/:taskId/claim", requireUser, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const taskId = parseInt(req.params.taskId);
      
      const userTask = await storage.getUserTask(userId, taskId);
      if (!userTask) {
        return res.status(400).json({ message: "Task not started" });
      }
      if (userTask.claimed) {
        return res.status(400).json({ message: "Already claimed" });
      }
      
      if (!userTask.startedAt) {
        return res.status(400).json({ message: "Task verification not started properly" });
      }
      const startedAt = new Date(userTask.startedAt);
      const now = new Date();
      const elapsedSeconds = (now.getTime() - startedAt.getTime()) / 1000;
      if (elapsedSeconds < 10) {
        return res.status(400).json({ 
          message: "Please wait 10 seconds for verification",
          remainingSeconds: Math.ceil(10 - elapsedSeconds)
        });
      }
      
      const { task } = await storage.claimTaskReward(userId, taskId);
      console.log(`[CLAIM] Task ${taskId} claimed by user ${userId}. Reward: ${task.reward}`);
      
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      
      console.log(`[CLAIM] User ${userId} current balance: ${user.balance}`);
      const newBalance = new Decimal(user.balance).plus(task.reward).toString();
      console.log(`[CLAIM] User ${userId} new balance: ${newBalance}`);
      
      const updatedUser = await storage.updateUserBalance(userId, newBalance);
      console.log(`[CLAIM] User ${userId} balance updated to: ${updatedUser.balance}`);
      
      res.json({ 
        reward: task.reward, 
        newBalance: updatedUser.balance 
      });
    } catch (err) {
      console.error("Claim task error:", err);
      res.status(500).json({ message: "Failed to claim reward" });
    }
  });

  // GET WITHDRAWALS
  app.get("/api/withdrawals", requireUser, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      
      const history = await storage.getWithdrawals(userId);
      const adminSettings = await storage.getAdminSettings();
      
      res.json({
        balance: user.balance,
        minimumWithdrawal: adminSettings.minimumWithdrawal,
        history,
      });
    } catch (err) {
      console.error("Get withdrawals error:", err);
      res.status(500).json({ message: "Failed to get withdrawals" });
    }
  });

  app.post("/api/withdrawals", rateLimit(60000, 3), requireUser, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { amount, address } = req.body;
      
      if (!amount || typeof amount !== 'string' && typeof amount !== 'number') {
        return res.status(400).json({ message: "Invalid amount" });
      }
      
      let amountDecimal: Decimal;
      try {
        amountDecimal = new Decimal(amount);
      } catch {
        return res.status(400).json({ message: "Invalid amount format" });
      }
      
      if (amountDecimal.isNaN() || !amountDecimal.isFinite() || amountDecimal.isNegative() || amountDecimal.isZero()) {
        return res.status(400).json({ message: "Amount must be a positive number" });
      }
      
      const adminSettings = await storage.getAdminSettings();
      const minWithdrawal = adminSettings.minimumWithdrawal;
      if (amountDecimal.lessThan(minWithdrawal)) {
        return res.status(400).json({ message: `Minimum withdrawal is ${minWithdrawal} TON` });
      }
      
      if (!address || typeof address !== 'string' || address.length < 40 || address.length > 100 || !/^[a-zA-Z0-9_\-]+$/.test(address)) {
        return res.status(400).json({ message: "Invalid TON wallet address" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      
      const balanceDecimal = new Decimal(user.balance);
      if (balanceDecimal.lessThan(amountDecimal)) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      const newBalance = balanceDecimal.minus(amountDecimal).toString();
      await storage.updateUserBalance(userId, newBalance);
      
      const withdrawal = await storage.createWithdrawal({
        userId,
        amount: amountDecimal.toString(),
        address,
        status: "pending",
      });
      
      console.log(`[WITHDRAWAL] New request: User ${user.username} (ID: ${userId}) requested ${amount} TON to ${address}`);
      
      res.json({
        message: "Withdrawal request submitted",
        withdrawal,
        newBalance,
      });
    } catch (err) {
      console.error("Request withdrawal error:", err);
      res.status(500).json({ message: "Failed to request withdrawal" });
    }
  });

  // ============== DAILY BONUS ==============
  
  app.get("/api/daily-bonus", requireUser, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      
      const adminSettings = await storage.getAdminSettings();
      const bonusAmount = adminSettings.dailyBonusAmount || "0.0001";
      
      const lastClaim = user.lastDailyBonus ? new Date(user.lastDailyBonus) : null;
      const now = new Date();
      
      let canClaim = true;
      let nextClaimTime: Date | null = null;
      
      if (lastClaim) {
        const hoursSinceLastClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastClaim < 24) {
          canClaim = false;
          nextClaimTime = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
        }
      }
      
      res.json({
        canClaim,
        bonusAmount,
        lastClaimTime: lastClaim,
        nextClaimTime,
      });
    } catch (err) {
      console.error("Get daily bonus status error:", err);
      res.status(500).json({ message: "Failed to get daily bonus status" });
    }
  });

  app.post("/api/daily-bonus/claim", rateLimit(60000, 3), requireUser, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      
      const lastClaim = user.lastDailyBonus ? new Date(user.lastDailyBonus) : null;
      const now = new Date();
      
      if (lastClaim) {
        const hoursSinceLastClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastClaim < 24) {
          const nextClaimTime = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
          return res.status(400).json({ 
            message: "Daily bonus already claimed", 
            nextClaimTime 
          });
        }
      }
      
      const adminSettings = await storage.getAdminSettings();
      const bonusAmount = adminSettings.dailyBonusAmount || "0.0001";
      
      const newBalance = new Decimal(user.balance).plus(bonusAmount).toString();
      await storage.updateUserBalance(userId, newBalance);
      
      await storage.updateLastDailyBonus(userId);
      
      console.log(`[DAILY BONUS] User ${userId} claimed ${bonusAmount} TON`);
      
      res.json({
        success: true,
        bonusAmount,
        newBalance,
      });
    } catch (err) {
      console.error("Claim daily bonus error:", err);
      res.status(500).json({ message: "Failed to claim daily bonus" });
    }
  });

  // ============== ADMIN API ROUTES ==============
  app.post("/api/admin/verify", rateLimit(60000, 5), async (req, res) => {
    try {
      const ADMIN_CODE = process.env.ADMIN_CODE;
      if (!ADMIN_CODE) {
        return res.status(500).json({ message: "Admin access is not configured" });
      }
      const { code } = req.body;
      if (code === ADMIN_CODE) {
        req.session.isAdmin = true;
        res.json({ success: true });
      } else {
        res.status(401).json({ message: "Invalid admin code" });
      }
    } catch (err) {
      res.status(500).json({ message: "Verification failed" });
    }
  });

  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.session?.isAdmin) {
      return res.status(401).json({ message: "Admin access required" });
    }
    next();
  };

  app.get("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getAdminSettings();
      res.json(settings);
    } catch (err) {
      res.status(500).json({ message: "Failed to get settings" });
    }
  });

  app.post("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const { key, value } = req.body;
      await storage.updateAdminSetting(key, value);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  app.get("/api/admin/tasks", requireAdmin, async (req, res) => {
    try {
      const tasks = await storage.getAllTasks();
      res.json({ tasks });
    } catch (err) {
      res.status(500).json({ message: "Failed to get tasks" });
    }
  });

  app.post("/api/admin/tasks", requireAdmin, async (req, res) => {
    try {
      const { type, title, description, url, reward } = req.body;
      
      const validTypes = ['youtube', 'telegram', 'link'];
      if (!type || !validTypes.includes(type)) {
        return res.status(400).json({ message: "Invalid task type" });
      }
      if (!title || typeof title !== 'string' || title.trim().length < 1 || title.length > 200) {
        return res.status(400).json({ message: "Title is required (max 200 chars)" });
      }
      if (!url || typeof url !== 'string' || !url.startsWith('http')) {
        return res.status(400).json({ message: "Valid URL is required" });
      }
      
      let rewardDecimal: Decimal;
      try {
        rewardDecimal = new Decimal(reward);
      } catch {
        return res.status(400).json({ message: "Invalid reward format" });
      }
      if (rewardDecimal.isNaN() || !rewardDecimal.isFinite() || rewardDecimal.isNegative() || rewardDecimal.isZero()) {
        return res.status(400).json({ message: "Reward must be a positive number" });
      }
      
      const task = await storage.createTask({ 
        type, 
        title: title.trim(), 
        description: (description || '').trim(), 
        url: url.trim(), 
        reward: rewardDecimal.toString() 
      });
      res.json({ task });
    } catch (err) {
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.patch("/api/admin/tasks/:id", requireAdmin, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const updates = req.body;
      const task = await storage.updateTask(taskId, updates);
      res.json({ task });
    } catch (err) {
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/admin/tasks/:id", requireAdmin, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      await storage.deleteTask(taskId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  app.get("/api/admin/withdrawals", requireAdmin, async (req, res) => {
    try {
      const withdrawals = await storage.getAllWithdrawals();
      res.json({ withdrawals });
    } catch (err) {
      res.status(500).json({ message: "Failed to get withdrawals" });
    }
  });

  app.patch("/api/admin/withdrawals/:id", requireAdmin, async (req, res) => {
    try {
      const withdrawalId = parseInt(req.params.id);
      const { status, note } = req.body;

      if (status === "rejected") {
        const existing = await storage.getWithdrawalById(withdrawalId);
        if (existing && existing.status === "pending") {
          const user = await storage.getUser(existing.userId);
          if (user) {
            const refundedBalance = new Decimal(user.balance).plus(existing.amount).toString();
            await storage.updateUserBalance(existing.userId, refundedBalance);
            console.log(`[WITHDRAWAL] Rejected #${withdrawalId}: refunded ${existing.amount} to user ${existing.userId}`);
          }
        }
      }

      const withdrawal = await storage.updateWithdrawalStatus(withdrawalId, status, note);
      res.json({ withdrawal });
    } catch (err) {
      res.status(500).json({ message: "Failed to update withdrawal" });
    }
  });

  app.get("/api/admin/members", requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const sortBy = (req.query.sort as string) || "newest";
      const result = await storage.getAllUsersPaginated(page, Math.min(limit, 100), sortBy);
      res.json({ users: result.users, totalUsers: result.total, page, limit });
    } catch (err) {
      res.status(500).json({ message: "Failed to get members" });
    }
  });

  app.get("/api/admin/members/search", requireAdmin, async (req, res) => {
    try {
      const query = (req.query.q as string || "").trim();
      if (!query) return res.status(400).json({ message: "Search query required" });
      
      if (/^\d+$/.test(query)) {
        const byTelegram = await storage.searchUserByTelegramId(query);
        if (byTelegram) return res.json({ users: [byTelegram] });
        
        const byDbId = await storage.searchUserById(parseInt(query));
        if (byDbId) return res.json({ users: [byDbId] });
      }
      
      const users = await storage.searchUserByUsername(query);
      res.json({ users });
    } catch (err) {
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  app.get("/api/admin/members/:id", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.searchUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ user });
    } catch (err) {
      res.status(500).json({ message: "Failed to find user" });
    }
  });

  app.post("/api/admin/members/:id/balance", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });
      
      const { amount } = req.body;
      if (!amount || typeof amount !== 'string') {
        return res.status(400).json({ message: "Invalid amount" });
      }
      
      let amountDecimal: Decimal;
      try {
        amountDecimal = new Decimal(amount);
      } catch {
        return res.status(400).json({ message: "Invalid amount format" });
      }
      
      if (amountDecimal.isNaN() || !amountDecimal.isFinite() || amountDecimal.isNegative() || amountDecimal.isZero()) {
        return res.status(400).json({ message: "Amount must be a positive number" });
      }
      
      const user = await storage.addUserBalance(userId, amountDecimal.toString());
      res.json({ user });
    } catch (err) {
      res.status(500).json({ message: "Failed to add balance" });
    }
  });

  app.post("/api/admin/members/:id/ban", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { reason } = req.body;
      await storage.banUser(userId, reason);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to ban user" });
    }
  });

  app.post("/api/admin/members/:id/unban", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      await storage.unbanUser(userId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to unban user" });
    }
  });

  // === PROMO CODE ROUTES ===
  
  app.post("/api/promo/use", rateLimit(60000, 10), requireUser, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { code } = req.body;
      
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ message: "Invalid code" });
      }
      
      const promo = await storage.getPromoCodeByCode(code);
      if (!promo) {
        return res.status(404).json({ message: "Code not found" });
      }
      
      const result = await storage.usePromoCode(userId, promo);
      if (!result.success) {
        return res.status(400).json({ message: "Code already used or expired" });
      }
      
      res.json({ success: true, reward: result.reward });
    } catch (err) {
      console.error("Promo code error:", err);
      res.status(500).json({ message: "Failed to use promo code" });
    }
  });

  app.get("/api/admin/promo-codes", requireAdmin, async (req, res) => {
    try {
      const codes = await storage.getAllPromoCodes();
      res.json({ codes });
    } catch (err) {
      res.status(500).json({ message: "Failed to get promo codes" });
    }
  });

  app.post("/api/admin/promo-codes", requireAdmin, async (req, res) => {
    try {
      const { code, reward, maxUses } = req.body;
      
      if (!code || typeof code !== 'string' || code.trim().length < 2 || code.trim().length > 30) {
        return res.status(400).json({ message: "Code must be 2-30 characters" });
      }
      if (!/^[a-zA-Z0-9_\-]+$/.test(code.trim())) {
        return res.status(400).json({ message: "Code can only contain letters, numbers, hyphens and underscores" });
      }
      
      let rewardDecimal: Decimal;
      try {
        rewardDecimal = new Decimal(reward);
      } catch {
        return res.status(400).json({ message: "Invalid reward format" });
      }
      if (rewardDecimal.isNaN() || !rewardDecimal.isFinite() || rewardDecimal.isNegative() || rewardDecimal.isZero()) {
        return res.status(400).json({ message: "Reward must be a positive number" });
      }
      
      const parsedMaxUses = parseInt(maxUses) || 1;
      if (parsedMaxUses < 1 || parsedMaxUses > 100000) {
        return res.status(400).json({ message: "Max uses must be 1-100000" });
      }
      
      const promo = await storage.createPromoCode({
        code: code.trim().toUpperCase(),
        reward: rewardDecimal.toString(),
        maxUses: parsedMaxUses,
        isActive: true,
      });
      res.json({ promo });
    } catch (err: any) {
      if (err?.code === '23505') {
        return res.status(400).json({ message: "Code already exists" });
      }
      res.status(500).json({ message: "Failed to create promo code" });
    }
  });

  app.get("/api/admin/dashboard", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (err) {
      res.status(500).json({ message: "Failed to get dashboard stats" });
    }
  });

  app.get("/api/admin/suspects", requireAdmin, async (req, res) => {
    try {
      const suspects = await storage.getSuspectGroups();
      res.json({ suspects });
    } catch (err) {
      res.status(500).json({ message: "Failed to get suspect groups" });
    }
  });

  app.delete("/api/admin/promo-codes/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePromoCode(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete promo code" });
    }
  });

  return httpServer;
}

import { pgTable, text, serial, integer, boolean, timestamp, decimal, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  telegramId: text("telegram_id").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  photoUrl: text("photo_url"),
  balance: decimal("balance", { precision: 10, scale: 4 }).default("0").notNull(),
  referralCode: text("referral_code").unique(),
  referredBy: integer("referred_by"),
  completedHarvests: integer("completed_harvests").default(0).notNull(),
  referralBonusClaimed: boolean("referral_bonus_claimed").default(false).notNull(),
  lastDailyBonus: timestamp("last_daily_bonus"),
  createdAt: timestamp("created_at").defaultNow(),
  email: text("email").unique(),
  passwordHash: text("password_hash"),
  emailVerified: boolean("email_verified").default(false).notNull(),
  verificationCode: text("verification_code"),
  verificationCodeExpires: timestamp("verification_code_expires"),
  resetToken: text("reset_token"),
  resetTokenExpires: timestamp("reset_token_expires"),
  googleId: text("google_id").unique(),
});

export const plots = pgTable("plots", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  plotIndex: integer("plot_index").notNull(), // 0-11
  status: text("status", { enum: ["empty", "growing", "ready"] }).default("empty").notNull(),
  plantedAt: timestamp("planted_at"),
});

// Session table for connect-pg-simple
export const sessions = pgTable("session", {
  sid: text("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
});

// Tasks table - predefined tasks users can complete for rewards
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  type: text("type", { enum: ["youtube", "telegram", "link"] }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  url: text("url").notNull(),
  reward: decimal("reward", { precision: 10, scale: 4 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User completed tasks - tracks which tasks each user has completed
export const userTasks = pgTable("user_tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  taskId: integer("task_id").notNull(),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  claimed: boolean("claimed").default(false).notNull(),
});

// Withdrawals table - tracks user withdrawal requests
export const withdrawals = pgTable("withdrawals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 3 }).notNull(),
  address: text("address").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  note: text("note"),
});

// Game settings table - admin configurable settings
export const gameSettings = pgTable("game_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User bans table - banned users
export const userBans = pgTable("user_bans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  reason: text("reason"),
  bannedAt: timestamp("banned_at").defaultNow(),
});

// Promo codes table
export const promoCodes = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  reward: decimal("reward", { precision: 10, scale: 4 }).notNull(),
  maxUses: integer("max_uses").default(1).notNull(),
  currentUses: integer("current_uses").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// User promo code usage tracking
export const userPromoCodes = pgTable("user_promo_codes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  promoCodeId: integer("promo_code_id").notNull(),
  usedAt: timestamp("used_at").defaultNow(),
});

// Login tracking for anti-cheat (IP/fingerprint detection)
export const userLogins = pgTable("user_logins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  fingerprint: text("fingerprint"),
  loginType: text("login_type", { enum: ["register", "login", "google"] }).default("login").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === BASE SCHEMAS ===
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertPlotSchema = createInsertSchema(plots).omit({ id: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });
export const insertUserTaskSchema = createInsertSchema(userTasks).omit({ id: true, startedAt: true, completedAt: true });
export const insertWithdrawalSchema = createInsertSchema(withdrawals).omit({ id: true, createdAt: true, processedAt: true });
export const insertGameSettingSchema = createInsertSchema(gameSettings).omit({ id: true, updatedAt: true });
export const insertUserBanSchema = createInsertSchema(userBans).omit({ id: true, bannedAt: true });
export const insertPromoCodeSchema = createInsertSchema(promoCodes).omit({ id: true, createdAt: true, currentUses: true });
export const insertUserPromoCodeSchema = createInsertSchema(userPromoCodes).omit({ id: true, usedAt: true });
export const insertUserLoginSchema = createInsertSchema(userLogins).omit({ id: true, createdAt: true });

// === EXPLICIT API CONTRACT TYPES ===

// Base types
export type User = typeof users.$inferSelect;
export type Plot = typeof plots.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type UserTask = typeof userTasks.$inferSelect;
export type Withdrawal = typeof withdrawals.$inferSelect;
export type GameSetting = typeof gameSettings.$inferSelect;
export type UserBan = typeof userBans.$inferSelect;
export type PromoCode = typeof promoCodes.$inferSelect;
export type UserPromoCode = typeof userPromoCodes.$inferSelect;
export type UserLogin = typeof userLogins.$inferSelect;

// Insert types for storage layer
export type InsertUser = typeof users.$inferInsert;
export type InsertPlot = typeof plots.$inferInsert;
export type InsertTask = typeof tasks.$inferInsert;
export type InsertUserTask = typeof userTasks.$inferInsert;
export type InsertWithdrawal = typeof withdrawals.$inferInsert;
export type InsertGameSetting = typeof gameSettings.$inferInsert;
export type InsertUserBan = typeof userBans.$inferInsert;
export type InsertPromoCode = typeof promoCodes.$inferInsert;
export type InsertUserPromoCode = typeof userPromoCodes.$inferInsert;
export type InsertUserLogin = typeof userLogins.$inferInsert;

// Request types
export type PlantRequest = { plotIndex: number };
export type HarvestRequest = { plotIndex: number };

// Response types
export type UserResponse = User;
export type PlotResponse = Plot;
export type FarmingStateResponse = {
  user: User;
  plots: Plot[];
};

// Referral types
export type ReferralInfo = {
  id: number;
  telegramId: string | null;
  username: string;
  completedHarvests: number;
  isComplete: boolean;
  joinedAt: Date | null;
};

export type ReferralStats = {
  total: number;
  pending: number;
  completed: number;
  totalEarnings: string;
};

export type ReferralPageData = {
  referralCode: string;
  referralLink: string;
  stats: ReferralStats;
  referrals: ReferralInfo[];
};

// Task types
export type TaskWithStatus = Task & {
  isCompleted: boolean;
  isClaimed: boolean;
};

export type TaskListResponse = {
  tasks: TaskWithStatus[];
};

// Withdrawal types
export type WithdrawalRequest = {
  amount: string;
  address: string;
};

export type WithdrawalHistory = Withdrawal[];

export type WithdrawalPageData = {
  balance: string;
  minimumWithdrawal: string;
  history: WithdrawalHistory;
};

// Box/Plot settings for each of the 9 boxes
export type BoxSettings = {
  growthTimeSeconds: number;
  harvestReward: string;
};

// Admin types
export type AdminSettings = {
  // Per-box settings (9 boxes)
  boxes: BoxSettings[];
  // Legacy global settings (fallback)
  growthTimeSeconds: number;
  harvestReward: string;
  // Money settings
  minimumWithdrawal: string;
  referralBonus: string;
  referralPercentage: number;
  // Daily bonus
  dailyBonusAmount: string;
  // Contact settings
  telegramChannel: string;
  telegramSupport: string;
};

export type AdminUserInfo = User & {
  referralCount: number;
  isBanned: boolean;
};

export type AdminMemberStats = {
  totalUsers: number;
  topUsers: AdminUserInfo[];
};

export type AdminWithdrawalInfo = Withdrawal & {
  username: string;
};

export type AdminDashboardData = {
  settings: AdminSettings;
  memberStats: AdminMemberStats;
  pendingWithdrawals: AdminWithdrawalInfo[];
};

export type SuspectGroup = {
  ipAddress: string;
  users: { id: number; username: string; email: string | null; createdAt: Date | null; lastLogin: Date | null; isBanned: boolean }[];
};

export type AdminDashboardStats = {
  totalUsers: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
  totalBalance: string;
  todayNewUsers: number;
  suspectCount: number;
};

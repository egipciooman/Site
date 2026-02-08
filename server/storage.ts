import { db } from "./db";
import { users, plots, tasks, userTasks, withdrawals, gameSettings, userBans, promoCodes, userPromoCodes, userLogins, type User, type Plot, type Task, type UserTask, type Withdrawal, type InsertUser, type InsertPlot, type InsertWithdrawal, type ReferralInfo, type TaskWithStatus, type AdminSettings, type AdminUserInfo, type AdminWithdrawalInfo, type PromoCode, type InsertPromoCode, type SuspectGroup, type AdminDashboardStats, type UserLogin } from "@shared/schema";
import { eq, and, desc, sql, count, ne, isNotNull, countDistinct, sum } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  getUserByReferralCode(code: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserTelegramInfo(id: number, telegramId: string, firstName?: string, lastName?: string, photoUrl?: string): Promise<User>;
  updateUserBalance(id: number, amount: string): Promise<User>;
  updateUserHarvests(id: number, harvests: number): Promise<User>;
  updateUserReferralCode(id: number, referralCode: string): Promise<User>;
  updateUserReferrer(id: number, referrerId: number): Promise<User>;
  markReferralBonusClaimed(id: number): Promise<User>;
  updateLastDailyBonus(id: number): Promise<User>;
  
  getPlots(userId: number): Promise<Plot[]>;
  getPlot(userId: number, plotIndex: number): Promise<Plot | undefined>;
  createPlot(plot: InsertPlot): Promise<Plot>;
  updatePlot(id: number, updates: Partial<Plot>): Promise<Plot>;
  
  getReferrals(userId: number): Promise<ReferralInfo[]>;
  
  initializePlots(userId: number): Promise<Plot[]>;
  
  // Task methods
  getTasksWithStatus(userId: number): Promise<TaskWithStatus[]>;
  getUserTask(userId: number, taskId: number): Promise<UserTask | undefined>;
  startTask(userId: number, taskId: number): Promise<UserTask>;
  claimTaskReward(userId: number, taskId: number): Promise<{ userTask: UserTask; task: Task }>;
  
  // Withdrawal methods
  getWithdrawalById(id: number): Promise<Withdrawal | undefined>;
  createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal>;
  getWithdrawals(userId: number): Promise<Withdrawal[]>;
  updateWithdrawalStatus(id: number, status: "pending" | "approved" | "rejected", note?: string): Promise<Withdrawal>;
  
  // Admin methods
  getAdminSettings(): Promise<AdminSettings>;
  updateAdminSetting(key: string, value: string): Promise<void>;
  getAllTasks(): Promise<Task[]>;
  createTask(task: { type: string; title: string; description: string; url: string; reward: string }): Promise<Task>;
  updateTask(id: number, updates: Partial<Task>): Promise<Task>;
  deleteTask(id: number): Promise<void>;
  getAllWithdrawals(): Promise<AdminWithdrawalInfo[]>;
  getTotalUserCount(): Promise<number>;
  getTopUsers(limit: number): Promise<AdminUserInfo[]>;
  getAllUsersPaginated(page: number, limit: number, sortBy?: string): Promise<{ users: AdminUserInfo[]; total: number }>;
  searchUserById(id: number): Promise<AdminUserInfo | undefined>;
  addUserBalance(userId: number, amount: string): Promise<User>;
  banUser(userId: number, reason?: string): Promise<void>;
  unbanUser(userId: number): Promise<void>;
  isUserBanned(userId: number): Promise<boolean>;
  
  // Promo code methods
  getPromoCodeByCode(code: string): Promise<PromoCode | undefined>;
  hasUserUsedPromoCode(userId: number, promoCodeId: number): Promise<boolean>;
  usePromoCode(userId: number, promoCode: PromoCode): Promise<{ success: boolean; reward: string }>;
  getAllPromoCodes(): Promise<PromoCode[]>;
  createPromoCode(data: InsertPromoCode): Promise<PromoCode>;
  deletePromoCode(id: number): Promise<void>;

  // Email auth methods
  getUserByEmail(email: string): Promise<User | undefined>;
  createUserWithEmail(data: { email: string; username: string; passwordHash: string; verificationCode: string; verificationCodeExpires: Date; referralCode: string; referredBy?: number }): Promise<User>;
  verifyUserEmail(userId: number): Promise<User>;
  updateVerificationCode(userId: number, code: string, expires: Date): Promise<User>;
  setResetToken(userId: number, token: string, expires: Date): Promise<User>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  updatePassword(userId: number, passwordHash: string): Promise<User>;

  // Google OAuth methods
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUserWithGoogle(data: { googleId: string; email: string; username: string; firstName?: string; photoUrl?: string; referralCode: string; referredBy?: number }): Promise<User>;
  linkGoogleAccount(userId: number, googleId: string): Promise<User>;

  // Login tracking / anti-cheat methods
  trackLogin(userId: number, ipAddress: string | null, userAgent: string | null, fingerprint: string | null, loginType: string): Promise<void>;
  getSuspectGroups(): Promise<SuspectGroup[]>;
  getDashboardStats(): Promise<AdminDashboardStats>;
  getRecentLogins(userId: number): Promise<UserLogin[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
    return user;
  }

  async updateUserTelegramInfo(id: number, telegramId: string, firstName?: string, lastName?: string, photoUrl?: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        telegramId, 
        firstName: firstName || null,
        lastName: lastName || null,
        photoUrl: photoUrl || null
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserBalance(id: number, newBalance: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ balance: newBalance })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserHarvests(id: number, harvests: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ completedHarvests: harvests })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.referralCode, code));
    return user;
  }

  async getReferrals(userId: number): Promise<ReferralInfo[]> {
    const referredUsers = await db
      .select()
      .from(users)
      .where(eq(users.referredBy, userId));
    
    return referredUsers.map(u => ({
      id: u.id,
      telegramId: u.telegramId,
      username: u.username,
      completedHarvests: Math.min(u.completedHarvests, 9),
      isComplete: u.completedHarvests >= 9,
      joinedAt: u.createdAt,
    }));
  }

  async updateUserReferralCode(id: number, referralCode: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ referralCode })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserReferrer(id: number, referrerId: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ referredBy: referrerId })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async markReferralBonusClaimed(id: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ referralBonusClaimed: true })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateLastDailyBonus(id: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ lastDailyBonus: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getPlots(userId: number): Promise<Plot[]> {
    return await db.select().from(plots).where(eq(plots.userId, userId)).orderBy(plots.plotIndex);
  }

  async getPlot(userId: number, plotIndex: number): Promise<Plot | undefined> {
    const [plot] = await db
      .select()
      .from(plots)
      .where(and(eq(plots.userId, userId), eq(plots.plotIndex, plotIndex)));
    return plot;
  }

  async createPlot(insertPlot: InsertPlot): Promise<Plot> {
    const [plot] = await db.insert(plots).values(insertPlot).returning();
    return plot;
  }

  async updatePlot(id: number, updates: Partial<Plot>): Promise<Plot> {
    const [plot] = await db
      .update(plots)
      .set(updates)
      .where(eq(plots.id, id))
      .returning();
    return plot;
  }

  async initializePlots(userId: number): Promise<Plot[]> {
    const newPlots: InsertPlot[] = Array.from({ length: 9 }, (_, i) => ({
      userId,
      plotIndex: i,
      status: "empty",
      plantedAt: null,
    }));
    
    return await db.insert(plots).values(newPlots).returning();
  }

  async getTasksWithStatus(userId: number): Promise<TaskWithStatus[]> {
    const allTasks = await db.select().from(tasks).where(eq(tasks.isActive, true));
    const completedTasks = await db.select().from(userTasks).where(eq(userTasks.userId, userId));
    
    const completedMap = new Map(completedTasks.map(ut => [ut.taskId, ut]));
    
    return allTasks.map(task => ({
      ...task,
      isCompleted: completedMap.has(task.id),
      isClaimed: completedMap.get(task.id)?.claimed ?? false,
    }));
  }

  async getUserTask(userId: number, taskId: number): Promise<UserTask | undefined> {
    const [userTask] = await db
      .select()
      .from(userTasks)
      .where(and(eq(userTasks.userId, userId), eq(userTasks.taskId, taskId)));
    return userTask;
  }

  async startTask(userId: number, taskId: number): Promise<UserTask> {
    const [userTask] = await db
      .insert(userTasks)
      .values({ userId, taskId, claimed: false })
      .returning();
    return userTask;
  }

  async claimTaskReward(userId: number, taskId: number): Promise<{ userTask: UserTask; task: Task }> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    if (!task) throw new Error("Task not found");

    const [userTask] = await db
      .update(userTasks)
      .set({ claimed: true })
      .where(and(eq(userTasks.userId, userId), eq(userTasks.taskId, taskId)))
      .returning();
    
    return { userTask, task };
  }

  async getWithdrawalById(id: number): Promise<Withdrawal | undefined> {
    const [w] = await db.select().from(withdrawals).where(eq(withdrawals.id, id));
    return w;
  }

  async createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal> {
    const [newWithdrawal] = await db.insert(withdrawals).values(withdrawal).returning();
    return newWithdrawal;
  }

  async getWithdrawals(userId: number): Promise<Withdrawal[]> {
    return await db
      .select()
      .from(withdrawals)
      .where(eq(withdrawals.userId, userId))
      .orderBy(desc(withdrawals.createdAt));
  }

  async updateWithdrawalStatus(id: number, status: "pending" | "approved" | "rejected", note?: string): Promise<Withdrawal> {
    const [withdrawal] = await db
      .update(withdrawals)
      .set({ status, note, processedAt: new Date() })
      .where(eq(withdrawals.id, id))
      .returning();
    return withdrawal;
  }

  // Admin methods
  async getAdminSettings(): Promise<AdminSettings> {
    const settings = await db.select().from(gameSettings);
    const settingsMap = new Map(settings.map(s => [s.key, s.value]));
    
    const defaultGrowthTime = parseInt(settingsMap.get('growthTimeSeconds') || '60');
    const defaultReward = settingsMap.get('harvestReward') || '0.0001';
    
    let boxes: { growthTimeSeconds: number; harvestReward: string }[] = [];
    const boxesJson = settingsMap.get('boxes');
    if (boxesJson) {
      try {
        boxes = JSON.parse(boxesJson);
      } catch (e) {
        boxes = [];
      }
    }
    
    if (boxes.length < 9) {
      const defaultRewards = ['0.0001', '0.0001', '0.0001', '0.0001', '0.0001', '0.0001', '0.0001', '0.0001', '0.0001'];
      boxes = Array(9).fill(null).map((_, i) => ({
        growthTimeSeconds: boxes[i]?.growthTimeSeconds ?? defaultGrowthTime,
        harvestReward: boxes[i]?.harvestReward ?? defaultRewards[i]
      }));
    }
    
    return {
      boxes,
      growthTimeSeconds: defaultGrowthTime,
      harvestReward: defaultReward,
      minimumWithdrawal: settingsMap.get('minimumWithdrawal') || '0.1',
      referralBonus: settingsMap.get('referralBonus') || '0.01',
      referralPercentage: parseInt(settingsMap.get('referralPercentage') || '10'),
      dailyBonusAmount: settingsMap.get('dailyBonusAmount') || '0.0001',
      telegramChannel: settingsMap.get('telegramChannel') || '',
      telegramSupport: settingsMap.get('telegramSupport') || '',
    };
  }

  async updateAdminSetting(key: string, value: string): Promise<void> {
    await db
      .insert(gameSettings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: gameSettings.key,
        set: { value, updatedAt: new Date() }
      });
  }

  async getAllTasks(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }

  async createTask(task: { type: string; title: string; description: string; url: string; reward: string }): Promise<Task> {
    const [newTask] = await db.insert(tasks).values({
      type: task.type as "youtube" | "telegram" | "link",
      title: task.title,
      description: task.description,
      url: task.url,
      reward: task.reward,
      isActive: true,
    }).returning();
    return newTask;
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async getAllWithdrawals(): Promise<AdminWithdrawalInfo[]> {
    const rows = await db
      .select({
        withdrawal: withdrawals,
        username: users.username,
      })
      .from(withdrawals)
      .leftJoin(users, eq(withdrawals.userId, users.id))
      .orderBy(desc(withdrawals.createdAt));
    
    return rows.map(r => ({
      ...r.withdrawal,
      username: r.username || 'Unknown',
    }));
  }

  async getTotalUserCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(users);
    return result?.count || 0;
  }

  async getTopUsers(limit: number): Promise<AdminUserInfo[]> {
    const topUserRows = await db
      .select()
      .from(users)
      .orderBy(desc(users.balance))
      .limit(limit);

    if (topUserRows.length === 0) return [];

    const userIds = topUserRows.map(u => u.id);

    const refCounts = await db
      .select({ referredBy: users.referredBy, cnt: count() })
      .from(users)
      .where(sql`${users.referredBy} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`)
      .groupBy(users.referredBy);
    const refMap = new Map(refCounts.map(r => [r.referredBy!, r.cnt]));

    const bans = await db
      .select({ userId: userBans.userId })
      .from(userBans)
      .where(sql`${userBans.userId} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`);
    const banSet = new Set(bans.map(b => b.userId));

    return topUserRows.map(user => ({
      ...user,
      referralCount: refMap.get(user.id) || 0,
      isBanned: banSet.has(user.id),
    }));
  }

  async getAllUsersPaginated(page: number, limit: number, sortBy: string = "newest"): Promise<{ users: AdminUserInfo[]; total: number }> {
    const totalCount = await this.getTotalUserCount();
    const offset = (page - 1) * limit;

    let orderByClause;
    switch (sortBy) {
      case "balance":
        orderByClause = desc(users.balance);
        break;
      case "harvests":
        orderByClause = desc(users.completedHarvests);
        break;
      case "newest":
      default:
        orderByClause = desc(users.createdAt);
        break;
    }

    if (sortBy === "referrals") {
      const allRefCounts = await db
        .select({ referredBy: users.referredBy, cnt: count() })
        .from(users)
        .where(sql`${users.referredBy} IS NOT NULL`)
        .groupBy(users.referredBy);
      
      const sortedRefUserIds = allRefCounts
        .sort((a, b) => Number(b.cnt) - Number(a.cnt))
        .slice(offset, offset + limit)
        .map(r => r.referredBy!);

      if (sortedRefUserIds.length === 0) {
        const fallbackRows = await db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
        const fallbackIds = fallbackRows.map(u => u.id);
        const bans = fallbackIds.length > 0 ? await db.select({ userId: userBans.userId }).from(userBans).where(sql`${userBans.userId} IN (${sql.join(fallbackIds.map(id => sql`${id}`), sql`, `)})`) : [];
        const banSet = new Set(bans.map(b => b.userId));
        return {
          users: fallbackRows.map(user => ({ ...user, referralCount: 0, isBanned: banSet.has(user.id) })),
          total: totalCount,
        };
      }

      const userRows = await db.select().from(users).where(sql`${users.id} IN (${sql.join(sortedRefUserIds.map(id => sql`${id}`), sql`, `)})`);
      const refMap = new Map(allRefCounts.map(r => [r.referredBy!, r.cnt]));
      const bans = await db.select({ userId: userBans.userId }).from(userBans).where(sql`${userBans.userId} IN (${sql.join(sortedRefUserIds.map(id => sql`${id}`), sql`, `)})`);
      const banSet = new Set(bans.map(b => b.userId));
      const userMap = new Map(userRows.map(u => [u.id, u]));

      return {
        users: sortedRefUserIds.map(id => {
          const user = userMap.get(id)!;
          return { ...user, referralCount: refMap.get(id) || 0, isBanned: banSet.has(id) };
        }).filter(u => u),
        total: totalCount,
      };
    }
    
    const userRows = await db
      .select()
      .from(users)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    if (userRows.length === 0) return { users: [], total: totalCount };

    const userIds = userRows.map(u => u.id);

    const refCounts = await db
      .select({ referredBy: users.referredBy, cnt: count() })
      .from(users)
      .where(sql`${users.referredBy} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`)
      .groupBy(users.referredBy);
    const refMap = new Map(refCounts.map(r => [r.referredBy!, r.cnt]));

    const bans = await db
      .select({ userId: userBans.userId })
      .from(userBans)
      .where(sql`${userBans.userId} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`);
    const banSet = new Set(bans.map(b => b.userId));

    return {
      users: userRows.map(user => ({
        ...user,
        referralCount: refMap.get(user.id) || 0,
        isBanned: banSet.has(user.id),
      })),
      total: totalCount,
    };
  }

  async searchUserById(id: number): Promise<AdminUserInfo | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const referrals = await this.getReferrals(id);
    const isBanned = await this.isUserBanned(id);
    
    return {
      ...user,
      referralCount: referrals.length,
      isBanned,
    };
  }

  async searchUserByTelegramId(telegramId: string): Promise<AdminUserInfo | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);
    if (!user) return undefined;
    const referrals = await this.getReferrals(user.id);
    const isBanned = await this.isUserBanned(user.id);
    return { ...user, referralCount: referrals.length, isBanned };
  }

  async searchUserByUsername(query: string): Promise<AdminUserInfo[]> {
    const matchedUsers = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.username}) LIKE LOWER(${'%' + query + '%'})`)
      .limit(20);
    
    if (matchedUsers.length === 0) return [];

    const results: AdminUserInfo[] = [];
    for (const user of matchedUsers) {
      const referrals = await this.getReferrals(user.id);
      const isBanned = await this.isUserBanned(user.id);
      results.push({
        ...user,
        referralCount: referrals.length,
        isBanned,
      });
    }
    return results;
  }

  async addUserBalance(userId: number, amount: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');
    
    const Decimal = (await import('decimal.js')).default;
    const newBalance = new Decimal(user.balance).plus(amount).toString();
    return await this.updateUserBalance(userId, newBalance);
  }

  async banUser(userId: number, reason?: string): Promise<void> {
    await db
      .insert(userBans)
      .values({ userId, reason })
      .onConflictDoUpdate({
        target: userBans.userId,
        set: { reason, bannedAt: new Date() }
      });
  }

  async unbanUser(userId: number): Promise<void> {
    await db.delete(userBans).where(eq(userBans.userId, userId));
  }

  async isUserBanned(userId: number): Promise<boolean> {
    const [ban] = await db.select().from(userBans).where(eq(userBans.userId, userId));
    return !!ban;
  }

  async getPromoCodeByCode(code: string): Promise<PromoCode | undefined> {
    const [promo] = await db.select().from(promoCodes).where(eq(promoCodes.code, code.toUpperCase()));
    return promo;
  }

  async hasUserUsedPromoCode(userId: number, promoCodeId: number): Promise<boolean> {
    const [usage] = await db
      .select()
      .from(userPromoCodes)
      .where(and(
        eq(userPromoCodes.userId, userId),
        eq(userPromoCodes.promoCodeId, promoCodeId)
      ));
    return !!usage;
  }

  async usePromoCode(userId: number, promo: PromoCode): Promise<{ success: boolean; reward: string }> {
    if (!promo.isActive) {
      return { success: false, reward: "0" };
    }
    
    if (promo.expiresAt && new Date() > new Date(promo.expiresAt)) {
      return { success: false, reward: "0" };
    }
    
    const alreadyUsed = await this.hasUserUsedPromoCode(userId, promo.id);
    if (alreadyUsed) {
      return { success: false, reward: "0" };
    }
    
    const [updated] = await db
      .update(promoCodes)
      .set({ currentUses: sql`${promoCodes.currentUses} + 1` })
      .where(and(
        eq(promoCodes.id, promo.id),
        sql`${promoCodes.currentUses} < ${promoCodes.maxUses}`
      ))
      .returning();
    
    if (!updated) {
      return { success: false, reward: "0" };
    }
    
    await this.addUserBalance(userId, promo.reward);
    
    await db.insert(userPromoCodes).values({
      userId,
      promoCodeId: promo.id,
    });
    
    return { success: true, reward: promo.reward };
  }

  async getAllPromoCodes(): Promise<PromoCode[]> {
    return await db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));
  }

  async createPromoCode(data: InsertPromoCode): Promise<PromoCode> {
    const [promo] = await db
      .insert(promoCodes)
      .values({ ...data, code: data.code.toUpperCase() })
      .returning();
    return promo;
  }

  async deletePromoCode(id: number): Promise<void> {
    await db.delete(promoCodes).where(eq(promoCodes.id, id));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async createUserWithEmail(data: { email: string; username: string; passwordHash: string; verificationCode: string; verificationCodeExpires: Date; referralCode: string; referredBy?: number }): Promise<User> {
    const [user] = await db.insert(users).values({
      email: data.email.toLowerCase(),
      username: data.username,
      passwordHash: data.passwordHash,
      verificationCode: data.verificationCode,
      verificationCodeExpires: data.verificationCodeExpires,
      referralCode: data.referralCode,
      referredBy: data.referredBy || null,
      emailVerified: false,
    }).returning();
    return user;
  }

  async verifyUserEmail(userId: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ emailVerified: true, verificationCode: null, verificationCodeExpires: null })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateVerificationCode(userId: number, code: string, expires: Date): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ verificationCode: code, verificationCodeExpires: expires })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async setResetToken(userId: number, token: string, expires: Date): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ resetToken: token, resetTokenExpires: expires })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.resetToken, token));
    return user;
  }

  async updatePassword(userId: number, passwordHash: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ passwordHash, resetToken: null, resetTokenExpires: null })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async createUserWithGoogle(data: { googleId: string; email: string; username: string; firstName?: string; photoUrl?: string; referralCode: string; referredBy?: number }): Promise<User> {
    const [user] = await db.insert(users).values({
      googleId: data.googleId,
      email: data.email.toLowerCase(),
      username: data.username,
      firstName: data.firstName || null,
      photoUrl: data.photoUrl || null,
      emailVerified: true,
      referralCode: data.referralCode,
      referredBy: data.referredBy || null,
      balance: "0",
    }).returning();
    return user;
  }

  async linkGoogleAccount(userId: number, googleId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ googleId })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async trackLogin(userId: number, ipAddress: string | null, userAgent: string | null, fingerprint: string | null, loginType: string): Promise<void> {
    await db.insert(userLogins).values({
      userId,
      ipAddress,
      userAgent,
      fingerprint,
      loginType: loginType as "register" | "login" | "google",
    });
  }

  async getSuspectGroups(): Promise<SuspectGroup[]> {
    const suspectIps = await db
      .select({
        ipAddress: userLogins.ipAddress,
        distinctUsers: countDistinct(userLogins.userId),
      })
      .from(userLogins)
      .where(isNotNull(userLogins.ipAddress))
      .groupBy(userLogins.ipAddress)
      .having(sql`COUNT(DISTINCT ${userLogins.userId}) > 1`);

    const groups: SuspectGroup[] = [];

    for (const row of suspectIps) {
      const ip = row.ipAddress!;
      const loginRows = await db
        .select({ userId: userLogins.userId })
        .from(userLogins)
        .where(eq(userLogins.ipAddress, ip))
        .groupBy(userLogins.userId);

      const userIds = loginRows.map(r => r.userId);
      if (userIds.length === 0) continue;

      const userRows = await db
        .select()
        .from(users)
        .where(sql`${users.id} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`);

      const banRows = await db
        .select({ userId: userBans.userId })
        .from(userBans)
        .where(sql`${userBans.userId} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`);
      const banSet = new Set(banRows.map(b => b.userId));

      const lastLoginMap = new Map<number, Date | null>();
      for (const uid of userIds) {
        const [lastLogin] = await db
          .select({ createdAt: userLogins.createdAt })
          .from(userLogins)
          .where(eq(userLogins.userId, uid))
          .orderBy(desc(userLogins.createdAt))
          .limit(1);
        lastLoginMap.set(uid, lastLogin?.createdAt || null);
      }

      groups.push({
        ipAddress: ip,
        users: userRows.map(u => ({
          id: u.id,
          username: u.username,
          email: u.email,
          createdAt: u.createdAt,
          lastLogin: lastLoginMap.get(u.id) || null,
          isBanned: banSet.has(u.id),
        })),
      });
    }

    return groups;
  }

  async getDashboardStats(): Promise<AdminDashboardStats> {
    const [userCountResult] = await db.select({ count: count() }).from(users);
    const totalUsers = userCountResult?.count || 0;

    const [totalWdResult] = await db.select({ count: count() }).from(withdrawals);
    const totalWithdrawals = totalWdResult?.count || 0;

    const [pendingWdResult] = await db.select({ count: count() }).from(withdrawals).where(eq(withdrawals.status, "pending"));
    const pendingWithdrawals = pendingWdResult?.count || 0;

    const [balanceResult] = await db.select({ total: sum(users.balance) }).from(users);
    const totalBalance = balanceResult?.total || "0";

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [todayResult] = await db.select({ count: count() }).from(users).where(sql`${users.createdAt} >= ${today}`);
    const todayNewUsers = todayResult?.count || 0;

    const suspectGroups = await this.getSuspectGroups();
    const suspectCount = suspectGroups.length;

    return {
      totalUsers,
      totalWithdrawals,
      pendingWithdrawals,
      totalBalance,
      todayNewUsers,
      suspectCount,
    };
  }

  async getRecentLogins(userId: number): Promise<UserLogin[]> {
    return await db
      .select()
      .from(userLogins)
      .where(eq(userLogins.userId, userId))
      .orderBy(desc(userLogins.createdAt))
      .limit(10);
  }
}

export const storage = new DatabaseStorage();

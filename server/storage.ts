/// <reference types="node" />
import { randomUUID } from "node:crypto";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";

import {
  type Habit,
  type InsertHabit,
  type HabitCompletion,
  type InsertCompletion,
  type Streak,
  type Notification,
  type InsertNotification,
  type HabitWithStats,
  type DailyStats,
  habits,
  habitCompletions as completions,
  streaks,
  notifications
} from "./schema";

export interface IStorage {
  getHabits(): Promise<Habit[]>;
  getHabit(id: string): Promise<Habit | undefined>;
  createHabit(habit: InsertHabit): Promise<Habit>;
  updateHabit(id: string, habit: Partial<InsertHabit>): Promise<Habit | undefined>;
  deleteHabit(id: string): Promise<boolean>;

  getHabitCompletions(habitId: string, startDate?: string, endDate?: string): Promise<HabitCompletion[]>;
  addCompletion(completion: InsertCompletion): Promise<HabitCompletion>;
  removeCompletion(habitId: string, date: string): Promise<boolean>;

  getStreak(habitId: string): Promise<Streak | undefined>;
  updateStreak(habitId: string, streak: Partial<Streak>): Promise<Streak>;

  getNotifications(limit?: number): Promise<Notification[]>;
  addNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<boolean>;

  getDailyStats(startDate: string, endDate: string): Promise<DailyStats[]>;
  getHabitsWithStats(): Promise<HabitWithStats[]>;
}

// Setup Drizzle + Postgres
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new pkg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export class PostgresStorage implements IStorage {
  // HABITS
  async getHabits(): Promise<Habit[]> {
    return db.select().from(habits).where(eq(habits.isActive, true));
  }

  async getHabit(id: string): Promise<Habit | undefined> {
    const result = await db.select().from(habits).where(eq(habits.id, id)).limit(1);
    return result[0];
  }

  async createHabit(habit: InsertHabit): Promise<Habit> {
    const newHabit: Habit = {
      id: randomUUID(),
      name: habit.name,
      category: habit.category,
      description: habit.description ?? null,
      frequency: habit.frequency,
      customSchedule: habit.customSchedule ?? null,
      reminderTime: habit.reminderTime ?? null,
      isActive: habit.isActive ?? true,
      color: habit.color ?? null,
      icon: habit.icon ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.insert(habits).values(newHabit);
    await db.insert(streaks).values({
      id: randomUUID(),
      habitId: newHabit.id,
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: null,
      updatedAt: new Date(),
    });
    return newHabit;
  }

  async updateHabit(id: string, habit: Partial<InsertHabit>): Promise<Habit | undefined> {
    const updatedAt = new Date();
    await db.update(habits).set({ ...habit, updatedAt }).where(eq(habits.id, id));
    return this.getHabit(id);
  }

  async deleteHabit(id: string): Promise<boolean> {
    const res = await db.update(habits)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(habits.id, id));
    return (res.rowCount ?? 0) > 0;
  }

  // COMPLETIONS
  async getHabitCompletions(habitId: string, startDate?: string, endDate?: string): Promise<HabitCompletion[]> {
    let conditions = [eq(completions.habitId, habitId)];
    if (startDate) conditions.push(gte(completions.date, startDate));
    if (endDate) conditions.push(lte(completions.date, endDate));

    return db.select().from(completions)
      .where(and(...conditions))
      .orderBy(desc(completions.date));
  }

  async addCompletion(completion: InsertCompletion): Promise<HabitCompletion> {
    const newCompletion: HabitCompletion = {
      id: randomUUID(),
      habitId: completion.habitId,
      date: completion.date,
      notes: completion.notes ?? null,
      completedAt: new Date(),
    };
    await db.insert(completions).values(newCompletion);
    await this.updateStreakForCompletion(completion.habitId as string, completion.date as string);
    return newCompletion;
  }

  async removeCompletion(habitId: string, date: string): Promise<boolean> {
    const res = await db.delete(completions)
      .where(and(eq(completions.habitId, habitId), eq(completions.date, date)));
    await this.recalculateStreak(habitId);
    return (res.rowCount ?? 0) > 0;
  }

  // STREAKS
  async getStreak(habitId: string): Promise<Streak | undefined> {
    const result = await db.select().from(streaks).where(eq(streaks.habitId, habitId)).limit(1);
    return result[0];
  }

  async updateStreak(habitId: string, streak: Partial<Streak>): Promise<Streak> {
    const updatedAt = new Date();
    await db.update(streaks)
      .set({ ...streak, updatedAt })
      .where(eq(streaks.habitId, habitId));
    return (await this.getStreak(habitId))!;
  }

  // NOTIFICATIONS
  async getNotifications(limit = 10): Promise<Notification[]> {
    return db.select().from(notifications)
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async addNotification(notification: InsertNotification): Promise<Notification> {
    const newNotification: Notification = {
      id: randomUUID(),
      title: notification.title,
      message: notification.message,
      type: notification.type,
      habitId: notification.habitId ?? null,
      isRead: notification.isRead ?? false,
      scheduledFor: notification.scheduledFor ?? null,
      createdAt: new Date(),
    };
    await db.insert(notifications).values(newNotification);
    return newNotification;
  }

  async markNotificationRead(id: string): Promise<boolean> {
    const res = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
    return (res.rowCount ?? 0) > 0;
  }

  // ANALYTICS
  async getDailyStats(startDate: string, endDate: string): Promise<DailyStats[]> {
    const allHabits = await this.getHabits();
    const stats: DailyStats[] = [];

    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      const completionsForDay = await db.select().from(completions).where(eq(completions.date, dateStr));
      const scheduledHabits = allHabits.filter(h => this.isHabitScheduledForDate(h, dateStr));

      stats.push({
        date: dateStr,
        totalHabits: scheduledHabits.length,
        completedHabits: completionsForDay.length,
        completionRate: scheduledHabits.length > 0
          ? (completionsForDay.length / scheduledHabits.length) * 100
          : 0,
        streakCount: 0,
      });
    }
    return stats;
  }

  async getHabitsWithStats(): Promise<HabitWithStats[]> {
    const habitsList = await this.getHabits();
    const today = new Date().toISOString().split("T")[0];

    return Promise.all(habitsList.map(async habit => {
      const streak = await this.getStreak(habit.id) || {
        id: randomUUID(),
        habitId: habit.id,
        currentStreak: 0,
        longestStreak: 0,
        lastCompletedDate: null,
        updatedAt: new Date(),
      };
      const completionsList = await this.getHabitCompletions(habit.id);
      const completedToday = completionsList.some(c => c.date === today);
      const scheduledToday = this.isHabitScheduledForDate(habit, today);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentCompletions = completionsList.filter(c => c.date >= thirtyDaysAgo.toISOString().split("T")[0]);

      let scheduledDays = 0;
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        if (this.isHabitScheduledForDate(habit, date.toISOString().split("T")[0])) {
          scheduledDays++;
        }
      }

      const completionRate = scheduledDays > 0
        ? (recentCompletions.length / scheduledDays) * 100
        : 0;

      return {
        ...habit,
        streak,
        completions: completionsList,
        completedToday,
        scheduledToday,
        completionRate,
      };
    }));
  }

  // HELPERS
  private isHabitScheduledForDate(habit: Habit, dateStr: string): boolean {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();

    switch (habit.frequency) {
      case "daily":
        return true;
      case "alternate":
        const createdDate = new Date(habit.createdAt);
        const daysDiff = Math.floor((date.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff % 2 === 0;
      case "weekly":
        return dayOfWeek === 1;
      case "custom":
        return true;
      default:
        return false;
    }
  }

  private async updateStreakForCompletion(habitId: string, date: string): Promise<void> {
    const habit = await this.getHabit(habitId);
    if (!habit) return;

    const streak = await this.getStreak(habitId);
    if (!streak) return;

    const completionDate = new Date(date);
    let newStreak = 1;

    if (streak.lastCompletedDate) {
      const lastDate = new Date(streak.lastCompletedDate);
      const daysBetween = Math.floor((completionDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (habit.frequency === "alternate") {
        if (daysBetween === 2) {
          newStreak = streak.currentStreak + 1;
        } else if (daysBetween === 1) {
          newStreak = streak.currentStreak;
        }
      } else if (habit.frequency === "daily") {
        if (daysBetween === 1) {
          newStreak = streak.currentStreak + 1;
        } else if (daysBetween === 0) {
          newStreak = streak.currentStreak;
        }
      }
    }

    await this.updateStreak(habitId, {
      currentStreak: newStreak,
      longestStreak: Math.max(streak.longestStreak, newStreak),
      lastCompletedDate: date,
    });
  }

  private async recalculateStreak(habitId: string): Promise<void> {
    const completionsList = await this.getHabitCompletions(habitId);
    const habit = await this.getHabit(habitId);

    if (!habit || completionsList.length === 0) {
      await this.updateStreak(habitId, {
        currentStreak: 0,
        lastCompletedDate: null,
      });
      return;
    }

    completionsList.sort((a, b) => b.date.localeCompare(a.date));

    let currentStreak = 1;
    let longestStreak = 1;
    let tempStreak = 1;

    for (let i = 1; i < completionsList.length; i++) {
      const currentDate = new Date(completionsList[i].date);
      const prevDate = new Date(completionsList[i - 1].date);
      const daysBetween = Math.floor((prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

      const expectedGap = habit.frequency === "alternate" ? 2 : 1;

      if (daysBetween === expectedGap) {
        tempStreak++;
        if (i === completionsList.length - 1 || completionsList[i + 1]) {
          currentStreak = tempStreak;
        }
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    await this.updateStreak(habitId, {
      currentStreak,
      longestStreak,
      lastCompletedDate: completionsList[0].date,
    });
  }
}

export const storage = new PostgresStorage();

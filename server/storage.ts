/// <reference types="node" />
import { 
    type Habit, 
    type InsertHabit,
    type HabitCompletion,
    type InsertCompletion,
    type Streak,
    type Notification,
    type InsertNotification,
    type HabitWithStats,
    type DailyStats
  } from "../shared/schema";
  import { randomUUID } from "node:crypto";
  
  export interface IStorage {
    // Habits
    getHabits(): Promise<Habit[]>;
    getHabit(id: string): Promise<Habit | undefined>;
    createHabit(habit: InsertHabit): Promise<Habit>;
    updateHabit(id: string, habit: Partial<InsertHabit>): Promise<Habit | undefined>;
    deleteHabit(id: string): Promise<boolean>;
    
    // Completions
    getHabitCompletions(habitId: string, startDate?: string, endDate?: string): Promise<HabitCompletion[]>;
    addCompletion(completion: InsertCompletion): Promise<HabitCompletion>;
    removeCompletion(habitId: string, date: string): Promise<boolean>;
    
    // Streaks
    getStreak(habitId: string): Promise<Streak | undefined>;
    updateStreak(habitId: string, streak: Partial<Streak>): Promise<Streak>;
    
    // Notifications
    getNotifications(limit?: number): Promise<Notification[]>;
    addNotification(notification: InsertNotification): Promise<Notification>;
    markNotificationRead(id: string): Promise<boolean>;
    
    // Analytics
    getDailyStats(startDate: string, endDate: string): Promise<DailyStats[]>;
    getHabitsWithStats(): Promise<HabitWithStats[]>;
  }
  
  export class MemStorage implements IStorage {
    private habits: Map<string, Habit> = new Map();
    private completions: Map<string, HabitCompletion> = new Map();
    private streaks: Map<string, Streak> = new Map();
    private notifications: Map<string, Notification> = new Map();
  
    constructor() {
      // Removed hardcoded seed data - habits will be created by users
    }
  

  
    async getHabits(): Promise<Habit[]> {
      return Array.from(this.habits.values()).filter(h => h.isActive);
    }
  
    async getHabit(id: string): Promise<Habit | undefined> {
      return this.habits.get(id);
    }
  
    async createHabit(habit: InsertHabit): Promise<Habit> {
      const id = randomUUID();
      const newHabit: Habit = {
        ...habit,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Habit;
      
      this.habits.set(id, newHabit);
      
      // Initialize streak
      this.streaks.set(id, {
        id: randomUUID(),
        habitId: id,
        currentStreak: 0,
        longestStreak: 0,
        lastCompletedDate: null,
        updatedAt: new Date(),
      });
  
      return newHabit;
    }
  
        async updateHabit(id: string, habit: Partial<InsertHabit>): Promise<Habit | undefined> {
      const existing = this.habits.get(id);
      if (!existing) return undefined;

      const updated = { ...existing, ...habit, updatedAt: new Date() } as Habit;
      this.habits.set(id, updated);
      return updated;
    }
  
    async deleteHabit(id: string): Promise<boolean> {
      const habit = this.habits.get(id);
      if (!habit) return false;
      
      // Soft delete
      habit.isActive = false;
      habit.updatedAt = new Date();
      this.habits.set(id, habit);
      return true;
    }
  
    async getHabitCompletions(habitId: string, startDate?: string, endDate?: string): Promise<HabitCompletion[]> {
      return Array.from(this.completions.values())
        .filter(c => c.habitId === habitId)
        .filter(c => !startDate || c.date >= startDate)
        .filter(c => !endDate || c.date <= endDate)
        .sort((a, b) => b.date.localeCompare(a.date));
    }
  
    async addCompletion(completion: InsertCompletion): Promise<HabitCompletion> {
      const id = randomUUID();
      const newCompletion: HabitCompletion = {
        ...completion,
        id,
        completedAt: new Date(),
      } as HabitCompletion;
      
      this.completions.set(id, newCompletion);
      
      // Update streak
      await this.updateStreakForCompletion(completion.habitId as string, completion.date as string);
      
      return newCompletion;
    }
  
    async removeCompletion(habitId: string, date: string): Promise<boolean> {
      const completion = Array.from(this.completions.values())
        .find(c => c.habitId === habitId && c.date === date);
      
      if (!completion) return false;
      
      this.completions.delete(completion.id);
      await this.recalculateStreak(habitId);
      return true;
    }
  
    async getStreak(habitId: string): Promise<Streak | undefined> {
      return this.streaks.get(habitId);
    }
  
    async updateStreak(habitId: string, streak: Partial<Streak>): Promise<Streak> {
      const existing = this.streaks.get(habitId);
      const updated = { ...existing, ...streak, updatedAt: new Date() } as Streak;
      this.streaks.set(habitId, updated);
      return updated;
    }
  
    async getNotifications(limit = 10): Promise<Notification[]> {
      return Array.from(this.notifications.values())
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);
    }
  
    async addNotification(notification: InsertNotification): Promise<Notification> {
      const id = randomUUID();
      const newNotification: Notification = {
        ...notification,
        id,
        createdAt: new Date(),
      } as Notification;
      
      this.notifications.set(id, newNotification);
      return newNotification;
    }
  
    async markNotificationRead(id: string): Promise<boolean> {
      const notification = this.notifications.get(id);
      if (!notification) return false;
      
      notification.isRead = true;
      this.notifications.set(id, notification);
      return true;
    }
  
    async getDailyStats(startDate: string, endDate: string): Promise<DailyStats[]> {
      const habits = await this.getHabits();
      const stats: DailyStats[] = [];
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const completions = Array.from(this.completions.values())
          .filter(c => c.date === dateStr);
        
        const scheduledHabits = habits.filter(h => this.isHabitScheduledForDate(h, dateStr));
        
        stats.push({
          date: dateStr,
          totalHabits: scheduledHabits.length,
          completedHabits: completions.length,
          completionRate: scheduledHabits.length > 0 ? (completions.length / scheduledHabits.length) * 100 : 0,
          streakCount: 0, // Calculate active streaks
        });
      }
      
      return stats;
    }
  
    async getHabitsWithStats(): Promise<HabitWithStats[]> {
      const habits = await this.getHabits();
      const today = new Date().toISOString().split('T')[0];
      
      const habitsWithStats = await Promise.all(habits.map(async (habit) => {
        const streak = await this.getStreak(habit.id) || {
          id: randomUUID(),
          habitId: habit.id,
          currentStreak: 0,
          longestStreak: 0,
          lastCompletedDate: null,
          updatedAt: new Date(),
        };
        
        const completions = await this.getHabitCompletions(habit.id);
        const completedToday = completions.some(c => c.date === today);
        const scheduledToday = this.isHabitScheduledForDate(habit, today);
        
        // Calculate completion rate for last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentCompletions = completions.filter(c => c.date >= thirtyDaysAgo.toISOString().split('T')[0]);
        
        let scheduledDays = 0;
        for (let i = 0; i < 30; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          if (this.isHabitScheduledForDate(habit, date.toISOString().split('T')[0])) {
            scheduledDays++;
          }
        }
        
        const completionRate = scheduledDays > 0 ? (recentCompletions.length / scheduledDays) * 100 : 0;
        
        return {
          ...habit,
          streak,
          completions,
          completedToday,
          scheduledToday,
          completionRate,
        };
      }));
      
      return habitsWithStats;
    }
  
    private isHabitScheduledForDate(habit: Habit, dateStr: string): boolean {
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      switch (habit.frequency) {
        case 'daily':
          return true;
        case 'alternate':
          // Check if this date should have the habit based on creation date
          const createdDate = new Date(habit.createdAt);
          const daysDiff = Math.floor((date.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff % 2 === 0;
        case 'weekly':
          return dayOfWeek === 1; // Monday by default
        case 'custom':
          // Handle custom schedules
          return true; // Simplified for now
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
  
        if (habit.frequency === 'alternate') {
          // For alternate day habits, check if the gap is correct
          if (daysBetween === 2) {
            newStreak = streak.currentStreak + 1;
          } else if (daysBetween === 1) {
            // Same or consecutive day, maintain streak
            newStreak = streak.currentStreak;
          }
        } else if (habit.frequency === 'daily') {
          if (daysBetween === 1) {
            newStreak = streak.currentStreak + 1;
          } else if (daysBetween === 0) {
            // Same day, maintain streak
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
      const completions = await this.getHabitCompletions(habitId);
      const habit = await this.getHabit(habitId);
      
      if (!habit || completions.length === 0) {
        await this.updateStreak(habitId, {
          currentStreak: 0,
          lastCompletedDate: null,
        });
        return;
      }
  
      // Sort completions by date
      completions.sort((a, b) => b.date.localeCompare(a.date));
      
      let currentStreak = 1;
      let longestStreak = 1;
      let tempStreak = 1;
  
      for (let i = 1; i < completions.length; i++) {
        const currentDate = new Date(completions[i].date);
        const prevDate = new Date(completions[i - 1].date);
        const daysBetween = Math.floor((prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
  
        const expectedGap = habit.frequency === 'alternate' ? 2 : 1;
        
        if (daysBetween === expectedGap) {
          tempStreak++;
          if (i === completions.length - 1 || completions[i + 1]) {
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
        lastCompletedDate: completions[0].date,
      });
    }
  }
  
  export const storage = new MemStorage();
  
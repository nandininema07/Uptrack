import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const habits = pgTable("habits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  frequency: text("frequency").notNull(), // "daily", "alternate", "weekly", "custom"
  customSchedule: jsonb("custom_schedule"), // For custom frequency patterns
  reminderTime: text("reminder_time"), // HH:MM format
  isActive: boolean("is_active").default(true).notNull(),
  color: text("color").default("#6366F1"),
  icon: text("icon").default("fa-star"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const habitCompletions = pgTable("habit_completions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  habitId: varchar("habit_id").references(() => habits.id).notNull(),
  completedAt: timestamp("completed_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  notes: text("notes"),
});

export const streaks = pgTable("streaks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  habitId: varchar("habit_id").references(() => habits.id).notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  lastCompletedDate: text("last_completed_date"), // YYYY-MM-DD format
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // "reminder", "celebration", "motivation"
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  scheduledFor: timestamp("scheduled_for"),
  habitId: varchar("habit_id").references(() => habits.id),
});

export const insertHabitSchema = createInsertSchema(habits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCompletionSchema = createInsertSchema(habitCompletions).omit({
  id: true,
  completedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type Habit = typeof habits.$inferSelect;
export type InsertHabit = z.infer<typeof insertHabitSchema>;
export type HabitCompletion = typeof habitCompletions.$inferSelect;
export type InsertCompletion = z.infer<typeof insertCompletionSchema>;
export type Streak = typeof streaks.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Utility types for frontend
export type HabitWithStats = Habit & {
  streak: Streak;
  completions: HabitCompletion[];
  completedToday: boolean;
  scheduledToday: boolean;
  completionRate: number;
};

export type DailyStats = {
  date: string;
  totalHabits: number;
  completedHabits: number;
  completionRate: number;
  streakCount: number;
};

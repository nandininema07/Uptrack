import { Router } from "express";
import { storage } from "./storage.js";
import { insertHabitSchema, insertCompletionSchema, insertNotificationSchema } from "./schema.js";
import { z } from "zod";

export async function registerRoutes() {
  const router = Router();

  // Habits
  router.get("/habits", async (_req, res) => {
    const habits = await storage.getHabitsWithStats();
    res.json(habits);
  });

  router.get("/habits/:id", async (req, res) => {
    const habit = await storage.getHabit(req.params.id);
    if (!habit) return res.status(404).json({ message: "Habit not found" });
    res.json(habit);
  });

  router.post("/habits", async (req, res) => {
    try {
      const validatedData = insertHabitSchema.parse(req.body);
      const habit = await storage.createHabit(validatedData);
      res.status(201).json(habit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid habit data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create habit" });
    }
  });

  router.patch("/habits/:id", async (req, res) => {
    try {
      const validatedData = insertHabitSchema.partial().parse(req.body);
      const habit = await storage.updateHabit(req.params.id, validatedData);
      if (!habit) return res.status(404).json({ message: "Habit not found" });
      res.json(habit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid habit data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update habit" });
    }
  });

  router.delete("/habits/:id", async (req, res) => {
    const success = await storage.deleteHabit(req.params.id);
    if (!success) return res.status(404).json({ message: "Habit not found" });
    res.status(204).send();
  });

  // Completions
  router.get("/habits/:id/completions", async (req, res) => {
    const { startDate, endDate } = req.query;
    const completions = await storage.getHabitCompletions(
      req.params.id,
      startDate as string,
      endDate as string
    );
    res.json(completions);
  });

  router.post("/habits/:id/completions", async (req, res) => {
    try {
      const completionData = { ...req.body, habitId: req.params.id };
      const validatedData = insertCompletionSchema.parse(completionData);
      const completion = await storage.addCompletion(validatedData);
      res.status(201).json(completion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid completion data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add completion" });
    }
  });

  router.delete("/habits/:id/completions/:date", async (req, res) => {
    const success = await storage.removeCompletion(req.params.id, req.params.date);
    if (!success) return res.status(404).json({ message: "Completion not found" });
    res.status(204).send();
  });

  // Analytics
  router.get("/analytics/daily-stats", async (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate are required" });
    }
    const stats = await storage.getDailyStats(startDate as string, endDate as string);
    res.json(stats);
  });

  // Notifications
  router.get("/notifications", async (req, res) => {
    const { limit } = req.query;
    const notifications = await storage.getNotifications(
      limit ? parseInt(limit as string) : undefined
    );
    res.json(notifications);
  });

  router.post("/notifications", async (req, res) => {
    try {
      const validatedData = insertNotificationSchema.parse(req.body);
      const notification = await storage.addNotification(validatedData);
      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid notification data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  router.patch("/notifications/:id/read", async (req, res) => {
    const success = await storage.markNotificationRead(req.params.id);
    if (!success) return res.status(404).json({ message: "Notification not found" });
    res.status(204).send();
  });

  return router;
}

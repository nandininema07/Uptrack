import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertHabitSchema, insertCompletionSchema, insertNotificationSchema } from "../shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Habits endpoints
  app.get("/api/habits", async (req, res) => {
    try {
      const habits = await storage.getHabitsWithStats();
      res.json(habits);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch habits" });
    }
  });

  app.get("/api/habits/:id", async (req, res) => {
    try {
      const habit = await storage.getHabit(req.params.id);
      if (!habit) {
        return res.status(404).json({ message: "Habit not found" });
      }
      res.json(habit);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch habit" });
    }
  });

  app.post("/api/habits", async (req, res) => {
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

  app.patch("/api/habits/:id", async (req, res) => {
    try {
      const validatedData = insertHabitSchema.partial().parse(req.body);
      const habit = await storage.updateHabit(req.params.id, validatedData);
      if (!habit) {
        return res.status(404).json({ message: "Habit not found" });
      }
      res.json(habit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid habit data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update habit" });
    }
  });

  app.delete("/api/habits/:id", async (req, res) => {
    try {
      const success = await storage.deleteHabit(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Habit not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete habit" });
    }
  });

  // Completions endpoints
  app.get("/api/habits/:id/completions", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const completions = await storage.getHabitCompletions(
        req.params.id,
        startDate as string,
        endDate as string
      );
      res.json(completions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch completions" });
    }
  });

  app.post("/api/habits/:id/completions", async (req, res) => {
    try {
      const completionData = {
        ...req.body,
        habitId: req.params.id,
      };
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

  app.delete("/api/habits/:id/completions/:date", async (req, res) => {
    try {
      const success = await storage.removeCompletion(req.params.id, req.params.date);
      if (!success) {
        return res.status(404).json({ message: "Completion not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove completion" });
    }
  });

  // Analytics endpoints
  app.get("/api/analytics/daily-stats", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required" });
      }
      const stats = await storage.getDailyStats(startDate as string, endDate as string);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily stats" });
    }
  });

  // Notifications endpoints
  app.get("/api/notifications", async (req, res) => {
    try {
      const { limit } = req.query;
      const notifications = await storage.getNotifications(
        limit ? parseInt(limit as string) : undefined
      );
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications", async (req, res) => {
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

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const success = await storage.markNotificationRead(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

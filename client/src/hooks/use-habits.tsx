import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { type HabitWithStats, type InsertHabit, type InsertCompletion } from "../../../shared/schema";
import { toast } from "../hooks/use-toast";

export function useHabits() {
  return useQuery<HabitWithStats[]>({
    queryKey: ["habits"],  // simple key
    queryFn: () => apiRequest("GET", "/api/habits").then(res => res.json()), // actual fetch URL includes /api
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habit: InsertHabit) => {
      const response = await apiRequest("POST", "/api/habits", habit);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] }); // invalidate simple key
      toast({
        title: "Success!",
        description: "Your new habit has been created.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create habit. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...habit }: { id: string } & Partial<InsertHabit>) => {
      const response = await apiRequest("PATCH", `/api/habits/${id}`, habit);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      toast({
        title: "Success!",
        description: "Habit updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update habit. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/habits/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      toast({
        title: "Success!",
        description: "Habit deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete habit. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useToggleHabitCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ habitId, date, completed }: {
      habitId: string;
      date: string;
      completed: boolean;
    }) => {
      if (completed) {
        const completion: InsertCompletion = { habitId, date };
        const response = await apiRequest("POST", `/api/habits/${habitId}/completions`, completion);
        return response.json();
      } else {
        await apiRequest("DELETE", `/api/habits/${habitId}/completions/${date}`);
      }
    },
    onSuccess: (_, { completed }) => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });

      if (completed) {
        toast({
          title: "Great job! 🎉",
          description: "Habit completed for today.",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update habit completion. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiRequest("GET", "/api/notifications").then(res => res.json()),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDailyStats(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["daily-stats", startDate, endDate],
    queryFn: () =>
      apiRequest("GET", `/api/analytics/daily-stats?startDate=${startDate}&endDate=${endDate}`).then(res =>
        res.json()
      ),
  });
}

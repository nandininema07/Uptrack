import { type HabitWithStats, type Habit } from "../../../shared/schema";

export function isHabitScheduledForDate(habit: Habit, dateStr: string): boolean {
  const date = new Date(dateStr);
  
  switch (habit.frequency) {
    case 'daily':
      return true;
    case 'alternate':
      const createdDate = new Date(habit.createdAt);
      const daysDiff = Math.floor((date.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff % 2 === 0;
    case 'weekly':
      return date.getDay() === 1; // Monday by default
    case 'custom':
      // Handle custom schedules
      if (habit.customSchedule) {
        // Implement custom schedule logic
        return true;
      }
      return false;
    default:
      return false;
  }
}

export function getHabitStatusForDate(habit: HabitWithStats, dateStr: string): 'completed' | 'pending' | 'missed' | 'not-scheduled' {
  if (!isHabitScheduledForDate(habit, dateStr)) {
    return 'not-scheduled';
  }
  
  const completion = habit.completions.find(c => c.date === dateStr);
  if (completion) {
    return 'completed';
  }
  
  const targetDate = new Date(dateStr);
  const currentDate = new Date();
  
  if (targetDate < currentDate) {
    return 'missed';
  } else if (targetDate.getTime() === currentDate.getTime()) {
    return 'pending';
  } else {
    return 'not-scheduled';
  }
}

export function calculateCompletionRate(habit: HabitWithStats, days: number = 30): number {
  const today = new Date();
  let scheduledDays = 0;
  let completedDays = 0;
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    if (isHabitScheduledForDate(habit, dateStr)) {
      scheduledDays++;
      if (habit.completions.some(c => c.date === dateStr)) {
        completedDays++;
      }
    }
  }
  
  return scheduledDays > 0 ? (completedDays / scheduledDays) * 100 : 0;
}

export function getStreakEmoji(streak: number): string {
  if (streak >= 30) return '🔥';
  if (streak >= 14) return '⚡';
  if (streak >= 7) return '💪';
  if (streak >= 3) return '🌟';
  return '🎯';
}

export function getHabitCategoryIcon(category: string): string {
  const categoryIcons: Record<string, string> = {
    'Health & Fitness': 'fa-dumbbell',
    'Learning & Education': 'fa-book',
    'Personal Development': 'fa-user',
    'Work & Productivity': 'fa-briefcase',
    'Social & Relationships': 'fa-users',
    'Other': 'fa-star',
  };
  
  return categoryIcons[category] || 'fa-star';
}

export function getHabitCategoryColor(category: string): string {
  const categoryColors: Record<string, string> = {
    'Health & Fitness': '#3B82F6', // Blue
    'Learning & Education': '#10B981', // Green
    'Personal Development': '#8B5CF6', // Purple
    'Work & Productivity': '#F59E0B', // Orange
    'Social & Relationships': '#EC4899', // Pink
    'Other': '#6366F1', // Indigo
  };
  
  return categoryColors[category] || '#6366F1';
}

export function formatTime(time: string): string {
  if (!time) return '';
  
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  
  return `${displayHour}:${minutes} ${ampm}`;
}

export function getTodaysScheduledHabits(habits: HabitWithStats[]): HabitWithStats[] {
  const today = new Date().toISOString().split('T')[0];
  return habits.filter(habit => isHabitScheduledForDate(habit, today));
}

export function getHabitCompletionStats(habits: HabitWithStats[]) {
  // const today = new Date().toISOString().split('T')[0];
  const scheduledToday = getTodaysScheduledHabits(habits);
  const completedToday = scheduledToday.filter(habit => habit.completedToday);
  
  return {
    total: scheduledToday.length,
    completed: completedToday.length,
    completionRate: scheduledToday.length > 0 ? (completedToday.length / scheduledToday.length) * 100 : 0,
    longestStreak: Math.max(...habits.map(h => h.streak?.currentStreak || 0), 0),
  };
}

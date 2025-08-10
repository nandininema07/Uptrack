import { useState } from "react";
import { type HabitWithStats } from "../../../shared/schema";
import { useToggleHabitCompletion } from "../hooks/use-habits";
import { getStreakEmoji, formatTime, getHabitStatusForDate } from "../lib/habits-utils";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface HabitCardProps {
  habit: HabitWithStats;
  date?: string;
  showProgress?: boolean;
  onEdit?: () => void;
}

export default function HabitCard({ 
  habit, 
  date = new Date().toISOString().split('T')[0],
  showProgress = false,
  onEdit 
}: HabitCardProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const toggleCompletion = useToggleHabitCompletion();
  
  const status = getHabitStatusForDate(habit, date);
  const isCompleted = status === 'completed';
  const isPending = status === 'pending';
  const isScheduled = status !== 'not-scheduled';
  
  const handleToggle = async () => {
    if (!isScheduled || isCompleting) return;
    
    setIsCompleting(true);
    
    try {
      await toggleCompletion.mutateAsync({
        habitId: habit.id,
        date,
        completed: !isCompleted,
      });
      
      // Add completion animation
      const button = document.querySelector(`[data-habit-id="${habit.id}"] .completion-button`);
      if (button && !isCompleted) {
        button.classList.add('completion-pulse');
        setTimeout(() => {
          button.classList.remove('completion-pulse');
        }, 600);
      }
    } catch (error) {
      console.error('Failed to toggle habit completion:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  if (!isScheduled) {
    return null;
  }

  return (
    <div 
      className={cn(
        "habit-card bg-card rounded-xl p-4 border border-border shadow-sm transition-all duration-200",
        isCompleted && "opacity-60"
      )}
      data-habit-id={habit.id}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "completion-button w-6 h-6 p-0 rounded-full border-2 transition-all",
              isCompleted 
                ? "bg-secondary border-secondary text-white hover:bg-secondary/90" 
                : "border-gray-300 dark:border-gray-600 hover:border-primary",
              isCompleting && "animate-pulse"
            )}
            onClick={handleToggle}
            disabled={!isScheduled || isCompleting}
          >
            {isCompleted && <i className="fas fa-check text-xs" />}
          </Button>
          
          <div className="flex-1 min-w-0">
            <h4 className={cn(
              "font-medium text-card-foreground truncate",
              isCompleted && "line-through"
            )}>
              {habit.name}
            </h4>
            
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span className="capitalize">{habit.frequency}</span>
              {habit.frequency !== 'daily' && <span>•</span>}
              {habit.streak?.currentStreak > 0 && (
                <>
                  <span>{getStreakEmoji(habit.streak.currentStreak)} {habit.streak.currentStreak} days</span>
                  <span>•</span>
                </>
              )}
              {habit.reminderTime && (
                <span>{formatTime(habit.reminderTime)}</span>
              )}
            </div>
            
            {showProgress && (
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">This week</span>
                  <span className="font-medium">{Math.round(habit.completionRate)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div 
                    className="bg-secondary h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${habit.completionRate}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="text-right">
            {habit.reminderTime && (
              <div className="text-xs text-muted-foreground">
                {formatTime(habit.reminderTime)}
              </div>
            )}
            <Badge 
              variant={
                isCompleted ? "default" : 
                isPending ? "secondary" : 
                "outline"
              }
              className="text-xs"
            >
              {isCompleted ? "Completed" : isPending ? "Pending" : "Missed"}
            </Badge>
          </div>
          
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={onEdit}
            >
              <i className="fas fa-ellipsis-v text-sm" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

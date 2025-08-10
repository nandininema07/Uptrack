import { useState } from "react";
import { useHabits } from "../hooks/use-habits";
import { isHabitScheduledForDate, getHabitStatusForDate } from "../lib/habits-utils";
// import { type HabitWithStats } from "../../../shared/schema";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { type HabitWithStats } from "../../../shared/schema";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { data: habits = [], isLoading } = useHabits() as { data: HabitWithStats[], isLoading: boolean };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const changeMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonth = new Date(year, month, 0);
      const dayNumber = prevMonth.getDate() - startingDayOfWeek + i + 1;
      days.push({
        day: dayNumber,
        isCurrentMonth: false,
        date: new Date(year, month - 1, dayNumber),
      });
    }

    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        date: new Date(year, month, day),
      });
    }

    // Add empty cells for days after the last day of the month
    const remainingCells = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingCells; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        date: new Date(year, month + 1, day),
      });
    }

    return days;
  };

  const getHabitStatusForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const scheduledHabits = habits.filter(habit => isHabitScheduledForDate(habit, dateStr));
    const completedHabits = scheduledHabits.filter(habit => 
      habit.completions.some((completion: any) => completion.date === dateStr)
    );

    return {
      scheduled: scheduledHabits.length,
      completed: completedHabits.length,
      completionRate: scheduledHabits.length > 0 ? (completedHabits.length / scheduledHabits.length) * 100 : 0,
    };
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getSelectedDateHabits = () => {
    if (!selectedDate) return [];
    return habits.filter(habit => isHabitScheduledForDate(habit, selectedDate));
  };

  const days = getDaysInMonth();
  const selectedDateHabits = getSelectedDateHabits();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 space-y-4">
          <div className="h-8 bg-muted rounded animate-pulse" />
          <div className="h-8 bg-muted rounded animate-pulse" />
          <div className="h-64 bg-muted rounded-xl animate-pulse" />
          <div className="h-32 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-card-foreground">Calendar</h1>
            <p className="text-sm text-muted-foreground">Habit tracking overview</p>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => changeMonth(-1)}
            className="p-2 hover:bg-accent rounded-full"
          >
            <i className="fas fa-chevron-left" />
          </Button>
          <h2 className="text-xl font-semibold text-card-foreground">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => changeMonth(1)}
            className="p-2 hover:bg-accent rounded-full"
          >
            <i className="fas fa-chevron-right" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <Card>
          <CardContent className="p-4">
            {/* Days Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {daysOfWeek.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((dayInfo, index) => {
                const dateStr = dayInfo.date.toISOString().split('T')[0];
                const { scheduled, completed } = getHabitStatusForDay(dayInfo.date);
                const todayFlag = isToday(dayInfo.date);
                
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(selectedDate === dateStr ? null : dateStr)}
                    className={`
                      relative text-center py-2 text-sm transition-colors rounded-lg
                      ${!dayInfo.isCurrentMonth 
                        ? 'text-muted-foreground/40' 
                        : 'text-card-foreground hover:bg-accent'
                      }
                      ${todayFlag ? 'bg-primary text-white font-medium' : ''}
                      ${selectedDate === dateStr ? 'ring-2 ring-primary' : ''}
                    `}
                  >
                    {dayInfo.day}
                    
                    {/* Habit completion indicators */}
                    {dayInfo.isCurrentMonth && scheduled > 0 && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex space-x-0.5">
                        {Array.from({ length: Math.min(scheduled, 3) }, (_, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${
                              i < completed 
                                ? todayFlag ? 'bg-white' : 'bg-secondary'
                                : todayFlag ? 'bg-white/50' : 'bg-muted'
                            }`}
                          />
                        ))}
                        {scheduled > 3 && (
                          <div className={`w-1 h-1 rounded-full ${
                            todayFlag ? 'bg-white/70' : 'bg-muted'
                          }`} />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-secondary rounded-full" />
                <span className="text-muted-foreground">Completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-warning rounded-full" />
                <span className="text-muted-foreground">Partial</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-muted rounded-full" />
                <span className="text-muted-foreground">Missed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-primary rounded-full" />
                <span className="text-muted-foreground">Today</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Details */}
        {selectedDate && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateHabits.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No habits scheduled for this date
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedDateHabits.map((habit) => {
                    const status = getHabitStatusForDate(habit, selectedDate);
                    
                    return (
                      <div key={habit.id} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${habit.color as string}20` }}
                          >
                            <i 
                              className={`fas ${habit.icon} text-xs`}
                              style={{ color: habit.color as string }}
                            />
                          </div>
                          <div>
                            <h4 className="font-medium text-card-foreground">
                              {habit.name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {habit.reminderTime && `${habit.reminderTime} • `}
                              {habit.frequency === 'daily' ? 'Daily' : 
                               habit.frequency === 'alternate' ? 'Alternate days' :
                               habit.frequency === 'weekly' ? 'Weekly' : 'Custom'}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant={
                            status === 'completed' ? 'default' :
                            status === 'pending' ? 'secondary' :
                            status === 'missed' ? 'destructive' : 'outline'
                          }
                        >
                          {status === 'completed' ? 'Completed' :
                           status === 'pending' ? 'Pending' :
                           status === 'missed' ? 'Missed' : 'Not Scheduled'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

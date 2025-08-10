import { useState } from "react";
import { useHabits, useDailyStats } from "../hooks/use-habits";
import { getHabitCompletionStats } from "../lib/habits-utils";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
// import ProgressRing from "../components/progress-ring";

type TimePeriod = "week" | "month" | "year";

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("week");
  const { data: habits = [], isLoading } = useHabits();
  
  // Calculate date range based on selected period
  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    
    switch (selectedPeriod) {
      case "week":
        start.setDate(end.getDate() - 7);
        break;
      case "month":
        start.setMonth(end.getMonth() - 1);
        break;
      case "year":
        start.setFullYear(end.getFullYear() - 1);
        break;
    }
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  const { startDate, endDate } = getDateRange();
  const { data: dailyStats = [] } = useDailyStats(startDate, endDate);
  
  const stats = getHabitCompletionStats(habits);
  
  // Calculate overall completion rate for the period
  const periodCompletionRate = dailyStats.length > 0 
    ? dailyStats.reduce((sum: number, day: any) => sum + day.completionRate, 0) / dailyStats.length 
    : 0;

  // Get last 7 days for the weekly chart
  const weeklyStats = dailyStats.slice(-7);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 space-y-4">
          <div className="h-8 bg-muted rounded animate-pulse" />
          <div className="flex space-x-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-8 w-16 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-muted rounded-xl animate-pulse" />
          <div className="h-48 bg-muted rounded-xl animate-pulse" />
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
            <h1 className="text-xl font-semibold text-card-foreground">Analytics</h1>
            <p className="text-sm text-muted-foreground">Your progress insights</p>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Time Period Selector */}
        <div className="flex bg-muted rounded-xl p-1">
          {[
            { key: "week", label: "Week" },
            { key: "month", label: "Month" },
            { key: "year", label: "Year" }
          ].map((period) => (
            <Button
              key={period.key}
              variant={selectedPeriod === period.key ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedPeriod(period.key as TimePeriod)}
              className="flex-1"
            >
              {period.label}
            </Button>
          ))}
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-primary to-purple-600 text-white border-0">
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {Math.round(periodCompletionRate)}%
              </div>
              <div className="text-sm text-white/80">Completion Rate</div>
              <div className="text-xs text-white/60 mt-1">
                {selectedPeriod === "week" ? "This week" : 
                 selectedPeriod === "month" ? "This month" : "This year"}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-secondary to-green-600 text-white border-0">
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.longestStreak}</div>
              <div className="text-sm text-white/80">Longest Streak</div>
              <div className="text-xs text-white/60 mt-1">All time best</div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {weeklyStats.map((day: any) => {
              const date = new Date(day.date);
              const dayName = weekDays[date.getDay()];
              
              return (
                <div key={day.date} className="flex items-center space-x-3">
                  <span className="text-sm text-muted-foreground w-8">
                    {dayName}
                  </span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        day.completionRate === 100 ? 'bg-secondary' :
                        day.completionRate >= 75 ? 'bg-primary' :
                        day.completionRate >= 50 ? 'bg-warning' : 'bg-destructive'
                      }`}
                      style={{ width: `${day.completionRate}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-card-foreground w-12 text-right">
                    {day.completedHabits}/{day.totalHabits}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Habit Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Habit Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {habits.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-chart-line text-xl text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No habits to analyze yet</p>
              </div>
            ) : (
              habits.map((habit) => (
                <div key={habit.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${habit.color ?? '#6366F1'}20` }}
                    >
                      <i 
                        className={`fas ${habit.icon} text-xs`}
                        style={{ color: habit.color ?? '#6366F1' }}
                      />
                    </div>
                    <div>
                      <div className="font-medium text-card-foreground">
                        {habit.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        🔥 {habit.streak?.currentStreak || 0} days
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${
                      habit.completionRate >= 80 ? 'text-secondary' :
                      habit.completionRate >= 60 ? 'text-primary' :
                      habit.completionRate >= 40 ? 'text-warning' : 'text-destructive'
                    }`}>
                      {Math.round(habit.completionRate)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {selectedPeriod} avg
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Insights */}
        {habits.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <i className="fas fa-lightbulb text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-card-foreground">
                    Best performing habit
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {habits.reduce((best, habit) => 
                      habit.completionRate > best.completionRate ? habit : best
                    ).name} with {Math.round(habits.reduce((best, habit) => 
                      habit.completionRate > best.completionRate ? habit : best
                    ).completionRate)}% completion rate
                  </p>
                </div>
              </div>
              
              {stats.longestStreak >= 7 && (
                <div className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <i className="fas fa-trophy text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-card-foreground">
                      Great streak!
                    </p>
                    <p className="text-xs text-muted-foreground">
                      You've maintained a {stats.longestStreak}-day streak. Keep it up!
                    </p>
                  </div>
                </div>
              )}
              
              {periodCompletionRate < 50 && (
                <div className="flex items-start space-x-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <i className="fas fa-target text-orange-600 dark:text-orange-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-card-foreground">
                      Room for improvement
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Try setting reminders or reducing the number of habits to focus on consistency.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

import { useState } from "react";
import { useHabits } from "../hooks/use-habits";
import { usePWA } from "../hooks/use-pwa";
import { useTheme } from "../hooks/use-theme";
import { getTodaysScheduledHabits, getHabitCompletionStats } from "../lib/habits-utils";

import { Button } from "../components/ui/button";
// import { Badge } from "../components/ui/badge";
import HabitCard from "../components/habit-card";
import ProgressRing from "../components/progress-ring";
import AddHabitModal from "../components/add-habit-modal";

export default function TodayPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const { data: habits = [], isLoading } = useHabits();
  const { theme, setTheme } = useTheme();
  const { showInstallBanner, installApp, dismissInstall } = usePWA();
  
  const todayHabits = getTodaysScheduledHabits(habits);
  const stats = getHabitCompletionStats(habits);
  const today = new Date();
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return "Good Morning!";
    if (hour < 17) return "Good Afternoon!";
    return "Good Evening!";
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 space-y-4">
          <div className="h-8 bg-muted rounded animate-pulse" />
          <div className="h-32 bg-muted rounded-2xl animate-pulse" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="fixed top-0 left-0 right-0 bg-primary text-white p-3 z-50">
          <div className="flex items-center justify-between max-w-sm mx-auto">
            <div className="flex items-center space-x-2">
              <i className="fas fa-download text-sm" />
              <span className="text-sm font-medium">Install HabitFlow</span>
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={installApp}
                className="text-xs px-3 py-1"
              >
                Install
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={dismissInstall}
                className="text-white/80 hover:text-white text-xs px-2"
              >
                ×
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-card-foreground">Today</h1>
            <p className="text-sm text-muted-foreground">
              {formatDate(today)}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2 text-muted-foreground hover:text-foreground rounded-full"
            >
              <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'} text-lg`} />
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Daily Progress Overview */}
        <div className="bg-gradient-to-r from-primary to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">{getGreeting()}</h2>
              <p className="text-white/80">Ready to build great habits?</p>
            </div>
            <ProgressRing
              progress={stats.completionRate}
              size={64}
              className="text-white"
            />
          </div>
          <div className="flex justify-between text-sm text-white/80">
            <span>{stats.completed} of {stats.total} completed</span>
            <span>🔥 {stats.longestStreak} day streak</span>
          </div>
        </div>

        {/* Today's Habits */}
        <div>
          <h3 className="text-lg font-semibold text-card-foreground mb-4">
            Today's Habits
          </h3>
          
          {todayHabits.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-calendar-day text-2xl text-muted-foreground" />
              </div>
              <h4 className="text-lg font-medium text-card-foreground mb-2">
                No habits scheduled for today
              </h4>
              <p className="text-muted-foreground mb-4">
                Add your first habit to get started
              </p>
              <Button
                onClick={() => setShowAddModal(true)}
                className="mx-auto"
              >
                <i className="fas fa-plus mr-2" />
                Add Your First Habit
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {todayHabits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  showProgress={false}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {todayHabits.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card rounded-xl p-4 text-center border border-border">
              <div className="text-2xl font-bold text-primary">
                {stats.longestStreak}
              </div>
              <div className="text-sm text-muted-foreground">Current Streak</div>
            </div>
            <div className="bg-card rounded-xl p-4 text-center border border-border">
              <div className="text-2xl font-bold text-secondary">
                {Math.round(stats.completionRate)}%
              </div>
              <div className="text-sm text-muted-foreground">Today</div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-4 z-30">
        <Button
          size="lg"
          onClick={() => setShowAddModal(true)}
          className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          <i className="fas fa-plus text-xl" />
        </Button>
      </div>

      {/* Add Habit Modal */}
      <AddHabitModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
      />
    </div>
  );
}

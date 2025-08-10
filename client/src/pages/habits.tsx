import { useState } from "react";
import { useHabits, useUpdateHabit, useDeleteHabit } from "../hooks/use-habits";
import { type HabitWithStats } from "../../../shared/schema";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../components/ui/alert-dialog";
import AddHabitModal from "../components/add-habit-modal";

const categories = ["All", "Health & Fitness", "Learning & Education", "Personal Development", "Work & Productivity", "Social & Relationships", "Other"];

export default function HabitsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [habitToDelete, setHabitToDelete] = useState<HabitWithStats | null>(null);

  const { data: habits = [], isLoading } = useHabits();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();

  // Filter habits based on search and category
  const filteredHabits = habits.filter(habit => {
    const matchesSearch = habit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         habit.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || habit.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDeleteHabit = async (habit: HabitWithStats) => {
    setHabitToDelete(habit);
  };

  const confirmDelete = async () => {
    if (habitToDelete) {
      try {
        await deleteHabit.mutateAsync(habitToDelete.id);
        setHabitToDelete(null);
      } catch (error) {
        console.error('Failed to delete habit:', error);
      }
    }
  };

  const handleToggleActive = async (habit: HabitWithStats) => {
    try {
      await updateHabit.mutateAsync({
        id: habit.id,
        isActive: !habit.isActive,
      });
    } catch (error) {
      console.error('Failed to toggle habit active state:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 space-y-4">
          <div className="h-8 bg-muted rounded animate-pulse" />
          <div className="h-12 bg-muted rounded-xl animate-pulse" />
          <div className="flex space-x-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-8 w-16 bg-muted rounded-full animate-pulse" />
            ))}
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
          ))}
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
            <h1 className="text-xl font-semibold text-card-foreground">My Habits</h1>
            <p className="text-sm text-muted-foreground">
              {habits.length} active habits
            </p>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Search and Filter */}
        <div>
          <div className="relative mb-4">
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search habits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted border-0 focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Category Filter */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Habits List */}
        {filteredHabits.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-search text-2xl text-muted-foreground" />
            </div>
            <h4 className="text-lg font-medium text-card-foreground mb-2">
              {searchQuery || selectedCategory !== "All" ? "No habits found" : "No habits yet"}
            </h4>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedCategory !== "All"
                ? "Try adjusting your search or filter"
                : "Create your first habit to get started"
              }
            </p>
            {!searchQuery && selectedCategory === "All" && (
              <Button onClick={() => setShowAddModal(true)}>
                <i className="fas fa-plus mr-2" />
                Add Your First Habit
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHabits.map((habit) => (
              <div key={habit.id} className="bg-card rounded-xl p-4 border border-border shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${habit.color}20` }}
                    >
                      <i
                        className={`fas ${habit.icon}`}
                        style={{ color: habit.color ?? "#6366F1" }}
                      />
                    </div>
                    <div>
                      <h4 className="font-medium text-card-foreground">{habit.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {habit.frequency === 'daily' ? 'Daily' :
                         habit.frequency === 'alternate' ? 'Alternate days' :
                         habit.frequency === 'weekly' ? 'Weekly' : 'Custom'}
                        {habit.reminderTime && ` at ${habit.reminderTime}`}
                      </p>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                        <i className="fas fa-ellipsis-v" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleToggleActive(habit)}>
                        <i className={`fas ${habit.isActive ? 'fa-pause' : 'fa-play'} mr-2`} />
                        {habit.isActive ? 'Pause' : 'Resume'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteHabit(habit)}
                        className="text-destructive focus:text-destructive"
                      >
                        <i className="fas fa-trash mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">This week</span>
                    <span className="font-medium text-card-foreground">
                      {Math.round(habit.completionRate)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-secondary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${habit.completionRate}%` }}
                    />
                  </div>
                </div>

                {/* Streak Info */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <span className="text-orange-500">
                      🔥 {habit.streak?.currentStreak || 0} days
                    </span>
                    <span className="text-muted-foreground">
                      Best: {habit.streak?.longestStreak || 0} days
                    </span>
                  </div>
                  <Badge variant={habit.isActive ? "default" : "secondary"}>
                    {habit.isActive ? "Active" : "Paused"}
                  </Badge>
                </div>
              </div>
            ))}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!habitToDelete} onOpenChange={() => setHabitToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Habit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{habitToDelete?.name}"? This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
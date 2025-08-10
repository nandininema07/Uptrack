import { useState } from "react";
import { useCreateHabit } from "../hooks/use-habits";
import { type InsertHabit } from "../../../shared/schema";
import { getHabitCategoryIcon, getHabitCategoryColor } from "../lib/habits-utils";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";

interface AddHabitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categories = [
  "Health & Fitness",
  "Learning & Education", 
  "Personal Development",
  "Work & Productivity",
  "Social & Relationships",
  "Other"
];

const frequencies = [
  { value: "daily", label: "Daily" },
  { value: "alternate", label: "Alternate Days" },
  { value: "weekly", label: "Weekly" },
  { value: "custom", label: "Custom" }
];

export default function AddHabitModal({ open, onOpenChange }: AddHabitModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    category: "Health & Fitness",
    description: "",
    frequency: "daily",
    reminderTime: "08:00",
    color: "#6366F1",
    icon: "fa-star",
  });

  const [selectedFrequency, setSelectedFrequency] = useState("daily");
  const createHabit = useCreateHabit();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) return;

    try {
      const habitData: InsertHabit = {
        name: formData.name.trim(),
        category: formData.category || "Other",
        description: formData.description || "",
        frequency: selectedFrequency as "daily" | "alternate" | "weekly" | "custom",
        customSchedule: null,
        reminderTime: formData.reminderTime || null,
        isActive: true,
        color: getHabitCategoryColor(formData.category || "Other"),
        icon: getHabitCategoryIcon(formData.category || "Other"),
      };

      await createHabit.mutateAsync(habitData);
      
      // Reset form
      setFormData({
        name: "",
        category: "Health & Fitness",
        description: "",
        frequency: "daily",
        reminderTime: "08:00",
        color: "#6366F1",
        icon: "fa-star",
      });
      setSelectedFrequency("daily");
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create habit:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="slide-up max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>Add New Habit</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Habit Name */}
          <div>
            <Label htmlFor="name">Habit Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g. Morning exercise"
              value={formData.name || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1"
              required
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    <div className="flex items-center space-x-2">
                      <i className={`fas ${getHabitCategoryIcon(category)} text-sm`} />
                      <span>{category}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="What is this habit about?"
              value={formData.description || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="mt-1"
              rows={2}
            />
          </div>

          {/* Frequency */}
          <div>
            <Label>Frequency</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {frequencies.map((frequency) => (
                <Button
                  key={frequency.value}
                  type="button"
                  variant={selectedFrequency === frequency.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFrequency(frequency.value)}
                  className="justify-center"
                >
                  {frequency.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Reminder Time */}
          <div>
            <Label htmlFor="reminderTime">Reminder Time</Label>
            <Input
              id="reminderTime"
              type="time"
              value={formData.reminderTime || "08:00"}
              onChange={(e) => setFormData(prev => ({ ...prev, reminderTime: e.target.value }))}
              className="mt-1"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createHabit.isPending || !formData.name?.trim()}
              className="flex-1"
            >
              {createHabit.isPending ? "Creating..." : "Create Habit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

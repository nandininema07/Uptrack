import { useLocation } from "wouter";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";

const navItems = [
  { path: "/", label: "Today", icon: "fa-home" },
  { path: "/habits", label: "Habits", icon: "fa-list" },
  { path: "/analytics", label: "Analytics", icon: "fa-chart-line" },
  { path: "/calendar", label: "Calendar", icon: "fa-calendar" },
  { path: "/settings", label: "Settings", icon: "fa-cog" },
];

export default function BottomNavigation() {
  const [location, navigate] = useLocation();

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-card border-t border-border px-4 py-2 z-40">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = location === item.path || (item.path === "/" && location === "/today");
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              className={cn(
                "flex flex-col items-center py-2 px-3 rounded-lg transition-colors duration-200 min-w-0",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => navigate(item.path)}
            >
              <i className={`fas ${item.icon} text-lg mb-1`} />
              <span className="text-xs font-medium truncate">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}

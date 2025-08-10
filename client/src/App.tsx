import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { ThemeProvider } from "./hooks/use-theme";
import { PWAProvider } from "./hooks/use-pwa";

// Pages
import TodayPage from "./pages/today";
import HabitsPage from "./pages/habits";
import AnalyticsPage from "./pages/analytics";
import CalendarPage from "./pages/calendar";
import SettingsPage from "./pages/settings";
import NotFound from "./pages/not-found";

// Components
import BottomNavigation from "./components/bottom-navigation";
import NotificationPanel from "./components/notification-panel";

function Router() {
  return (
    <div className="app-container bg-background text-foreground">
      <main className="pb-20">
        <Switch>
          <Route path="/" component={TodayPage} />
          <Route path="/today" component={TodayPage} />
          <Route path="/habits" component={HabitsPage} />
          <Route path="/analytics" component={AnalyticsPage} />
          <Route path="/calendar" component={CalendarPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      
      <BottomNavigation />
      <NotificationPanel />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <PWAProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </PWAProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

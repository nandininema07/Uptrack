import { useState } from "react";
import { useTheme } from "../hooks/use-theme";
import { usePWA } from "../hooks/use-pwa";
import { useHabits } from "../hooks/use-habits";
import { getHabitCompletionStats } from "../lib/habits-utils";
import { requestNotificationPermission, getInstallInstructions } from "../lib/pwa-utils";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Switch } from "../components/ui/switch";
// import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";

export default function SettingsPage() {
  const [showAbout, setShowAbout] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [notifications, setNotifications] = useState(Notification.permission === 'granted');
  
  const { theme, setTheme } = useTheme();
  const { isInstallable, isInstalled, isOnline, installApp } = usePWA();
  const { data: habits = [] } = useHabits();
  
  const stats = getHabitCompletionStats(habits);
  const installInstructions = getInstallInstructions();

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const permission = await requestNotificationPermission();
      setNotifications(permission === 'granted');
      if (permission === 'denied') {
        alert('Please enable notifications in your browser settings to receive habit reminders.');
      }
    } else {
      setNotifications(false);
    }
  };

  const exportData = () => {
    const data = {
      habits: habits,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habitflow-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-card-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">Customize your experience</p>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Profile Section */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">N</span>
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Nandini</h3>
                <p className="text-sm text-muted-foreground">Yellow!</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-card-foreground">{habits.length}</div>
                <div className="text-xs text-muted-foreground">Total Habits</div>
              </div>
              <div>
                <div className="text-lg font-bold text-card-foreground">
                  {Math.round(stats.completionRate)}%
                </div>
                <div className="text-xs text-muted-foreground">Success Rate</div>
              </div>
              <div>
                <div className="text-lg font-bold text-card-foreground">{stats.longestStreak}</div>
                <div className="text-xs text-muted-foreground">Best Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Settings */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-card-foreground">App Settings</h3>
          
          {/* Notifications */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                    <i className="fas fa-bell text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-card-foreground">Notifications</h4>
                    <p className="text-sm text-muted-foreground">Get reminders for your habits</p>
                  </div>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={handleNotificationToggle}
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                    <i className="fas fa-palette text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-card-foreground">Theme</h4>
                    <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                  </div>
                </div>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* PWA Installation */}
          {(isInstallable || !isInstalled) && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                      <i className="fas fa-download text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-card-foreground">Install App</h4>
                      <p className="text-sm text-muted-foreground">Add to home screen for easy access</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Installable: {isInstallable ? 'Yes' : 'No'} | 
                        Installed: {isInstalled ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={installApp}
                    disabled={!isInstallable}
                    size="sm"
                  >
                    {isInstallable ? 'Install' : 'Manual Install'}
                  </Button>
                </div>
                
                {/* Manual install instructions */}
                {!isInstallable && (
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Manual Installation:</strong>
                    </p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p><strong>Chrome/Edge:</strong> Click the install icon (📱) in the address bar</p>
                      <p><strong>Firefox:</strong> Click the install icon in the address bar</p>
                      <p><strong>Mobile:</strong> Use "Add to Home Screen" from browser menu</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* PWA Debug Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-card-foreground">PWA Status</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('PWA Debug Info:', {
                      isInstallable,
                      isInstalled,
                      isOnline,
                      userAgent: navigator.userAgent,
                      standalone: window.matchMedia('(display-mode: standalone)').matches,
                      serviceWorker: 'serviceWorker' in navigator
                    });
                  }}
                >
                  Debug Console
                </Button>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Service Worker:</strong> {'serviceWorker' in navigator ? 'Available' : 'Not Available'}</p>
                <p><strong>Manifest:</strong> <a href="/manifest.json" target="_blank" className="text-blue-500 hover:underline">View Manifest</a></p>
                <p><strong>Standalone Mode:</strong> {window.matchMedia('(display-mode: standalone)').matches ? 'Yes' : 'No'}</p>
                <p><strong>Online Status:</strong> {isOnline ? 'Online' : 'Offline'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Connection Status */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isOnline 
                      ? 'bg-green-100 dark:bg-green-900/20' 
                      : 'bg-red-100 dark:bg-red-900/20'
                  }`}>
                    <i className={`fas ${isOnline ? 'fa-wifi' : 'fa-wifi-slash'} ${
                      isOnline 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-card-foreground">Connection</h4>
                    <p className="text-sm text-muted-foreground">
                      {isOnline ? 'Connected to internet' : 'Working offline'}
                    </p>
                  </div>
                </div>
                <Badge variant={isOnline ? 'default' : 'destructive'}>
                  {isOnline ? 'Online' : 'Offline'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data & Privacy */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-card-foreground">Data & Privacy</h3>
          
          <Card>
            <CardContent className="p-4">
              <Button
                variant="outline"
                onClick={exportData}
                className="w-full justify-start"
              >
                <i className="fas fa-download mr-3" />
                Export Data
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <Button
                variant="outline"
                onClick={() => setShowPrivacy(true)}
                className="w-full justify-start"
              >
                <i className="fas fa-shield-alt mr-3" />
                Privacy Policy
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Help & Support */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-card-foreground">Help & Support</h3>
          
          <Card>
            <CardContent className="p-4">
              <Button
                variant="outline"
                onClick={() => setShowHelp(true)}
                className="w-full justify-start"
              >
                <i className="fas fa-question-circle mr-3" />
                Help & FAQ
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <Button
                variant="outline"
                onClick={() => setShowAbout(true)}
                className="w-full justify-start"
              >
                <i className="fas fa-info-circle mr-3" />
                About HabitFlow
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Install Instructions for Mobile */}
        {!isInstalled && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Install Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium text-card-foreground">
                  {installInstructions.platform}
                </p>
                <p className="text-sm text-muted-foreground">
                  {installInstructions.instructions}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* About Dialog */}
      <Dialog open={showAbout} onOpenChange={setShowAbout}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>About HabitFlow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-star text-white text-2xl" />
              </div>
              <h3 className="text-lg font-semibold text-card-foreground">HabitFlow</h3>
              <p className="text-sm text-muted-foreground">Version 1.0.0</p>
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Your personal habit tracker with smart streaks, progress visualization, and offline support. 
              Build better habits, one day at a time.
            </p>
            <div className="text-center">
              <Button variant="outline" size="sm" asChild>
                <a href="https://github.com/habitflow" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-github mr-2" />
                  View on GitHub
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Help & FAQ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div>
              <h4 className="font-medium text-card-foreground mb-2">How do I create a habit?</h4>
              <p className="text-sm text-muted-foreground">
                Tap the + button on any screen to create a new habit. Choose a name, category, 
                frequency, and reminder time.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-card-foreground mb-2">What are streaks?</h4>
              <p className="text-sm text-muted-foreground">
                Streaks track how many consecutive days you've completed a habit. For alternate-day 
                habits, the streak continues as long as you complete the habit on scheduled days.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-card-foreground mb-2">Can I use the app offline?</h4>
              <p className="text-sm text-muted-foreground">
                Yes! HabitFlow works offline and will sync your data when you're back online.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-card-foreground mb-2">How do I install the app?</h4>
              <p className="text-sm text-muted-foreground">
                Look for the install banner or use your browser's "Add to Home Screen" option 
                to install HabitFlow as a native app.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Dialog */}
      <Dialog open={showPrivacy} onOpenChange={setShowPrivacy}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Privacy Policy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div>
              <h4 className="font-medium text-card-foreground mb-2">Data Collection</h4>
              <p className="text-sm text-muted-foreground">
                HabitFlow stores your habit data locally on your device. We do not collect or 
                transmit any personal information to external servers.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-card-foreground mb-2">Data Storage</h4>
              <p className="text-sm text-muted-foreground">
                All your habits, completions, and preferences are stored securely in your browser's 
                local storage. You can export your data at any time.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-card-foreground mb-2">Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Notifications are processed locally on your device. We do not send any data to 
                external notification services.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-card-foreground mb-2">Contact</h4>
              <p className="text-sm text-muted-foreground">
                If you have any questions about privacy, please contact us at privacy@habitflow.app
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

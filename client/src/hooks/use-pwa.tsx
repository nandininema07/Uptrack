import { createContext, useContext, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

type PWAProviderState = {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  installApp: () => Promise<void>;
  dismissInstall: () => void;
  showInstallBanner: boolean;
  setShowInstallBanner: (show: boolean) => void;
};

const PWAProviderContext = createContext<PWAProviderState>({
  isInstallable: false,
  isInstalled: false,
  isOnline: true,
  installApp: async () => {},
  dismissInstall: () => {},
  showInstallBanner: false,
  setShowInstallBanner: () => {},
});

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // Check if app is installed (running in standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone || isIOSStandalone);
    
    console.log('PWA Debug - Standalone mode:', isStandalone, 'iOS standalone:', isIOSStandalone);

    // Handle beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA Debug - beforeinstallprompt event fired');
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
      
      // Show install banner after a delay if not dismissed
      setTimeout(() => {
        if (!localStorage.getItem('habitflow-install-dismissed')) {
          setShowInstallBanner(true);
        }
      }, 3000);
    };

    // Handle app installed event
    const handleAppInstalled = () => {
      console.log('PWA Debug - appinstalled event fired');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowInstallBanner(false);
      console.log('PWA was installed');
    };

    // Handle online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    console.log('PWA Debug - Event listeners added, waiting for beforeinstallprompt...');

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) {
      // Fallback for iOS or if prompt isn't available
      if (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')) {
        alert('To install this app on iOS: tap the Share button and then "Add to Home Screen"');
      }
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setShowInstallBanner(false);
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('Failed to install PWA:', error);
    }
  };

  const dismissInstall = () => {
    setShowInstallBanner(false);
    localStorage.setItem('habitflow-install-dismissed', 'true');
    
    // Show again after 7 days
    setTimeout(() => {
      localStorage.removeItem('habitflow-install-dismissed');
    }, 7 * 24 * 60 * 60 * 1000);
  };

  const value: PWAProviderState = {
    isInstallable,
    isInstalled,
    isOnline,
    installApp,
    dismissInstall,
    showInstallBanner,
    setShowInstallBanner,
  };

  return (
    <PWAProviderContext.Provider value={value}>
      {children}
    </PWAProviderContext.Provider>
  );
}

export const usePWA = () => {
  const context = useContext(PWAProviderContext);
  if (context === undefined) {
    throw new Error("usePWA must be used within a PWAProvider");
  }
  return context;
};

export function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return Promise.resolve('denied');
    }
    
    return Notification.requestPermission();
  }
  
  export function scheduleNotification(title: string, body: string, scheduledTime: Date): void {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }
    
    const now = new Date();
    const delay = scheduledTime.getTime() - now.getTime();
    
    if (delay > 0) {
      setTimeout(() => {
        new Notification(title, {
          body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
          });
      }, delay);
    }
  }
  
  export function registerForPushNotifications(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return Promise.resolve(null);
    }
    
    return navigator.serviceWorker.ready
      .then(registration => {
        return registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY // You would set this up
        });
      })
      .catch(error => {
        console.error('Failed to subscribe to push notifications:', error);
        return null;
      });
  }
  
  export function syncHabitsInBackground(): void {
    if (!('serviceWorker' in navigator) || !('sync' in window.ServiceWorkerRegistration.prototype)) {
      return;
    }
    
    navigator.serviceWorker.ready
      .then(registration => {
        return (registration as any).sync?.register('sync-habits');
      })
      .catch(error => {
        console.error('Background sync registration failed:', error);
      });
  }
  
  export function isOnline(): boolean {
    return navigator.onLine;
  }
  
  export function addToHomeScreen(): void {
    // This will be handled by the PWA hook
    const event = new CustomEvent('show-install-prompt');
    window.dispatchEvent(event);
  }
  
  export function isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }
  
  export function getInstallInstructions(): { platform: string; instructions: string } {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      return {
        platform: 'iOS Safari',
        instructions: 'Tap the Share button, then "Add to Home Screen"'
      };
    } else if (userAgent.includes('android')) {
      return {
        platform: 'Android Chrome',
        instructions: 'Tap the menu (three dots), then "Add to Home screen" or "Install app"'
      };
    } else {
      return {
        platform: 'Desktop',
        instructions: 'Click the install icon in your browser\'s address bar'
      };
    }
  }
  
  // IndexedDB utilities for offline storage
  export class OfflineStorage {
    private dbName = 'HabitFlowDB';
    private version = 1;
    
    async openDB(): Promise<IDBDatabase> {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, this.version);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = () => {
          const db = request.result;
          
          // Create object stores
          if (!db.objectStoreNames.contains('habits')) {
            db.createObjectStore('habits', { keyPath: 'id' });
          }
          
          if (!db.objectStoreNames.contains('completions')) {
            db.createObjectStore('completions', { keyPath: 'id' });
          }
          
          if (!db.objectStoreNames.contains('pendingCompletions')) {
            db.createObjectStore('pendingCompletions', { keyPath: 'id' });
          }
        };
      });
    }
    
    async storeHabits(habits: any[]): Promise<void> {
      const db = await this.openDB();
      const transaction = db.transaction(['habits'], 'readwrite');
      const store = transaction.objectStore('habits');
      
      for (const habit of habits) {
        await store.put(habit);
      }
    }
    
    async getHabits(): Promise<any[]> {
      const db = await this.openDB();
      const transaction = db.transaction(['habits'], 'readonly');
      const store = transaction.objectStore('habits');
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    
    async storePendingCompletion(completion: any): Promise<void> {
      const db = await this.openDB();
      const transaction = db.transaction(['pendingCompletions'], 'readwrite');
      const store = transaction.objectStore('pendingCompletions');
      
      return new Promise((resolve, reject) => {
        const request = store.add({ ...completion, id: Date.now().toString() });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }
  
  export const offlineStorage = new OfflineStorage();
  
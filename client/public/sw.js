const CACHE_NAME = 'habitflow-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Background sync for offline completions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-habits') {
    event.waitUntil(syncHabits());
  }
});

async function syncHabits() {
  try {
    const pendingCompletions = await getPendingCompletions();
    
    for (const completion of pendingCompletions) {
      try {
        const response = await fetch('/api/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(completion)
        });
        
        // Remove from pending after successful sync
        await removePendingCompletion(completion.id);
      } catch (error) {
        console.error('Failed to sync completion:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Time to complete your habits!',
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-192x192.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'complete',
        title: 'Mark Complete',
        icon: '/icons/check-icon.svg'
      },
      {
        action: 'view',
        title: 'View Habits',
        icon: '/icons/view-icon.svg'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('HabitFlow', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'complete') {
    // Handle quick completion
    event.waitUntil(
      clients.openWindow('/?action=quick-complete')
    );
  } else if (event.action === 'view') {
    // Open habits view
    event.waitUntil(
      clients.openWindow('/?screen=habits')
    );
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper functions for IndexedDB operations
async function getPendingCompletions() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('HabitFlowDB', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pendingCompletions'], 'readonly');
      const store = transaction.objectStore('pendingCompletions');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('pendingCompletions')) {
        db.createObjectStore('pendingCompletions', { keyPath: 'id' });
      }
    };
  });
}

async function removePendingCompletion(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('HabitFlowDB', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pendingCompletions'], 'readwrite');
      const store = transaction.objectStore('pendingCompletions');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

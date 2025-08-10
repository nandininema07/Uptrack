import { useState } from "react";
import { useNotifications, useMarkNotificationRead } from "../hooks/use-habits";
import { type Notification } from "../../../shared/schema";
import { cn } from "../lib/utils";

import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export default function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: notifications = [], isLoading } = useNotifications() as { data: Notification[], isLoading: boolean };
  const markAsRead = useMarkNotificationRead();
  
  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead.mutateAsync(notification.id);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reminder':
        return 'fa-bell';
      case 'celebration':
        return 'fa-trophy';
      case 'motivation':
        return 'fa-heart';
      default:
        return 'fa-info-circle';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'reminder':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'celebration':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'motivation':
        return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const formatTimeAgo = (date: Date | string | null) => {
    if (!date) return "Just now";
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) return "Just now";
    
    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
  };

  return (
    <>
      {/* Notification Button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 right-4 z-50 p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="relative">
          <i className="fas fa-bell text-lg" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 bg-error text-white text-xs rounded-full h-5 w-5 flex items-center justify-center p-0 min-w-0"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </div>
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm">
          <div 
            className={cn(
              "fixed top-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-card shadow-lg transition-all duration-300",
              isOpen ? "slide-down" : ""
            )}
          >
            <div className="p-4 pt-16">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-card-foreground">Notifications</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  <i className="fas fa-times" />
                </Button>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-muted rounded-xl p-3 animate-pulse">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-muted-foreground/20 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
                          <div className="h-3 bg-muted-foreground/20 rounded w-1/2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-bell-slash text-4xl text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {notifications.map((notification: Notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "rounded-xl p-3 border cursor-pointer transition-colors",
                        getNotificationColor(notification.type),
                        !notification.isRead && "ring-1 ring-primary/20"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center mt-0.5",
                          notification.type === 'reminder' && "bg-blue-100 dark:bg-blue-900/40",
                          notification.type === 'celebration' && "bg-green-100 dark:bg-green-900/40",
                          notification.type === 'motivation' && "bg-purple-100 dark:bg-purple-900/40"
                        )}>
                          <i className={`fas ${getNotificationIcon(notification.type)} text-xs`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-card-foreground truncate">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                        </div>

                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

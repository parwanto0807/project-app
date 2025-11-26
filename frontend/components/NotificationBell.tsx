'use client';

import { useState, useEffect } from 'react';
import { messaging } from '@/lib/firebase';
import { onMessage, getToken } from 'firebase/messaging';
import { useNotifications } from '@/contexts/NotificationContext';
import type { Notification as ContextNotification } from '@/contexts/NotificationContext';
import { removeFcmToken, saveFcmToken } from '@/lib/action/fcm/fcm';
import { getAccessToken } from '@/lib/autoRefresh';

export default function NotificationBell() {
    const [isLoading, setIsLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const {
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        unreadCount,
        syncWithServer,
        loadFromServer
    } = useNotifications();

    useEffect(() => {
        const loadNotifications = async () => {
            try {
                setIsLoading(true);
                await loadFromServer(); // Load dari database
            } catch (error) {
                console.error('Failed to load notifications:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadNotifications();
    }, [loadFromServer]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // ✅ FIX: Pastikan target adalah Element
            const target = event.target as Element;

            if (!target || typeof target.closest !== 'function') {
                // Jika target tidak valid, close dropdown
                setIsOpen(false);
                return;
            }

            if (!target.closest('.notification-bell-container')) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isLoading) {
            syncWithServer();
        }
    }, [notifications, isLoading, syncWithServer]);

    // Initialize FCM and service worker
    useEffect(() => {
        const initializeFCM = async () => {
            if (!messaging) {
                return;
            }

            try {
                // ✅ CHECK JIKA USER SEDANG LOGOUT
                const accessToken = getAccessToken();
                if (!accessToken) {
                    console.log("🔐 [FCM] User tidak login - skip initialization");
                    return;
                }

                // ✅ LANJUTKAN INITIALIZATION JIKA USER MASIH LOGIN
                if ('serviceWorker' in navigator) {
                    try {
                        await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                    } catch (registrationError) {
                        console.log('SW registration failed: ', registrationError);
                    }
                }

                if (Notification.permission === 'default') {
                    await Notification.requestPermission();
                }

                if (Notification.permission === 'granted') {
                    try {
                        const token = await getToken(messaging, {
                            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
                        });

                        // ✅ SAVE TOKEN TAPI JANGAN THROW ERROR JIKA GAGAL
                        await saveFcmToken(token);

                    } catch (tokenError) {
                        console.log('Error getting FCM token:', tokenError);
                    }
                }
            } catch (error) {
                console.log('FCM initialization skipped:', error);
            }
        };

        initializeFCM();
    }, []);

    useEffect(() => {
        const handleLogoutCleanup = async () => {
            if (!messaging) return;

            try {
                // ✅ DAPATKAN TOKEN DAN HAPUS DARI SERVER
                const token = await getToken(messaging);
                if (token) {
                    await removeFcmToken(token);
                }

                // ✅ HAPUS LOCAL NOTIFICATIONS
                localStorage.removeItem('fcm-notifications');

            } catch (error) {
                // ✅ IGNORE ERRORS SELAMA LOGOUT
                console.log('Cleanup during logout:', error);
            }
        };

        // ✅ LISTEN UNTUK LOGOUT EVENT (SESUAIKAN DENGAN AUTH SYSTEM ANDA)
        window.addEventListener('user-logout', handleLogoutCleanup);

        return () => {
            window.removeEventListener('user-logout', handleLogoutCleanup);
        };
    }, []);

    // Di dalam NotificationBell component
    useEffect(() => {
        if (!messaging) return;

        const unsubscribe = onMessage(messaging, (payload) => {
            // ✅ GUNAKAN CONTEXT NOTIFICATION TYPE DENGAN EXPLICIT
            const newNotification: ContextNotification = {
                id: payload.data?.notificationId || `fcm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                userId: 'current-user', // Temporary, akan diupdate oleh context
                title: payload.notification?.title || 'New Notification',
                body: payload.notification?.body || '',
                timestamp: new Date(),
                read: false,
                type: payload.data?.type || 'general',
                imageUrl: payload.notification?.image,
                actionUrl: payload.data?.actionUrl,
                data: payload.data ? { ...payload.data } : undefined,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            addNotification(newNotification);
        });

        return () => unsubscribe();
    }, [addNotification]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.notification-bell-container')) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (isLoading) {
        return (
            <div className="relative p-3 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse">
                <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
        );
    }

    return (
        <div className="notification-bell-container relative">
            {/* Notification Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    relative p-3 rounded-2xl transition-all duration-300 ease-in-out
                    bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900
                    border border-white dark:border-gray-700
                    hover:scale-105 active:scale-95
                    group
                `}
            >
                {/* Bell button container (same size as others) */}
                <div className="relative flex items-center justify-center 
    w-9 h-9 rounded-xl bg-white dark:bg-gray-900 
    border border-gray-200 dark:border-gray-700 
    shadow-sm cursor-pointer transition">

                    {/* Bell Icon */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5 text-gray-600 dark:text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 
            00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 
            .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                    </svg>

                    {/* Notification badge (transparent container) */}
                    {unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 flex items-center justify-center">
                            <div className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-red-400 opacity-30"></div>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                        </div>
                    )}
                </div>

                {/* Red Counter Badge */}
                {unreadCount > 0 && (
                    <span className={`
                        absolute -top-2 -right-2 
                        bg-gradient-to-r from-red-500 to-pink-500 
                        text-white text-xs font-semibold 
                        rounded-full h-5 w-5 flex items-center justify-center 
                        shadow-lg
                        animate-bounce
                    `}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Dropdown */}
            {isOpen && (
                <div className={`
                    absolute right-0 mt-3 w-96 
                    bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900
                    rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700
                    backdrop-blur-lg bg-opacity-95 dark:bg-opacity-95
                    z-50
                    animate-in fade-in-0 zoom-in-95 duration-200
                `}>
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-xl">
                                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                                        Notifications
                                    </h3>
                                    {unreadCount > 0 && (
                                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                            {unreadCount} unread {unreadCount === 1 ? 'message' : 'messages'}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors"
                                    >
                                        Mark all read
                                    </button>
                                )}
                                {notifications.length > 0 && (
                                    <button
                                        onClick={clearAll}
                                        className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                    </svg>
                                </div>
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                                    No notifications yet
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Well notify you when something arrives
                                </p>
                            </div>
                        ) : (
                            <div className="p-2">
                                {notifications.map((notification, index) => (
                                    <div
                                        key={notification.id}
                                        className={`
                                            p-4 rounded-xl mb-2 cursor-pointer transition-all duration-200
                                            hover:shadow-md hover:scale-[1.02]
                                            ${!notification.read
                                                ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500'
                                                : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750'
                                            }
                                            ${index === 0 ? 'animate-in fade-in-0 slide-in-from-top-2' : ''}
                                        `}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (!notification.read) {
                                                markAsRead(notification.id);
                                            }
                                        }}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start space-x-3">
                                                    <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${!notification.read
                                                        ? 'bg-blue-500 animate-pulse'
                                                        : 'bg-gray-300 dark:bg-gray-600'
                                                        }`}></div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className={`font-semibold text-sm truncate ${!notification.read
                                                            ? 'text-gray-900 dark:text-white'
                                                            : 'text-gray-700 dark:text-gray-300'
                                                            }`}>
                                                            {notification.title}
                                                        </h4>
                                                        <p className="text-gray-600 dark:text-gray-400 text-xs mt-1 line-clamp-2">
                                                            {notification.body}
                                                        </p>
                                                        <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">
                                                            {notification.timestamp.toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })} at {notification.timestamp.toLocaleTimeString('en-US', {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-b-2xl">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500 dark:text-gray-400">
                                    {notifications.length} total {notifications.length === 1 ? 'notification' : 'notifications'}
                                </span>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
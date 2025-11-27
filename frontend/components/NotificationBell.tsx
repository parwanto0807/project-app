'use client';

import { useState, useEffect, useRef } from 'react';
import { messaging } from '@/lib/firebase';
import { onMessage, getToken } from 'firebase/messaging';
import { useNotifications } from '@/contexts/NotificationContext';
import type { Notification as ContextNotification } from '@/contexts/NotificationContext';
import { removeFcmToken, saveFcmToken } from '@/lib/action/fcm/fcm';
import { getAccessToken } from '@/lib/autoRefresh';

export default function NotificationBell() {
    const [isLoading, setIsLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
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

    const dropdownRef = useRef<HTMLDivElement>(null);

    // Detect mobile screen
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Initial Load
    useEffect(() => {
        const loadNotifications = async () => {
            try {
                setIsLoading(true);
                await loadFromServer();
            } catch (error) {
                console.error('Failed to load notifications:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadNotifications();
    }, [loadFromServer]);

    // Click Outside Handling
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target || typeof target.closest !== 'function') {
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

    // Sync Logic
    useEffect(() => {
        if (!isLoading) {
            syncWithServer();
        }
    }, [notifications, isLoading, syncWithServer]);

    // Initialize FCM
    useEffect(() => {
        const initializeFCM = async () => {
            if (!messaging) return;
            try {
                const accessToken = getAccessToken();
                if (!accessToken) return;
                
                if ('serviceWorker' in navigator) {
                    try {
                        await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                    } catch (err) {
                        console.log('SW registration failed: ', err);
                    }
                }
                if (Notification.permission === 'default') {
                    await Notification.requestPermission();
                }
                if (Notification.permission === 'granted') {
                    const token = await getToken(messaging, {
                        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
                    });
                    await saveFcmToken(token);
                }
            } catch (error) {
                console.log('FCM initialization skipped:', error);
            }
        };
        initializeFCM();
    }, []);

    // Logout Cleanup
    useEffect(() => {
        const handleLogoutCleanup = async () => {
            if (!messaging) return;
            try {
                const token = await getToken(messaging);
                if (token) await removeFcmToken(token);
                localStorage.removeItem('fcm-notifications');
            } catch (error) {
                console.log('Cleanup during logout:', error);
            }
        };
        window.addEventListener('user-logout', handleLogoutCleanup);
        return () => window.removeEventListener('user-logout', handleLogoutCleanup);
    }, []);

    // Handle Incoming Messages
    useEffect(() => {
        if (!messaging) return;
        const unsubscribe = onMessage(messaging, (payload) => {
            const newNotification: ContextNotification = {
                id: payload.data?.notificationId || `fcm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                userId: 'current-user',
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

    // Handle Escape Key & Body Scroll Lock
    useEffect(() => {
        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsOpen(false);
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscapeKey);
            if (isMobile) document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, isMobile]);

    if (isLoading) {
        return (
            <div className="relative p-2 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse">
                <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="notification-bell-container relative z-50">
            {/* --- BELL BUTTON --- */}
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
                {/* Bell button container */}
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

                {/* Red Counter Badge - Animasi lompat-lompat */}
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

            {/* --- DROPDOWN / DRAWER --- */}
            {isOpen && (
                <>
                    {/* Backdrop Overlay */}
                    {isMobile && (
                        <div
                            className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[998] transition-opacity"
                            onClick={() => setIsOpen(false)}
                        />
                    )}

                    <div
                        ref={dropdownRef}
                        className={`
                            bg-white dark:bg-gray-900 
                            border border-gray-100 dark:border-gray-800
                            shadow-2xl flex flex-col
                            ${isMobile
                                ? 'fixed top-0 right-0 h-[100dvh] w-[85vw] max-w-sm z-[999] animate-in slide-in-from-right duration-300' 
                                : 'absolute right-0 mt-3 w-80 max-h-[80vh] rounded-xl z-50 animate-in fade-in zoom-in-95 duration-200'
                            }
                        `}
                    >
                        {/* 1. HEADER (Fixed) */}
                        <div className={`
                            flex-none border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 z-10
                            ${isMobile ? 'p-4' : 'p-4 rounded-t-xl'}
                        `}>
                            {/* Title & Count Row */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <h3 className={`font-bold text-gray-900 dark:text-white ${isMobile ? 'text-sm' : 'text-sm'}`}>
                                        Notifications
                                    </h3>
                                    {unreadCount > 0 && (
                                        <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold border border-blue-200">
                                            {unreadCount} New
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons Row (Mark All Read & Clear) - Visible on Mobile & Desktop */}
                            {notifications.length > 0 && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={markAllAsRead}
                                        disabled={unreadCount === 0}
                                        className={`
                                            flex-1 py-1.5 px-3 text-[10px] font-medium rounded border transition-colors
                                            ${unreadCount > 0 
                                                ? 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30' 
                                                : 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600 dark:border-gray-700'
                                            }
                                        `}
                                    >
                                        Mark all read
                                    </button>
                                    <button
                                        onClick={clearAll}
                                        className="flex-1 py-1.5 px-3 text-[10px] font-medium bg-red-50 text-red-600 rounded border border-red-100 hover:bg-red-100 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/30 transition-colors"
                                    >
                                        Clear all
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 2. LIST BODY (Scrollable & Flexible) */}
                        <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50/30 dark:bg-black/20">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                                        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                        </svg>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        No notifications yet
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!notification.read) markAsRead(notification.id);
                                            }}
                                            className={`
                                                relative cursor-pointer transition-colors group
                                                ${isMobile ? 'p-3' : 'p-4'}
                                                ${!notification.read 
                                                    ? 'bg-blue-50/60 dark:bg-blue-900/10' 
                                                    : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
                                                }
                                            `}
                                        >
                                            <div className="flex gap-3 items-start">
                                                {/* Unread Indicator */}
                                                <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${!notification.read ? 'bg-blue-500 shadow-sm shadow-blue-300' : 'bg-transparent'}`} />
                                                
                                                <div className="flex-1 min-w-0">
                                                    {/* Title & Time */}
                                                    <div className="flex justify-between items-start gap-2 mb-1">
                                                        <h4 className={`font-semibold text-gray-900 dark:text-white leading-tight ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                                            {notification.title}
                                                        </h4>
                                                        <span className={`text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
                                                            {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>

                                                    {/* Body */}
                                                    <p className={`text-gray-600 dark:text-gray-400 leading-snug line-clamp-4 ${isMobile ? 'text-[11px]' : 'text-xs'}`}>
                                                        {notification.body}
                                                    </p>

                                                    {/* Date Footer */}
                                                    <div className="mt-1.5 flex items-center justify-between">
                                                        <span className={`text-gray-400 dark:text-gray-600 ${isMobile ? 'text-[10px]' : 'text-[10px]'}`}>
                                                            {new Date(notification.timestamp).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 3. FOOTER (Fixed) */}
                        <div className={`
                            flex-none border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900
                            ${isMobile ? 'p-3' : 'p-3 text-center rounded-b-xl'}
                        `}>
                            <button
                                onClick={() => setIsOpen(false)}
                                className={`
                                    w-full py-2.5 rounded-lg text-xs font-semibold transition-colors
                                    bg-gray-100 text-gray-600 hover:bg-gray-200 
                                    dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700
                                `}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
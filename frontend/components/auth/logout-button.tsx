"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useState, useEffect } from "react";

interface LogoutButtonProps {
  children?: React.ReactNode;
}

// Global flag untuk mencegah auto-login - EXPORT untuk diakses oleh komponen lain
export let LOGOUT_IN_PROGRESS = false;
const BLOCK_DURATION = 30000; // ✅ FIXED: Use const instead of let

export const LogoutButton = ({ children }: LogoutButtonProps) => {
  const { setUser } = useCurrentUser();
  const [isLoading, setIsLoading] = useState(false);

  // Reset global flag ketika component unmount
  useEffect(() => {
    return () => {
      // Jangan reset LOGOUT_IN_PROGRESS di sini, biarkan tetap true selama blocking period
    };
  }, []);

  const comprehensiveCleanup = (): void => {
    console.log("🧹 Starting comprehensive cleanup...");

    // 1. Set global flag
    LOGOUT_IN_PROGRESS = true;
    localStorage.setItem('logout_in_progress', 'true');
    sessionStorage.setItem('logout_in_progress', 'true');

    // 2. Clear storage items dengan logging
    const storageItemsToRemove = [
      "token", "user", "auth_token", "access_token", "refresh_token",
      "user_session", "auth_state", "current_user", "logout_flag"
    ];

    storageItemsToRemove.forEach(key => {
      const hadLocal = localStorage.getItem(key);
      const hadSession = sessionStorage.getItem(key);

      localStorage.removeItem(key);
      sessionStorage.removeItem(key);

      if (hadLocal || hadSession) {
        console.log(`🗑️ Cleared ${key}:`, {
          localStorage: !!hadLocal,
          sessionStorage: !!hadSession
        });
      }
    });

    // 3. Clear cookies dengan berbagai kombinasi
    console.log("🍪 Clearing cookies...");
    const cookiesToRemove = [
      "accessToken", "refreshToken", "session_token", "accessTokenReadable",
      "auth_token", "token", "access_token", "refresh_token"
    ];

    const currentDomain = window.location.hostname;
    console.log("🌐 Current domain:", currentDomain);

    const isLocalhost = currentDomain === 'localhost' || currentDomain === '127.0.0.1';
    const domainOptions = isLocalhost ? [''] : ['', currentDomain, `.${currentDomain}`];

    let clearedCount = 0;

    cookiesToRemove.forEach(cookieName => {
      domainOptions.forEach(domain => {
        const paths = ['/', '', '/admin', '/api', '/auth'];

        paths.forEach(path => {
          let cookieString = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;

          if (domain) cookieString += ` domain=${domain};`;
          if (path) cookieString += ` path=${path};`;
          cookieString += ' samesite=lax;';

          document.cookie = cookieString;
          clearedCount++;
        });
      });
    });

    console.log(`✅ Cookie clearance attempts: ${clearedCount}`);
    console.log("🔍 Cookies after cleanup:", document.cookie);
  };

  const setupGlobalBlocking = (): void => {
    // ✅ BLOCK FETCH
    const originalFetch = window.fetch;
    window.fetch = function (...args: Parameters<typeof fetch>): Promise<Response> {
      const url = args[0];
      if (typeof url === 'string' &&
        (url.includes('/auth/') || url.includes('/api/auth') || url.includes('/login') ||
          url.includes('/refresh') || url.includes('/profile')) &&
        LOGOUT_IN_PROGRESS) {
        console.log(`🚫 BLOCKED auth request: ${url}`);
        return Promise.reject(new Error('Auto-login blocked during logout'));
      }
      return originalFetch.apply(this, args);
    };

    // ✅ BLOCK XMLHttpRequest - FIXED: Use rest parameters instead of arguments
    const originalXHROpen = XMLHttpRequest.prototype.open;

    // ✅ FIXED: Proper type definition tanpa 'any'
    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      async?: boolean,
      username?: string | null,
      password?: string | null
    ): void {
      if (typeof url === 'string' &&
        (url.includes('/auth/') || url.includes('/api/auth') || url.includes('/login') ||
          url.includes('/refresh') || url.includes('/profile')) &&
        LOGOUT_IN_PROGRESS) {
        console.log(`🚫 BLOCKED XHR request: ${url}`);
        throw new Error('Auto-login blocked during logout');
      }

      // ✅ FIXED: Use rest parameters instead of arguments
      return originalXHROpen.call(this, method, url, async ?? true, username, password);
    };

    // ✅ Reset setelah blocking period
    setTimeout(() => {
      window.fetch = originalFetch;
      XMLHttpRequest.prototype.open = originalXHROpen;
      LOGOUT_IN_PROGRESS = false;
      localStorage.removeItem('logout_in_progress');
      sessionStorage.removeItem('logout_in_progress');
      console.log("🔄 Restored normal HTTP operations");
    }, BLOCK_DURATION);
  };

  // components/LogoutButton.tsx - PERBAIKI DENGAN LOGGING
  const onClick = async (): Promise<void> => {
    if (isLoading) {
      console.log("🔄 Logout already in progress...");
      return;
    }

    setIsLoading(true);
    console.log("🚪 ========== LOGOUT PROCESS STARTED ==========");

    try {
      // ✅ 1. Log state sebelum logout
      console.log("🔍 Pre-logout state:");
      console.log("🍪 Cookies:", document.cookie);
      console.log("📦 LocalStorage:", {
        token: localStorage.getItem('token'),
        user: localStorage.getItem('user')
      });
      console.log("🔗 Current URL:", window.location.href);

      // ✅ 2. Setup blocking
      console.log("🛡️ Setting up request blocking...");
      setupGlobalBlocking();

      // ✅ 3. Dapatkan token untuk logout
      const getAccessToken = (): string | null => {
        const cookieToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('accessTokenReadable='))
          ?.split('=')[1];

        console.log("🔑 Token from cookie:", cookieToken ? "Found" : "Not found");
        return cookieToken || localStorage.getItem('token') || null;
      };

      const accessToken = getAccessToken();

      // ✅ 4. KIRIM LOGOUT REQUEST
      console.log("📡 Sending logout request to backend...");

      const logoutUrl = "/api/auth/logout";
      console.log("🎯 Target URL:", logoutUrl);

      const response = await fetch(logoutUrl, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && {
            "Authorization": `Bearer ${accessToken}`
          })
        },
      });

      console.log("📨 Response received:");
      console.log("   Status:", response.status);
      console.log("   OK:", response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Backend logout successful:", result);
      } else {
        console.warn("⚠️ Backend logout failed with status:", response.status);
        try {
          const errorText = await response.text();
          console.warn("⚠️ Error response:", errorText);
        } catch {
          console.warn("⚠️ Could not read error response");
        }
      }

    } catch (error) {
      // ✅ Type-safe error handling
      if (error instanceof Error) {
        console.error("❌ Logout request error:", error);
        console.error("❌ Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      } else {
        console.error("❌ Unknown logout error:", error);
      }
    } finally {
      console.log("🧹 Starting comprehensive cleanup...");

      // Perform cleanup
      comprehensiveCleanup();

      // Clear user state
      if (setUser) {
        setUser(null);
        console.log("👤 User state cleared");
      }

      console.log("🔀 Preparing redirect...");

      // ✅ Redirect
      setTimeout(() => {
        const redirectUrl = `/auth/login?logout=${Date.now()}`;
        console.log(`📍 Redirecting to: ${redirectUrl}`);
        window.location.href = redirectUrl;
      }, 1000);
    }
  };

  return (
    <button
      onClick={() => {
        console.log("🎯 Button clicked directly!");
        onClick();
      }}
      disabled={isLoading}
      data-logout-button="true"
      className={`cursor-pointer ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
      type="button"
    >
      {isLoading ? "Logging out..." : children}
    </button>
  );
};
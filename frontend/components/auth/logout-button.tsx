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
    
    // 1. Set global flag untuk prevent auto-login - DIPERPANJANG
    LOGOUT_IN_PROGRESS = true;
    
    // 2. Set flag di storage juga untuk persist across redirects
    localStorage.setItem('logout_in_progress', 'true');
    sessionStorage.setItem('logout_in_progress', 'true');
    
    // 3. Clear storage items
    const storageItemsToRemove = [
      "logout_flag",
      "user_session",
      "auth_state", 
      "current_user",
      "access_token",
      "accessToken" // tambahan
    ];
    
    storageItemsToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    // 4. ✅ IMPROVED: Cookie removal dengan timing yang benar
    const cookiesToRemove = [
      "accessToken",
      "refreshToken", 
      "sessionId",
      "auth_token",
      "token",
      "access_token",
      "refresh_token"
    ];

    const currentDomain = window.location.hostname;
    const isLocalhost = currentDomain === 'localhost' || currentDomain === '127.0.0.1';
    
    const domainOptions = isLocalhost ? [''] : ['', currentDomain, `.${currentDomain}`];

    cookiesToRemove.forEach(cookieName => {
      domainOptions.forEach(domain => {
        const paths = ['/', '', '/admin', '/api', '/auth'];
        
        paths.forEach(path => {
          let cookieString = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
          
          if (domain) cookieString += ` domain=${domain};`;
          if (path) cookieString += ` path=${path};`;
          if (window.location.protocol === 'https:') cookieString += ' secure;';
          cookieString += ' samesite=lax;';
          
          document.cookie = cookieString;
        });
      });
    });

    console.log("✅ Cleanup completed");
  };

  const setupGlobalBlocking = (): void => {
    // ✅ BLOCK FETCH
    const originalFetch = window.fetch;
    window.fetch = function(...args: Parameters<typeof fetch>): Promise<Response> {
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
    XMLHttpRequest.prototype.open = function(
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

  const onClick = async (): Promise<void> => {
    if (isLoading) return;
    
    setIsLoading(true);
    console.log("🚪 Starting logout process...");
    console.log("🔍 Current cookies before logout:", document.cookie);
    
    try {
      // Setup blocking SEBELUM cleanup
      setupGlobalBlocking();
      
      // Attempt backend logout
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        
        if (response.ok) {
          console.log("✅ Backend logout successful");
        } else {
          console.warn("⚠️ Backend logout returned non-OK status:", response.status);
        }
      } catch (error) {
        console.warn("⚠️ Backend logout failed, continuing with frontend cleanup", error);
      }
      
    } finally {
      // Perform cleanup
      comprehensiveCleanup();
      
      // Clear user state
      if (setUser) {
        setUser(null);
      }
      
      // ✅ CRITICAL: Hard redirect tanpa cache
      setTimeout(() => {
        const redirectUrl = `/auth/login?logout=${Date.now()}&nocache=${Date.now()}`;
        console.log(`🔀 Redirecting to: ${redirectUrl}`);
        
        // Force hard redirect - clear history
        window.location.replace(redirectUrl);
      }, 500); // Beri waktu lebih untuk cleanup complete
    }
  };

  return (
    <button 
      onClick={onClick} 
      disabled={isLoading}
      className={`cursor-pointer ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
      type="button"
    >
      {isLoading ? "Logging out..." : children}
    </button>
  );
};
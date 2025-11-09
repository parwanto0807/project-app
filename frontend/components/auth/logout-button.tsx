"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useState, useEffect } from "react";

interface LogoutButtonProps {
  children?: React.ReactNode;
}

// Global flag untuk mencegah auto-login
export let LOGOUT_IN_PROGRESS = false;

export const LogoutButton = ({ children }: LogoutButtonProps) => {
  const { setUser } = useCurrentUser();
  const [isLoading, setIsLoading] = useState(false);

  // Set global flag ketika component mount
  useEffect(() => {
    return () => {
      LOGOUT_IN_PROGRESS = false;
    };
  }, []);

  const nuclearCleanup = () => {
    console.log("🚨 Starting NUCLEAR cleanup...");
    
    // 1. Set global flag untuk prevent auto-login
    LOGOUT_IN_PROGRESS = true;
    localStorage.setItem("logout_flag", "true");
    sessionStorage.setItem("logout_flag", "true");
    
    // 2. Clear ALL storage dengan loop (more thorough than clear())
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key) localStorage.removeItem(key);
    }
    
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key) sessionStorage.removeItem(key);
    }
    
    // 3. Set logout flags
    localStorage.setItem("logout_flag", "true");
    sessionStorage.setItem("logout_flag", "true");
    
    // 4. Aggressive cookie removal dengan type annotation
    const cookieNames: string[] = [];
    document.cookie.split(";").forEach(cookie => {
      const name = cookie.split("=")[0].trim();
      cookieNames.push(name);
    });
    
    // Unique cookie names
    const uniqueCookies = [...new Set(cookieNames)];
    
    uniqueCookies.forEach(name => {
      if (name) {
        // Clear dengan berbagai domain dan path
        const domains = [
          '',
          window.location.hostname,
          `.${window.location.hostname}`,
          'localhost',
          '127.0.0.1'
        ];
        
        const paths = ['/', '/auth', '/api', '/admin', ''];
        
        domains.forEach(domain => {
          paths.forEach(path => {
            const domainPart = domain ? `domain=${domain};` : '';
            const pathPart = path ? `path=${path};` : '';
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${domainPart} ${pathPart}`;
          });
        });
      }
    });
    
    // 5. Clear service worker caches
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
      });
    }
    
    // 6. Clear IndexedDB (jika ada)
    if ('indexedDB' in window) {
      indexedDB.databases().then(databases => {
        databases.forEach(db => {
          if (db.name) indexedDB.deleteDatabase(db.name);
        });
      });
    }
    
    console.log("✅ Nuclear cleanup completed");
  };

  const blockAutoLogin = () => {
    // Tambahkan event listener untuk block requests
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = args[0];
      if (typeof url === 'string' && 
          (url.includes('/auth/') || url.includes('/api/auth') || url.includes('/login')) &&
          LOGOUT_IN_PROGRESS) {
        console.log(`🚫 Blocked auth request: ${url}`);
        return Promise.reject(new Error('Auto-login blocked during logout'));
      }
      return originalFetch.apply(this, args);
    };
    
    // Kembalikan setelah 5 detik
    setTimeout(() => {
      window.fetch = originalFetch;
      LOGOUT_IN_PROGRESS = false;
    }, 5000);
  };

  const onClick = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    console.log("🚪 Starting enhanced logout process...");
    
    // Block auto-login attempts
    blockAutoLogin();
    
    try {
      // Coba backend logout
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      }).catch(() => {}); // Ignore errors
      
    } finally {
      // CRITICAL: Perform nuclear cleanup
      nuclearCleanup();
      
      // Clear user state
      setUser(null);
      
      // Force hard redirect dengan cache busting
      const timestamp = Date.now();
      setTimeout(() => {
        window.location.href = `/auth/login?logout=${timestamp}&nocache=true`;
      }, 100);
    }
  };

  return (
    <span 
      onClick={onClick} 
      className={`cursor-pointer ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {isLoading ? "Logging out..." : children}
    </span>
  );
};
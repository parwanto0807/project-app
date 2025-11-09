// 📁 File: /lib/cookie-helper.ts
export class CookieHelper {
  // ✅ Check jika cookies tersedia
  static areCookiesAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    
    const cookies = document.cookie;
    const hasAccessToken = cookies.includes('access_token');
    const hasRefreshToken = cookies.includes('refresh_token');
    
    console.log('🍪 [COOKIE-HELPER] Cookie check:', {
      allCookies: cookies,
      hasAccessToken,
      hasRefreshToken
    });
    
    return hasAccessToken && hasRefreshToken;
  }

  // ✅ Wait untuk cookies tersedia (untuk handle race condition)
  static async waitForCookies(timeout = 5000): Promise<boolean> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkInterval = setInterval(() => {
        if (this.areCookiesAvailable()) {
          clearInterval(checkInterval);
          console.log('🍪 [COOKIE-HELPER] Cookies available after', Date.now() - startTime, 'ms');
          resolve(true);
        }
        
        if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          console.warn('🍪 [COOKIE-HELPER] Cookies timeout after', timeout, 'ms');
          resolve(false);
        }
      }, 100);
    });
  }

  // ✅ Get specific cookie value
  static getCookie(name: string): string | null {
    if (typeof window === 'undefined') return null;
    
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    
    if (parts.length === 2) {
      const cookieValue = parts.pop()!.split(';').shift();
      console.log('🍪 [COOKIE-HELPER] Get cookie:', { name, value: cookieValue ? '***' : 'null' });
      return cookieValue || null;
    }
    
    return null;
  }
}
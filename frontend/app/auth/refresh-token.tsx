import { useEffect } from 'react';
// import { useRouter } from 'next/router';

export default function RefreshTokenPage() {
//   const router = useRouter();

  useEffect(() => {
    const refreshToken = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh-token`, {
          credentials: 'include' // Untuk mengirim cookies
        });

        const data = await response.json();

        if (data.success) {
          // Redirect ke URL tujuan
          window.location.href = data.redirectUrl || '/dashboard';
        } else {
          // Redirect ke login jika gagal
          window.location.href = '/auth/login';
        }
      } catch (error) {
        console.error('Refresh token failed:', error);
        window.location.href = '/auth/login';
      }
    };

    refreshToken();
  }, []);

  return <div>Memproses refresh token...</div>;
}
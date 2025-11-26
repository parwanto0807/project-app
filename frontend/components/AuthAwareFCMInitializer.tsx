// components/AuthAwareFCMInitializer.tsx
'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

// Component ini harus dipanggil dari component yang sudah dalam SessionProvider
export default function AuthAwareFCMInitializer() {
  const { data: session, status } = useSession();
  
  useEffect(() => {
    if (status === 'loading') return;
    
    if (session?.user) {
      console.log(`✅ FCM: User authenticated: ${session.user.email}`);
      // Di sini bisa tambahkan logic FCM initialization untuk user yang authenticated
    } else {
      console.log('🔐 FCM: User not authenticated');
    }
  }, [session, status]);

  return null;
}
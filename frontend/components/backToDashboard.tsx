'use client';

import { motion } from 'framer-motion';
import { Home, Loader } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from './clientSessionProvider';

export function BackToDashboardButton() {
  const pathname = usePathname();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const { user, isLoading } = useSession(); // Sesuai dengan struktur hook Anda

  // Tentukan dashboard URL berdasarkan role
  const getDashboardUrl = () => {
    if (!user?.role) return '/user-area';

    switch (user.role.toLowerCase()) {
      case 'pic':
        return '/pic-area';
      case 'admin':
        return '/admin-area';
      case 'user':
      default:
        return '/user-area';
    }
  };

  const dashboardUrl = getDashboardUrl();

  // Effect untuk mengatur visibility
  useEffect(() => {
    if (!isLoading && user && pathname !== dashboardUrl) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isLoading, user, pathname, dashboardUrl]);

  // Jangan render apa-apa jika tidak visible atau di desktop
  if (!isVisible || (typeof window !== 'undefined' && window.innerWidth > 768)) {
    return null;
  }

  // Tampilkan isLoading state sementara
  if (isLoading) {
    return (
      <div className="fixed bottom-6 right-6 z-[9999]">
        <div className="w-14 h-14 rounded-full bg-gray-400 flex items-center justify-center shadow-lg text-white">
          <Loader className="w-6 h-6 animate-spin" strokeWidth={2.5} />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-[9999] cursor-grab active:cursor-grabbing"
      style={{
        x: position.x,
        y: position.y,
        touchAction: 'none',
      }}
      drag
      dragConstraints={{ top: -100, left: -100, right: 100, bottom: 100 }}
      dragElastic={0.5}
      onDragEnd={(event, info) => {
        setPosition({ x: info.point.x - window.innerWidth + 64, y: info.point.y - window.innerHeight + 64 });
      }}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
    >
      <Link href={dashboardUrl}>
        <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300 text-white">
          <Home className="w-6 h-6" strokeWidth={2.5} />
        </div>
      </Link>
    </motion.div>
  );
}
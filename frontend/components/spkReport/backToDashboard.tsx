'use client';

import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation'; // ← Import ini

export function BackToDashboardButton() {
  const pathname = usePathname(); // ← Dapatkan path saat ini
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // ❌ JANGAN TAMPILKAN jika di /user-area
  if (pathname === '/user-area') {
    return null;
  }

  // Hanya tampilkan di mobile/tablet kecil
  if (typeof window !== 'undefined' && window.innerWidth > 768) {
    return null;
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
    >
      <Link href="/user-area">
        <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300 text-white">
          <Home className="w-6 h-6" strokeWidth={2.5} />
        </div>
      </Link>
    </motion.div>
  );
}
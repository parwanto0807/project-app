// app/page.tsx
import { cn } from '@/lib/utils';
import Link from 'next/link';
import localFont from 'next/font/local'

const poppins = localFont({
  src: '../public/fonts/Poppins-Regular.ttf',
  weight: '400',
  style: 'normal',
})


export default function HomePage() {
  return (
    <main className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-sky-400 to-blue-900">
      {/* Judul dengan ikon emoji */}
      <h1
        className={cn(
          "text-3xl sm:text-4xl md:text-5xl font-semibold text-white drop-shadow-md mb-4 leading-none flex flex-col sm:flex-row items-center justify-center gap-2 text-center", // Menggunakan flex-col untuk mobile dan flex-row untuk layar lebih besar
          poppins.className
        )}
      >
        <span className="relative -top-[2px] text-2xl sm:text-3xl md:text-4xl">🏗️</span>
        PT. Rylif Mikro Mandiri
      </h1>

      {/* Tombol Sign In */}
      <Link href="/auth/login">
        <button
          className="bg-white text-blue-600 font-semibold py-3 px-8 rounded-full shadow-lg hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 flex items-center"
        >
          <span className="mr-2">🚀</span> {/* Ikon emoji */}
          Sign In
        </button>
      </Link>

      {/* Teks kecil di bawah tombol */}
      <p className="mt-4 text-white text-sm">
        A Trusted Platform for Construction Project Orders.
      </p>
    </main>
  );
}
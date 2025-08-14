"use client";

import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";

interface LogoutButtonProps {
  children?: React.ReactNode;
}

export const LogoutButton = ({ children }: LogoutButtonProps) => {
  const router = useRouter();
  const { setUser } = useCurrentUser();

  const onClick = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include", // Wajib agar cookie dikirim
      });

      if (!res.ok) {
        throw new Error("Gagal logout");
      }
      

      // console.log("✅ Logout berhasil, mengarahkan ke login...");
      setUser(null); 
      router.push("/auth/login"); // Redirect ke halaman login
    } catch (err) {
      console.error("❌ Error saat logout:", err);
    }
  };

  return (
    <span onClick={onClick} className="cursor-pointer">
      {children}
    </span>
  );
};

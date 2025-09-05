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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      localStorage.removeItem("accessToken");

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

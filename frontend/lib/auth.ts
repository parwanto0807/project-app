// lib/auth.ts (khusus Server Component)
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export async function getUserFromToken(): Promise<DecodedToken | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    if (!token) {
      console.log("No token found in cookies");
      return null;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET is not defined");
      return null;
    }

    const decoded = jwt.verify(token, secret) as DecodedToken;
    return decoded;
  } catch (err) {
    console.error("Token verification failed:", err);
    return null;
  }
}

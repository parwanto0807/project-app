import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
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
      // console.log("No token found in cookies");
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

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!, // (opsional) validasi env terpisah
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      // 'user' terisi saat sign-in pertama
      if (
        user &&
        "id" in user &&
        typeof (user as { id?: unknown }).id === "string"
      ) {
        token.userId = (user as { id: string }).id;
      }
      return token;
    },
    async session({ session, token }) {
      // Berkat augmentasi di types/next-auth.d.ts
      if (session.user) {
        session.user.id = token.userId ?? token.sub ?? "";
      }
      return session;
    },
  },
  // pages: { signIn: "/login" }, // opsional
};

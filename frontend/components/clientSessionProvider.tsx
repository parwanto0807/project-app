"use client";

import { createContext, useState, useContext, ReactNode } from "react";

// Tipe data user
export interface User {
  id: string;
  username: string;
  role: string;
}

// Buat Context
const SessionContext = createContext<{
  user: User | null;
  setUser: (user: User | null) => void;
}>({
  user: null,
  setUser: () => {},
});

export function useSession() {
  return useContext(SessionContext);
}

// Komponen Provider
export default function ClientSessionProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser: User | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser);

  return (
    <SessionContext.Provider value={{ user, setUser }}>
      {children}
    </SessionContext.Provider>
  );
}

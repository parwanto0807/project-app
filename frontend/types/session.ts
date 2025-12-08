export interface Session {
  id: string;
  userId: string;
  sessionToken: string;
  refreshToken: string;
  fcmToken: string;
  deviceId?: string | null;
  ipAddress: string;
  userAgent: string;
  country?: string | null;
  city?: string | null;
  isRevoked: boolean;
  createdAt: string;
  expiresAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string | null;
}

export interface ActiveSession {
  id: string;
  userId: string;
  userAgent: string;
  ipAddress: string;
  isRevoked: boolean;
  createdAt: string;
  expiresAt: string;
  lastActiveAt: string;
  current?: boolean; // Opsional: jika Anda menandai sesi saat ini di frontend
  user: SessionUser; // Include user data from relation
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ActiveSessionsResponse {
  success: boolean;
  data: ActiveSession[];
  pagination: PaginationMeta;
  message: string;
}

export interface ApiSessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
}

export interface ApiSession {
  id: string;
  userId: string;
  sessionToken: string;
  refreshToken: string;
  fcmToken: string;
  deviceId?: string | null;
  ipAddress: string;
  userAgent: string;
  country?: string | null;
  city?: string | null;
  isRevoked: boolean;
  createdAt: string;
  expiresAt: string;
  lastActiveAt: string;
  user: ApiSessionUser;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CustomSessionsEvent extends Event {
  detail: ApiSession[];
}

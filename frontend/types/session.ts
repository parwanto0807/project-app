export interface Session {
  id: string;
  userId: string;
  sessionToken: string;
  refreshToken: string;
  fcmToken:string;
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

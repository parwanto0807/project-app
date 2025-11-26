// types/fcm.ts
export interface FCMNotification {
  title: string;
  body: string;
  image?: string;
}

export interface FCMData {
  [key: string]: string;
}

export interface FCMMessage {
  notification?: FCMNotification;
  data?: FCMData;
  token?: string;
  topic?: string;
}

export interface FCMResponse {
  multicast_id: number;
  success: number;
  failure: number;
  canonical_ids: number;
  results: Array<{
    message_id?: string;
    error?: string;
  }>;
}

// Untuk incoming message di frontend
export interface IncomingMessage {
  notification?: FCMNotification;
  data?: FCMData;
  from?: string;
  messageId?: string;
  fcmOptions?: {
    link?: string;
  };
}

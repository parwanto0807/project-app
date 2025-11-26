// types/firebase-messaging.d.ts
import 'firebase/messaging';

declare module 'firebase/messaging' {
  interface MessagePayload {
    notification?: {
      title?: string;
      body?: string;
      image?: string;
    };
    data?: {
      [key: string]: string;
    };
    from?: string;
    messageId?: string;
    fcmOptions?: {
      link?: string;
    };
  }
}
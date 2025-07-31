import crypto from 'crypto';

export function generateDeviceToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function generateSessionToken() {
  return crypto.randomBytes(64).toString('hex');
}

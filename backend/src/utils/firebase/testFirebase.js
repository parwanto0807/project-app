// utils/firebase/testFirebase.js
import admin from './admin.js';

export const testFirebaseConnection = async () => {
  try {
    if (!admin.apps.length) {
      console.log('❌ Firebase Admin not initialized');
      return false;
    }

    console.log('✅ Firebase Admin is initialized');
    console.log(`📧 Project: ${admin.app().options.credential.projectId}`);
    
    // Test simple operation
    const auth = admin.auth();
    const userCount = await auth.listUsers(1);
    console.log('✅ Firebase Auth test passed');
    
    return true;
    
  } catch (error) {
    console.error('❌ Firebase test failed:', error.message);
    return false;
  }
};

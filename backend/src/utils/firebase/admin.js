// utils/firebase/admin.js
import admin from "firebase-admin";
import { readFileSync } from "fs";
import { join } from "path";

if (!admin.apps.length) {
  try {
    console.log("🔥 Initializing Firebase Admin SDK...");

    // Cari file service account
    const possibleFileNames = [
      "service-account-key.json",
      "firebase-service-account.json",
      // atau gunakan nama file asli yang Anda download
      "your-project-name-firebase-adminsdk-xxxxx-xxxxxxxxxx.json",
    ];

    let serviceAccountPath = null;
    let serviceAccount = null;

    for (const fileName of possibleFileNames) {
      const filePath = join(process.cwd(), fileName);
      try {
        const fileContent = readFileSync(filePath, "utf8");
        serviceAccount = JSON.parse(fileContent);
        serviceAccountPath = filePath;
        console.log(`✅ Found service account file: ${fileName}`);
        break;
      } catch (error) {
        // Continue to next file
      }
    }

    if (!serviceAccount) {
      throw new Error(
        "Service account file not found. Please make sure the JSON file is in the backend root directory."
      );
    }

    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
    });

    // console.log('✅ Firebase Admin SDK initialized successfully!');
    // console.log(`📧 Project: ${serviceAccount.project_id}`);
    // console.log(`👤 Service Account: ${serviceAccount.client_email}`);
  } catch (error) {
    console.error(
      "❌ Firebase Admin SDK initialization failed:",
      error.message
    );
    console.log("💡 Make sure:");
    console.log("   - Service account JSON file is in backend root directory");
    console.log("   - File name matches one of the expected names");
    console.log("   - File contains valid JSON format");
    console.log("⚠️ Push notifications will be disabled");
  }
} else {
  console.log("✅ Firebase Admin SDK already initialized");
}

export default admin;

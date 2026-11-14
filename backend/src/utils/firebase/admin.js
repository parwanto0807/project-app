// utils/firebase/admin.js
// Kompatibel dengan firebase-admin v14 (API modular).
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { readFileSync } from "fs";
import { join } from "path";

if (getApps().length === 0) {
  try {
    // Cari file service account
    const possibleFileNames = [
      "service-account-key.json",
      "firebase-service-account.json",
      "your-project-name-firebase-adminsdk-xxxxx-xxxxxxxxxx.json",
    ];

    let serviceAccount = null;

    for (const fileName of possibleFileNames) {
      const filePath = join(process.cwd(), fileName);
      try {
        serviceAccount = JSON.parse(readFileSync(filePath, "utf8"));
        break;
      } catch {
        // lanjut ke nama file berikutnya
      }
    }

    if (!serviceAccount) {
      throw new Error(
        "Service account file not found. Please make sure the JSON file is in the backend root directory."
      );
    }

    initializeApp({
      credential: cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
    });
  } catch (error) {
    console.error(
      "Firebase Admin SDK initialization failed:",
      error.message
    );
    // Push notifications akan nonaktif, aplikasi tetap berjalan.
  }
}

// Objek kompatibilitas untuk kode lama yang memakai `admin.apps` /
// `admin.messaging()`.
const admin = {
  get apps() {
    return getApps();
  },
  messaging: () => getMessaging(),
  initializeApp,
  credential: { cert },
};

export default admin;

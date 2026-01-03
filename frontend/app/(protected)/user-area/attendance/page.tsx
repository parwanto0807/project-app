import React from "react";
import { UserLayout } from "@/components/admin-panel/user-layout";

export default function AttendancePage() {
    return (
        <UserLayout title="Absensi On-Site" role="user">
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                        Absensi On-Site
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                        Fitur ini sedang dalam tahap pengembangan. Segera hadir untuk memudahkan pencatatan kehadiran Anda.
                    </p>
                    <div className="inline-block px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full font-medium text-sm">
                        Coming Soon 🚧
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}

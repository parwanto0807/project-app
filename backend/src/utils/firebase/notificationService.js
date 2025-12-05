// utils/firebase/notificationService.js
import admin from "./admin.js";
import { prisma } from "../../config/db.js";

export class NotificationService {
  static async sendToUser(userId, notification) {
    // Cek jika Firebase Admin ter-initialize
    if (!admin.apps || !admin.apps.length) {
      console.log("❌ Firebase Admin not initialized - skipping notification");
      return { success: false, error: "Firebase not configured" };
    }

    try {
      // ✅ SIMPAN KE DATABASE TERLEBIH DAHULU (PERSISTENCE)
      const dbNotification = await prisma.notification.create({
        data: {
          userId: userId,
          title: notification.title,
          body: notification.body,
          type: notification.type || "general",
          imageUrl: notification.imageUrl,
          actionUrl: notification.actionUrl,
          data: notification.data || {},
          expiresAt: notification.expiresAt
            ? new Date(notification.expiresAt)
            : null,
        },
      });

      // ✅ PERBAIKI QUERY: Gunakan isRevoked: false dan expiresAt
      const userSessions = await prisma.userSession.findMany({
        where: {
          userId: userId,
          isRevoked: false,
          fcmToken: { not: null },
          expiresAt: { gt: new Date() },
        },
        select: {
          fcmToken: true,
          id: true,
          deviceId: true,
        },
      });

      const tokens = userSessions
        .map((session) => session.fcmToken)
        .filter(Boolean);

      console.log(
        `[Notification] Found ${tokens.length} active tokens for user ${userId}`
      );

      // ✅ KEMBALIKAN SUCCESS MESKIPUN TIDAK ADA TOKEN (KARENA SUDAH DISIMPAN DI DB)
      if (tokens.length === 0) {
        console.log(
          `[Notification] No active FCM tokens - but notification saved to DB`
        );
        return {
          success: true,
          dbId: dbNotification.id,
          sentCount: 0,
          failedCount: 0,
          totalTokens: 0,
          message: "Notification saved to database (no active devices)",
        };
      }

      // Prepare message dengan include notificationId dari database
      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
          ...(notification.imageUrl && { image: notification.imageUrl }),
        },
        data: {
          ...notification.data,
          notificationId: dbNotification.id, // ✅ INCLUDE DB ID
          type: notification.type || "general",
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
        tokens: tokens,
        android: {
          priority: "high",
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      };

      // console.log(`[Notification] Sending to ${tokens.length} devices...`);

      // Send multicast message
      const response = await admin.messaging().sendEachForMulticast(message);

      // console.log(
      //   `[Notification] ✅ FCM Success: ${response.successCount} ❌ Failed: ${response.failureCount}`
      // );

      // Handle failed tokens
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
          }
        });

        // Cleanup invalid tokens
        await this.cleanupInvalidTokens(failedTokens);
      }

      return {
        success: true,
        dbId: dbNotification.id,
        sentCount: response.successCount,
        failedCount: response.failureCount,
        totalTokens: tokens.length,
        message: `Notification persisted and sent to ${response.successCount} device(s)`,
      };
    } catch (error) {
      console.error("[Notification] Error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  static async cleanupInvalidTokens(invalidTokens) {
    if (!invalidTokens || invalidTokens.length === 0) return;

    try {
      const result = await prisma.userSession.updateMany({
        where: {
          fcmToken: { in: invalidTokens },
          // 🎯 HANYA cleanup jika:
          OR: [
            { isRevoked: true }, // Session dicabut
            {
              user: {
                active: false, // User tidak aktif (boolean)
              },
            },
            {
              lastActiveAt: {
                lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // > 30 hari
              },
            },
          ],
        },
        data: {
          fcmToken: null,
        },
      });

      if (result.count > 0) {
        console.log(`[Notification] 🧹 Cleaned ${result.count} invalid tokens`);
      }
    } catch (error) {
      console.error("[Notification] Cleanup error:", error.message);
    }
  }

  static async broadcastToAdmins(notification) {
    try {
      const adminUsers = await prisma.user.findMany({
        where: {
          role: { in: ["admin", "pic"] },
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      // console.log(`[Notification] Found ${adminUsers.length} admin/pic users`);

      // ✅ DETAILED ROLE BREAKDOWN
      const adminCount = adminUsers.filter(
        (user) => user.role === "admin"
      ).length;
      const picCount = adminUsers.filter((user) => user.role === "pic").length;

      // console.log(`[Notification] 👥 Role breakdown: ${adminCount} Admins, ${picCount} PICs`);

      adminUsers.forEach((user) => {
        console.log(`[Notification] ${user.role.toUpperCase()}: ${user.email}`);
      });

      const results = [];
      let totalDBSaved = 0;
      let totalFCMSent = 0;

      for (const user of adminUsers) {
        console.log(`[Notification] Sending to ${user.role}: ${user.email}`);
        const result = await this.sendToUser(user.id, {
          ...notification,
          type: notification.type || "broadcast",
        });

        results.push({
          userId: user.id,
          email: user.email,
          role: user.role,
          ...result,
        });

        if (result.success) {
          totalDBSaved++;
          totalFCMSent += result.sentCount || 0;
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const failedCount = results.filter((r) => !r.success).length;

      console.log(
        `[Notification] 📢 BROADCAST COMPLETED:\n` +
          `  Total Users: ${adminUsers.length} (${adminCount} Admins, ${picCount} PICs)\n` +
          `  Success: ${successCount} users\n` +
          `  Failed: ${failedCount} users\n` +
          `  Notifications Saved to DB: ${totalDBSaved}\n` +
          `  FCM Notifications Sent: ${totalFCMSent}`
      );

      return results;
    } catch (error) {
      console.error("[Notification] Broadcast error:", error);
      throw error;
    }
  }

  // ✅ METHOD BARU: Broadcast ke Users dengan role = "user"
  static async broadcastToUsers(notification) {
    try {
      const userUsers = await prisma.user.findMany({
        where: {
          role: "user",
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      if (userUsers.length === 0) {
        return [];
      }

      userUsers.forEach((user) => {
        console.log(`[Notification] User: ${user.email}`);
      });

      const results = [];
      let totalDBSaved = 0;
      let totalFCMSent = 0;

      for (const user of userUsers) {
        const result = await this.sendToUser(user.id, {
          ...notification,
          type: notification.type || "user_broadcast",
        });

        results.push({
          userId: user.id,
          email: user.email,
          role: user.role,
          ...result,
        });

        if (result.success) {
          totalDBSaved++;
          totalFCMSent += result.sentCount || 0;
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const failedCount = results.filter((r) => !r.success).length;

      console.log(
        `[Notification] 📢 USER Broadcast completed:\n` +
          `  Users: ${userUsers.length}\n` +
          `  Success: ${successCount} users\n` +
          `  Failed: ${failedCount} users\n` +
          `  Notifications Saved to DB: ${totalDBSaved}\n` +
          `  FCM Notifications Sent: ${totalFCMSent}`
      );

      return results;
    } catch (error) {
      console.error("[Notification] User Broadcast error:", error);
      throw error;
    }
  }

  // ✅ METHOD BARU: Broadcast ke Users berdasarkan array user IDs
  static async broadcastToSpecificUsers(userIds, notification) {
    try {
      // console.log(
      //   `[Notification] Broadcasting to ${userIds.length} specific users...`
      // );

      const specificUsers = await prisma.user.findMany({
        where: {
          id: { in: userIds },
          active: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      // console.log(
      //   `[Notification] Found ${specificUsers.length} active users from provided IDs`
      // );

      const results = [];
      let totalDBSaved = 0;
      let totalFCMSent = 0;

      for (const user of specificUsers) {
        const result = await this.sendToUser(user.id, {
          ...notification,
          type: notification.type || "specific_user_broadcast",
        });

        results.push({
          userId: user.id,
          email: user.email,
          role: user.role,
          ...result,
        });

        if (result.success) {
          totalDBSaved++;
          totalFCMSent += result.sentCount || 0;
        }
      }

      // console.log(
      //   `[Notification] 📢 Specific Users Broadcast completed:\n` +
      //     `  Target Users: ${userIds.length}\n` +
      //     `  Active Users Found: ${specificUsers.length}\n` +
      //     `  Notifications Saved to DB: ${totalDBSaved}\n` +
      //     `  FCM Notifications Sent: ${totalFCMSent}`
      // );

      return results;
    } catch (error) {
      console.error("[Notification] Specific Users Broadcast error:", error);
      throw error;
    }
  }

  // ✅ METHOD BARU: Broadcast ke Team Members berdasarkan teamId
  static async broadcastToTeamMembers(teamId, notification) {
    try {
      // console.log(`🚀 [Broadcast] TeamID: ${teamId}`);

      // 1️⃣ Validasi Team
      const teamExists = await prisma.team.findUnique({
        where: { id: teamId },
        select: { id: true, namaTeam: true },
      });

      if (!teamExists) {
        // console.warn(`❌ Team tidak ditemukan: ${teamId}`);
        return [];
      }

      // 2️⃣ Ambil user yang role-nya "user"
      const teamUsers = await prisma.teamKaryawan.findMany({
        where: { teamId },
        include: {
          karyawan: {
            include: {
              user: {
                where: { role: "user" }, // hanya role "user"
                select: {
                  id: true,
                  email: true,
                  name: true,
                  role: true,
                },
              },
            },
          },
        },
      });

      // Filter hanya yang memiliki user
      const finalUsers = teamUsers
        .filter((member) => member.karyawan?.user)
        .map((member) => member.karyawan.user);

      if (finalUsers.length === 0) {
        // console.warn(`⚠️ Tidak ada user role "user" pada team ini`);
        return [];
      }

      const userIds = finalUsers.map((u) => u.id);
      // console.log(`📩 Broadcasting to users:`, userIds);

      // 3️⃣ Broadcast
      const broadcastResult = await this.broadcastToSpecificUsers(userIds, {
        ...notification,
        type: notification.type || "team_assignment",
      });

      // console.log(`✅ Broadcast selesai`);
      return broadcastResult;
    } catch (error) {
      console.error(`🔥 Error broadcastToTeamMembers:`, error);
      throw error;
    }
  }

  // ✅ METHOD BARU: Broadcast hanya ke PIC
  static async broadcastToPICs(notification) {
    try {
      // console.log("[Notification] Broadcasting to PICs only...");

      const picUsers = await prisma.user.findMany({
        where: {
          role: "pic",
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      if (picUsers.length === 0) {
        return [];
      }

      picUsers.forEach((user) => {
        console.log(`[Notification] PIC: ${user.email}`);
      });

      const results = [];
      for (const user of picUsers) {
        const result = await this.sendToUser(user.id, {
          ...notification,
          type: notification.type || "pic_broadcast",
        });
        results.push({
          userId: user.id,
          email: user.email,
          role: user.role,
          ...result,
        });
      }

      const totalSent = results
        .filter((r) => r.success)
        .reduce((sum, r) => sum + (r.sentCount || 0), 0);

      // console.log(
      //   `[Notification] 📢 PIC Broadcast completed:\n` +
      //     `  PIC Users: ${picUsers.length}\n` +
      //     `  Notifications Saved to DB: ${
      //       results.filter((r) => r.success).length
      //     }\n` +
      //     `  FCM Notifications Sent: ${totalSent}`
      // );

      return results;
    } catch (error) {
      console.error("[Notification] PIC Broadcast error:", error);
      throw error;
    }
  }

  // ✅ METHOD BARU: Broadcast hanya ke Admin (tanpa PIC)
  static async broadcastToAdminsOnly(notification) {
    try {
      const adminUsers = await prisma.user.findMany({
        where: {
          role: "admin",
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      adminUsers.forEach((user) => {
        console.log(`[Notification] Admin: ${user.email}`);
      });

      const results = [];
      for (const user of adminUsers) {
        const result = await this.sendToUser(user.id, {
          ...notification,
          type: notification.type || "admin_broadcast",
        });
        results.push({
          userId: user.id,
          email: user.email,
          role: user.role,
          ...result,
        });
      }

      const totalSent = results
        .filter((r) => r.success)
        .reduce((sum, r) => sum + (r.sentCount || 0), 0);

      console.log(
        `[Notification] 📢 Admin Broadcast completed:\n` +
          `  Admin Users: ${adminUsers.length}\n` +
          `  Notifications Saved to DB: ${
            results.filter((r) => r.success).length
          }\n` +
          `  FCM Notifications Sent: ${totalSent}`
      );

      return results;
    } catch (error) {
      console.error("[Notification] Admin Broadcast error:", error);
      throw error;
    }
  }

  // ✅ METHOD BARU: Get user notifications dari database
  static async getUserNotifications(userId, options = {}) {
    try {
      const { limit = 50, unreadOnly = false } = options;

      const notifications = await prisma.notification.findMany({
        where: {
          userId: userId,
          ...(unreadOnly && { read: false }),
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
      });

      console.log(
        `[Notification] Loaded ${notifications.length} notifications for user ${userId}`
      );
      return notifications;
    } catch (error) {
      console.error("[Notification] Get notifications error:", error);
      return [];
    }
  }

  // ✅ METHOD BARU: Mark notifications as read
  static async markAsRead(notificationIds, userId) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: userId,
        },
        data: {
          read: true,
          updatedAt: new Date(),
        },
      });

      console.log(
        `[Notification] Marked ${result.count} notifications as read for user ${userId}`
      );
      return result;
    } catch (error) {
      console.error("[Notification] Mark as read error:", error);
      throw error;
    }
  }

  // Method untuk debug: Check user sessions
  static async debugUserSessions(userId) {
    try {
      const sessions = await prisma.userSession.findMany({
        where: {
          userId: userId,
        },
        select: {
          id: true,
          fcmToken: true,
          isRevoked: true,
          expiresAt: true,
          deviceId: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      console.log(`[Debug] User ${userId} sessions:`, sessions);
      return sessions;
    } catch (error) {
      console.error("[Debug] Error checking sessions:", error);
      return [];
    }
  }
}

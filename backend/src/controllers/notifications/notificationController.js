// controllers/notificationController.js
import { prisma } from "../../config/db.js";
import { NotificationService } from "../../utils/firebase/notificationService.js";

/**
 * Get all notifications for authenticated user
 */
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, unreadOnly = false } = req.query;

    console.log(`[Notification] Getting notifications for user: ${userId}`);

    const whereClause = {
      userId: userId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    };

    // Add read filter if unreadOnly is true
    if (unreadOnly === "true") {
      whereClause.read = false;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      take: parseInt(limit),
    });

    console.log(
      `[Notification] Found ${notifications.length} notifications for user ${userId}`
    );

    res.json(notifications);
  } catch (error) {
    console.error("[Notification] Error getting notifications:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get notifications",
      message: error.message,
    });
  }
};

/**
 * Get unread notifications count
 */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await prisma.notification.count({
      where: {
        userId: userId,
        read: false,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    console.log(`[Notification] Unread count for user ${userId}: ${count}`);

    res.json({ count });
  } catch (error) {
    console.error("[Notification] Error getting unread count:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get unread count",
      message: error.message,
    });
  }
};

/**
 * Mark notifications as read
 */
export const markNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        error: "notificationIds array is required",
      });
    }

    console.log(
      `[Notification] Marking ${notificationIds.length} notifications as read for user: ${userId}`
    );

    const result = await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: userId, // Ensure user can only update their own notifications
      },
      data: {
        read: true,
        updatedAt: new Date(),
      },
    });

    console.log(
      `[Notification] Successfully marked ${result.count} notifications as read`
    );

    res.json({
      success: true,
      message: `Marked ${result.count} notifications as read`,
      count: result.count,
    });
  } catch (error) {
    console.error("[Notification] Error marking notifications as read:", error);
    res.status(500).json({
      success: false,
      error: "Failed to mark notifications as read",
      message: error.message,
    });
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(
      `[Notification] Marking all notifications as read for user: ${userId}`
    );

    const result = await prisma.notification.updateMany({
      where: {
        userId: userId,
        read: false,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      data: {
        read: true,
        updatedAt: new Date(),
      },
    });

    console.log(
      `[Notification] Successfully marked all ${result.count} notifications as read`
    );

    res.json({
      success: true,
      message: `Marked all ${result.count} notifications as read`,
      count: result.count,
    });
  } catch (error) {
    console.error(
      "[Notification] Error marking all notifications as read:",
      error
    );
    res.status(500).json({
      success: false,
      error: "Failed to mark all notifications as read",
      message: error.message,
    });
  }
};

/**
 * Delete a specific notification
 */
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    console.log(
      `[Notification] Deleting notification ${id} for user: ${userId}`
    );

    // Verify the notification belongs to the user
    const notification = await prisma.notification.findFirst({
      where: {
        id: id,
        userId: userId,
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: "Notification not found or access denied",
      });
    }

    await prisma.notification.delete({
      where: { id: id },
    });

    console.log(`[Notification] Successfully deleted notification: ${id}`);

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("[Notification] Error deleting notification:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete notification",
      message: error.message,
    });
  }
};

/**
 * Clear all notifications for user
 */
export const clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(
      `[Notification] Clearing all notifications for user: ${userId}`
    );

    const result = await prisma.notification.deleteMany({
      where: {
        userId: userId,
      },
    });

    console.log(
      `[Notification] Successfully cleared ${result.count} notifications`
    );

    res.json({
      success: true,
      message: `Cleared ${result.count} notifications`,
      count: result.count,
    });
  } catch (error) {
    console.error("[Notification] Error clearing all notifications:", error);
    res.status(500).json({
      success: false,
      error: "Failed to clear notifications",
      message: error.message,
    });
  }
};

/**
 * Send test notification to current user
 */
export const sendTestNotification = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`[Notification] Sending test notification to user: ${userId}`);

    const result = await NotificationService.sendToUser(userId, {
      title: "🧪 Test Notification",
      body: "This is a test notification from the server",
      type: "test",
      data: {
        test: "true",
        timestamp: new Date().toISOString(),
      },
    });

    if (result.success) {
      res.json({
        success: true,
        message: "Test notification sent successfully",
        ...result,
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to send test notification",
        ...result,
      });
    }
  } catch (error) {
    console.error("[Notification] Error sending test notification:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send test notification",
      message: error.message,
    });
  }
};

/**
 * Get notification statistics
 */
export const getNotificationStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [totalCount, unreadCount, readCount, todayCount] = await Promise.all([
      // Total notifications
      prisma.notification.count({
        where: {
          userId: userId,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      }),
      // Unread notifications
      prisma.notification.count({
        where: {
          userId: userId,
          read: false,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      }),
      // Read notifications
      prisma.notification.count({
        where: {
          userId: userId,
          read: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      }),
      // Today's notifications
      prisma.notification.count({
        where: {
          userId: userId,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    const stats = {
      total: totalCount,
      unread: unreadCount,
      read: readCount,
      today: todayCount,
    };

    console.log(`[Notification] Stats for user ${userId}:`, stats);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("[Notification] Error getting notification stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get notification stats",
      message: error.message,
    });
  }
};

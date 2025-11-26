// routes/notificationsRoutes.js
import express from "express";
import {
  getUserNotifications,
  getUnreadCount,
  markNotificationsAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  sendTestNotification,
  getNotificationStats,
} from "../../controllers/notifications/notificationController.js";

import { authenticateToken } from "../../middleware/authMiddleware.js";

const router = express.Router();

// Apply authentication to all notification routes
router.use(authenticateToken);

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for authenticated user
 * @access  Private
 * @query   {number} limit - Limit number of notifications (default: 50)
 * @query   {boolean} unreadOnly - Only return unread notifications
 */
router.get("/", getUserNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get count of unread notifications
 * @access  Private
 */
router.get("/unread-count", getUnreadCount);

/**
 * @route   GET /api/notifications/stats
 * @desc    Get notification statistics
 * @access  Private
 */
router.get("/stats", getNotificationStats);

/**
 * @route   POST /api/notifications/mark-read
 * @desc    Mark specific notifications as read
 * @access  Private
 * @body    {string[]} notificationIds - Array of notification IDs to mark as read
 */
router.post("/mark-read", markNotificationsAsRead);

/**
 * @route   POST /api/notifications/mark-all-read
 * @desc    Mark all notifications as read for user
 * @access  Private
 */
router.post("/mark-all-read", markAllNotificationsAsRead);

/**
 * @route   POST /api/notifications/test
 * @desc    Send test notification to current user
 * @access  Private
 */
router.post("/test", sendTestNotification);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a specific notification
 * @access  Private
 * @param   {string} id - Notification ID
 */
router.delete("/:id", deleteNotification);

/**
 * @route   DELETE /api/notifications/clear-all
 * @desc    Clear all notifications for user
 * @access  Private
 */
router.delete("/clear-all", clearAllNotifications);

export default router;

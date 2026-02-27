// controllers/notificationController.js
import { NotificationService } from "../../utils/firebase/notificationService";

export const sendNotification = async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        error: 'Title and body are required'
      });
    }

    const result = await NotificationService.sendToUser(userId, {
      title,
      body,
      data
    });

    res.json({
      success: true,
      message: 'Notification sent successfully',
      data: result
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notification'
    });
  }
};

export const broadcastNotification = async (req, res) => {
  try {
    const { title, body, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        error: 'Title and body are required'
      });
    }

    const result = await NotificationService.broadcast({
      title,
      body,
      data
    });

    res.json({
      success: true,
      message: 'Broadcast notification sent successfully',
      data: result
    });

  } catch (error) {
    console.error('Error broadcasting notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to broadcast notification'
    });
  }
};

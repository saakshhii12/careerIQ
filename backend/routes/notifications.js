import { Router } from "express";
import { query, dbErrorDetails } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function mapNotification(row) {
  return {
    id: String(row.notification_id),
    type: row.type || "system",
    message: row.message,
    link: row.link || null,
    read: Boolean(row.is_read),
    createdAt: row.created_at,
  };
}

/**
 * Notifications belong to a user, not a role, so both students and recruiters
 * read from the same endpoint. The user id always comes from the verified JWT —
 * never from the request body or query string.
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT notification_id, type, message, link, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC, notification_id DESC
       LIMIT 50`,
      [req.user.userId]
    );

    const notifications = result.rows.map(mapNotification);
    return res.json({
      notifications,
      unreadCount: notifications.filter((item) => !item.read).length,
    });
  } catch (error) {
    console.error("Notifications list error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to load notifications." });
  }
});

router.post("/:notificationId/read", requireAuth, async (req, res) => {
  try {
    const result = await query(
      `UPDATE notifications
       SET is_read = true
       WHERE notification_id = $1 AND user_id = $2
       RETURNING notification_id, type, message, link, is_read, created_at`,
      [req.params.notificationId, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Notification not found." });
    }
    return res.json({ notification: mapNotification(result.rows[0]) });
  } catch (error) {
    console.error("Notification read error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to update notification." });
  }
});

router.post("/read-all", requireAuth, async (req, res) => {
  try {
    const result = await query(
      "UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false",
      [req.user.userId]
    );
    return res.json({ updated: result.rowCount });
  } catch (error) {
    console.error("Notification read-all error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to update notifications." });
  }
});

export default router;

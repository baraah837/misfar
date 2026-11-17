// controllers/userController.js
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');

// ── GET /api/users/me ─────────────────────────────────────────
exports.getProfile = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT u.id, u.username, u.email, u.role, u.location, u.interests,
             u.budget, u.travel_type, u.photo_url, u.last_login, u.created_at,
             (SELECT COUNT(*) FROM trips WHERE user_id = u.id) AS trips_count,
             (SELECT COUNT(*) FROM reviews WHERE user_id = u.id AND status = 'approved') AS reviews_count,
             (SELECT COUNT(*) FROM bookmarks WHERE user_id = u.id) AS bookmarks_count
      FROM users u WHERE u.id = $1
    `, [req.user.id]);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

// ── PUT /api/users/me ─────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const { username, email, location, interests, budget, travel_type } = req.body;
    let photo_url = req.user.photo_url;

    if (req.file) {
      photo_url = `/uploads/profiles/${req.file.filename}`;
    }

    const result = await query(`
      UPDATE users
      SET username=$1, email=$2, location=$3, interests=$4, budget=$5, travel_type=$6, photo_url=$7
      WHERE id=$8
      RETURNING id, username, email, location, interests, budget, travel_type, photo_url
    `, [username, email, location, interests, budget, travel_type, photo_url, req.user.id]);

    res.json({ success: true, message: 'Profile updated.', data: result.rows[0] });
  } catch (err) { next(err); }
};

// ── PUT /api/users/me/password ────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const userResult = await query(
      'SELECT password_hash FROM users WHERE id = $1', [req.user.id]
    );
    const isMatch = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.id]);

    // Invalidate all refresh tokens so user must log in again
    await query('DELETE FROM refresh_tokens WHERE user_id = $1', [req.user.id]);

    res.json({ success: true, message: 'Password changed successfully. Please log in again.' });
  } catch (err) { next(err); }
};

// ── GET /api/users/me/bookmarks ───────────────────────────────
exports.getBookmarks = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT d.id, d.name, d.area, d.region, d.category, d.avg_rating,
             b.created_at AS saved_at,
             (SELECT photo_url FROM destination_photos WHERE destination_id = d.id AND is_primary = TRUE LIMIT 1) AS primary_photo
      FROM bookmarks b
      JOIN destinations d ON d.id = b.destination_id
      WHERE b.user_id = $1 AND d.is_active = TRUE
      ORDER BY b.created_at DESC
    `, [req.user.id]);

    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

// ── POST /api/users/me/bookmarks/:destinationId ───────────────
exports.addBookmark = async (req, res, next) => {
  try {
    const { destinationId } = req.params;

    // Check destination exists
    const dest = await query('SELECT id FROM destinations WHERE id = $1 AND is_active = TRUE', [destinationId]);
    if (!dest.rows.length) {
      return res.status(404).json({ success: false, message: 'Destination not found.' });
    }

    await query(
      'INSERT INTO bookmarks (user_id, destination_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [req.user.id, destinationId]
    );

    // Track behavior
    await query(
      `INSERT INTO user_behavior (user_id, destination_id, action) VALUES ($1,$2,'bookmark')`,
      [req.user.id, destinationId]
    );

    res.status(201).json({ success: true, message: 'Destination bookmarked.' });
  } catch (err) { next(err); }
};

// ── DELETE /api/users/me/bookmarks/:destinationId ─────────────
exports.removeBookmark = async (req, res, next) => {
  try {
    await query(
      'DELETE FROM bookmarks WHERE user_id = $1 AND destination_id = $2',
      [req.user.id, req.params.destinationId]
    );
    res.json({ success: true, message: 'Bookmark removed.' });
  } catch (err) { next(err); }
};

// ── GET /api/users/me/notifications ──────────────────────────
exports.getNotifications = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT n.id, n.title, n.message, n.type, n.sent_at,
             (nr.id IS NOT NULL) AS is_read
      FROM notifications n
      LEFT JOIN notification_reads nr ON nr.notification_id = n.id AND nr.user_id = $1
      WHERE n.status = 'sent' AND n.target_all = TRUE
      ORDER BY n.sent_at DESC
      LIMIT 50
    `, [req.user.id]);

    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

// ── POST /api/users/me/notifications/:id/read ─────────────────
exports.markNotificationRead = async (req, res, next) => {
  try {
    await query(
      'INSERT INTO notification_reads (notification_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [req.params.id, req.user.id]
    );
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) { next(err); }
};

// ── PUT /api/admin/users/:id/reset-password  [Admin] ─────────
exports.adminResetPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    // Check user exists (no role restriction)
    const userResult = await query(
      'SELECT id, username FROM users WHERE id = $1',
      [req.params.id]
    );
    if (!userResult.rows.length) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.params.id]);

    // Invalidate all existing sessions for that user
    await query('DELETE FROM refresh_tokens WHERE user_id = $1', [req.params.id]);

    res.json({
      success: true,
      message: `Password reset successfully for ${userResult.rows[0].username}.`,
    });
  } catch (err) { next(err); }
};

// ── GET /api/users/me/reviews ─────────────────────────────────
exports.getMyReviews = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT r.id, r.rating, r.comment, r.status, r.sentiment_label, r.created_at,
             d.name AS destination_name
      FROM reviews r
      JOIN destinations d ON d.id = r.destination_id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
    `, [req.user.id]);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

// ── DELETE /api/users/me/reviews/:id ─────────────────────────
exports.deleteReview = async (req, res, next) => {
  try {
    const result = await query(
      'DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }
    res.json({ success: true, message: 'Review deleted.' });
  } catch (err) { next(err); }
};

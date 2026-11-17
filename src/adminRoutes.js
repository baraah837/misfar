// routes/adminRoutes.js
const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/errorHandler');
const { protect, adminOnly } = require('../middleware/auth');
const reviewCtrl  = require('../controllers/reviewController');
const recCtrl     = require('../controllers/recommendationController');
const notifCtrl   = require('../controllers/notificationController');
const chatCtrl    = require('../controllers/chatbotController');

const guard = [protect, adminOnly];

// Analytics dashboard
router.get('/analytics', ...guard, recCtrl.adminAnalytics);

// User management
router.get('/users',                      ...guard, recCtrl.adminGetUsers);
router.put('/users/:id/toggle',           ...guard, recCtrl.adminToggleUser);
router.put('/users/:id/reset-password',   ...guard, require('../controllers/userController').adminResetPassword);

// Review moderation
router.get('/reviews',     ...guard, reviewCtrl.adminGetAll);
router.put('/reviews/:id', ...guard, [
  body('status').isIn(['approved','rejected']),
  body('admin_note').optional().isString(),
], validate, reviewCtrl.adminModerate);

// Notifications
router.get('/notifications',              ...guard, notifCtrl.getAll);
router.post('/notifications',             ...guard, [
  body('title').trim().notEmpty(),
  body('message').trim().notEmpty(),
], validate, notifCtrl.create);
router.post('/notifications/:id/send',    ...guard, notifCtrl.send);
router.delete('/notifications/:id',       ...guard, notifCtrl.remove);

// Chatbot management
router.get('/chatbot/config',          ...guard, chatCtrl.getConfig);
router.put('/chatbot/config',          ...guard, [
  body('configs').isArray({ min: 1 }),
], validate, chatCtrl.updateConfig);
router.get('/chatbot/conversations',   ...guard, chatCtrl.getConversations);

module.exports = router;

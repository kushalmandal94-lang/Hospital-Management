const express = require('express');
const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require('../controllers/notificationController');
const { protect, authorize, logActivity } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('admin', 'doctor', 'nurse', 'receptionist', 'patient', 'pharmacist', 'lab_technician', 'accountant'));

router.get('/', logActivity('notification', 'view'), getNotifications);
router.put('/read-all', logActivity('notification', 'update'), markAllNotificationsRead);
router.put('/:id/read', logActivity('notification', 'update'), markNotificationRead);

module.exports = router;

const express = require('express');
const {
  getAppointments,
  getAppointment,
  bookAppointment,
  rescheduleAppointment,
  cancelAppointment,
  completeAppointment,
  getDoctorAvailability,
  submitAppointmentReview,
  createVideoConsultationSession,
} = require('../controllers/appointmentController');
const { protect, authorize, logActivity } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/doctor/:doctorId/availability', logActivity('appointment', 'view'), getDoctorAvailability);

// Protected routes
router.use(protect);

// GET routes
router.get(
  '/',
  authorize('admin', 'doctor', 'nurse', 'receptionist', 'patient'),
  logActivity('appointment', 'view'),
  getAppointments
);
router.get('/:id', authorize('admin', 'doctor', 'nurse', 'patient'), logActivity('appointment', 'view'), getAppointment);

// POST routes
router.post('/', authorize('patient', 'receptionist'), logActivity('appointment', 'create'), bookAppointment);

// PUT routes
router.put('/:id/reschedule', authorize('patient', 'receptionist'), logActivity('appointment', 'update'), rescheduleAppointment);
router.put('/:id/cancel', authorize('patient', 'receptionist', 'doctor'), logActivity('appointment', 'update'), cancelAppointment);
router.put('/:id/complete', authorize('doctor', 'nurse'), logActivity('appointment', 'update'), completeAppointment);
router.post('/:id/review', authorize('patient', 'admin', 'super_admin'), logActivity('appointment', 'update'), submitAppointmentReview);
router.post(
  '/:id/video-session',
  authorize('admin', 'super_admin', 'doctor', 'patient'),
  logActivity('appointment', 'view'),
  createVideoConsultationSession
);

module.exports = router;

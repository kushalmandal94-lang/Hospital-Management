const express = require('express');
const {
  getDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  getDoctorByUserId,
  getDoctorsBySpecialization,
  getDoctorReviews,
} = require('../controllers/doctorController');
const { protect, authorize, logActivity } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', logActivity('doctor', 'view'), getDoctors);
router.get('/specialization/:specialization', logActivity('doctor', 'view'), getDoctorsBySpecialization);
router.get('/:id/reviews', logActivity('doctor', 'view'), getDoctorReviews);
router.get('/user/:userId', protect, authorize('admin', 'doctor'), logActivity('doctor', 'view'), getDoctorByUserId);
router.get('/:id', logActivity('doctor', 'view'), getDoctor);

// Protected routes
router.use(protect);

router.post('/', authorize('admin'), logActivity('doctor', 'create'), createDoctor);
router.put('/:id', authorize('admin', 'doctor'), logActivity('doctor', 'update'), updateDoctor);

module.exports = router;

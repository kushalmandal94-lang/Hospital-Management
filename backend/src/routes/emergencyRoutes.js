const express = require('express');
const {
  createEmergencyRequest,
  getNearestAvailability,
  getEmergencyTracking,
  getAdminRequests,
  getAdminAmbulances,
  updateEmergencyStatus,
  reassignAmbulance,
  seedAmbulances,
} = require('../controllers/emergencyController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public emergency access
router.post('/requests', createEmergencyRequest);
router.get('/availability', getNearestAvailability);
router.get('/requests/:requestId/status', getEmergencyTracking);

// Admin / control panel endpoints
router.get('/admin/requests', protect, authorize('admin', 'receptionist'), getAdminRequests);
router.get('/admin/ambulances', protect, authorize('admin', 'receptionist'), getAdminAmbulances);
router.patch('/admin/requests/:id/status', protect, authorize('admin', 'receptionist'), updateEmergencyStatus);
router.patch('/admin/requests/:id/assign', protect, authorize('admin', 'receptionist'), reassignAmbulance);
router.post('/admin/seed-ambulances', protect, authorize('admin', 'receptionist'), seedAmbulances);

module.exports = router;

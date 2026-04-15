const express = require('express');
const {
  getEMRs,
  getEMR,
  createEMR,
  updateEMR,
  getPatientEMRHistory,
  addPrescription,
  getEMRVersions,
} = require('../controllers/emrController');
const { protect, authorize, logActivity } = require('../middleware/auth');

const router = express.Router();

// All EMR routes require authentication
router.use(protect);

// GET routes
router.get(
  '/',
  authorize('admin', 'doctor', 'nurse', 'patient'),
  logActivity('emr', 'view'),
  getEMRs
);
router.get('/:id', authorize('admin', 'doctor', 'nurse', 'patient'), logActivity('emr', 'view'), getEMR);
router.get('/patient/:patientId', authorize('admin', 'doctor', 'patient'), logActivity('emr', 'view'), getPatientEMRHistory);
router.get('/:id/versions', authorize('admin', 'doctor'), logActivity('emr', 'view'), getEMRVersions);

// POST routes
router.post('/', authorize('admin', 'doctor'), logActivity('emr', 'create'), createEMR);

// PUT routes
router.put('/:id', authorize('admin', 'doctor'), logActivity('emr', 'update'), updateEMR);
router.put('/:id/prescriptions', authorize('admin', 'doctor'), logActivity('emr', 'update'), addPrescription);

module.exports = router;

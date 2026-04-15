const express = require('express');
const {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientByUserId,
  addMedicalHistory,
  addAllergy,
} = require('../controllers/patientController');
const { protect, authorize, logActivity } = require('../middleware/auth');

const router = express.Router();

// All patient routes require authentication
router.use(protect);

// GET routes
router.get('/', authorize('admin', 'doctor', 'nurse', 'receptionist', 'accountant'), logActivity('patient', 'view'), getPatients);
router.get('/user/:userId', logActivity('patient', 'view'), getPatientByUserId);
router.get('/:id', authorize('admin', 'doctor', 'nurse', 'patient'), logActivity('patient', 'view'), getPatient);

// POST routes
router.post('/', authorize('admin', 'receptionist'), logActivity('patient', 'create'), createPatient);
router.post('/:id/medical-history', authorize('admin', 'doctor'), logActivity('patient', 'update'), addMedicalHistory);
router.post('/:id/allergies', authorize('admin', 'doctor', 'patient'), logActivity('patient', 'update'), addAllergy);

// PUT routes
router.put('/:id', authorize('admin', 'patient'), logActivity('patient', 'update'), updatePatient);

// DELETE routes
router.delete('/:id', authorize('admin'), logActivity('patient', 'delete'), deletePatient);

module.exports = router;

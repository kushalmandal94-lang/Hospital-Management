const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const patientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    patientId: {
      type: String,
      unique: true,
      default: () => 'KH-' + uuidv4().slice(0, 8).toUpperCase(),
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
    },
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    allergies: [
      {
        allergen: String,
        severity: {
          type: String,
          enum: ['mild', 'moderate', 'severe'],
        },
        reaction: String,
      },
    ],
    chronicDiseases: [
      {
        disease: String,
        diagnosisDate: Date,
        status: {
          type: String,
          enum: ['active', 'resolved'],
          default: 'active',
        },
      },
    ],
    currentMedications: [
      {
        medicationId: mongoose.Schema.Types.ObjectId,
        name: String,
        dosage: String,
        frequency: String,
        startDate: Date,
        endDate: Date,
      },
    ],
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
      email: String,
    },
    insuranceDetails: {
      providerName: String,
      policyNumber: String,
      expiryDate: Date,
      coverage: String,
    },
    medicalHistory: [
      {
        date: Date,
        condition: String,
        treatment: String,
        doctorId: mongoose.Schema.Types.ObjectId,
      },
    ],
    documents: [
      {
        documentType: {
          type: String,
          enum: ['report', 'scan', 'prescription', 'other'],
        },
        fileUrl: String,
        uploadDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Patient', patientSchema);

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const labTestSchema = new mongoose.Schema(
  {
    testId: {
      type: String,
      unique: true,
      default: () => 'LAB-' + uuidv4().slice(0, 8).toUpperCase(),
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    technicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    testType: {
      type: String,
      enum: ['blood', 'urine', 'stool', 'x-ray', 'ultrasound', 'ct-scan', 'mri', 'ecg', 'echo', 'eeg', 'biopsy', 'other'],
      required: true,
    },
    testName: {
      type: String,
      required: true,
    },
    testCategory: {
      type: String,
      enum: ['hematology', 'biochemistry', 'immunology', 'microbiology', 'radiology', 'cardiology', 'neurology', 'pathology'],
      required: true,
    },
    orderDate: {
      type: Date,
      required: true,
    },
    sampleCollectionDate: Date,
    reportGenerationDate: Date,
    status: {
      type: String,
      enum: ['ordered', 'sample-collected', 'in-progress', 'completed', 'cancelled'],
      default: 'ordered',
    },
    sampleDetails: {
      sampleId: String,
      sampleType: String,
      collectedBy: String,
      storageLocation: String,
    },
    testResults: {
      parameters: [
        {
          parameterName: String,
          value: String,
          unit: String,
          referenceRange: {
            min: Number,
            max: Number,
          },
          status: {
            type: String,
            enum: ['normal', 'abnormal', 'critical'],
          },
        },
      ],
      reportFile: String,
      remarks: String,
      interpretation: String,
    },
    cost: {
      testCost: Number,
      discountApplied: {
        type: Number,
        default: 0,
      },
      totalCost: Number,
    },
    billingStatus: {
      type: String,
      enum: ['pending', 'paid', 'cancelled'],
      default: 'pending',
    },
    attachments: [
      {
        fileUrl: String,
        fileType: String,
        uploadDate: Date,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('LabTest', labTestSchema);

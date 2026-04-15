const mongoose = require('mongoose');

const emrSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    visitDate: {
      type: Date,
      required: true,
    },
    visitType: {
      type: String,
      enum: ['consultation', 'follow-up', 'emergency'],
    },
    chiefComplaint: String,
    presentingComplaints: [String],
    medicalHistory: String,
    physicalExamination: String,
    investigations: {
      labTests: [
        {
          testName: String,
          testId: mongoose.Schema.Types.ObjectId,
          status: {
            type: String,
            enum: ['pending', 'completed', 'cancelled'],
          },
          results: String,
        },
      ],
      imaging: [String],
    },
    diagnosis: [
      {
        condition: String,
        severity: {
          type: String,
          enum: ['mild', 'moderate', 'severe'],
        },
        icCode: String, // ICD-10 code
      },
    ],
    treatment: {
      medications: [
        {
          medicationId: mongoose.Schema.Types.ObjectId,
          name: String,
          dosage: String,
          frequency: String,
          duration: String,
          instructions: String,
        },
      ],
      procedures: [String],
      referrals: [
        {
          specialization: String,
          doctorId: mongoose.Schema.Types.ObjectId,
          reason: String,
        },
      ],
    },
    notes: String,
    attachments: [
      {
        fileUrl: String,
        fileType: String,
        uploadDate: Date,
      },
    ],
    vitalSigns: {
      bloodPressure: String, // 120/80
      heartRate: Number,
      temperature: Number,
      respiratoryRate: Number,
      oxygenSaturation: Number,
      weight: Number,
      height: Number,
    },
    followUp: {
      isRequired: Boolean,
      schedule: Date,
      reason: String,
    },
    version: {
      type: Number,
      default: 1,
    },
    previousVersions: [
      {
        version: Number,
        data: mongoose.Schema.Types.Mixed,
        modifiedAt: Date,
        modifiedBy: mongoose.Schema.Types.ObjectId,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('EMR', emrSchema);

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const prescriptionSchema = new mongoose.Schema(
  {
    prescriptionId: {
      type: String,
      unique: true,
      default: () => 'RX-' + uuidv4().slice(0, 8).toUpperCase(),
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    emrId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EMR',
      required: true,
    },
    medicines: [
      {
        medicineId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Medicine',
          required: true,
        },
        medicineName: String,
        dosage: {
          quantity: Number,
          unit: {
            type: String,
            enum: ['mg', 'ml', 'tablet', 'capsule'],
          },
        },
        frequency: {
          type: String,
          enum: ['once daily', 'twice daily', 'thrice daily', 'every 4 hours', 'every 6 hours', 'as needed'],
        },
        duration: Number, // in days
        instructions: String,
        isMandatory: Boolean,
      },
    ],
    prescriptionDate: {
      type: Date,
      required: true,
    },
    validUntil: Date,
    status: {
      type: String,
      enum: ['active', 'expired', 'completed', 'cancelled'],
      default: 'active',
    },
    refillsAllowed: Number,
    refillsUsed: {
      type: Number,
      default: 0,
    },
    notes: String,
    digitalSignature: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Prescription', prescriptionSchema);

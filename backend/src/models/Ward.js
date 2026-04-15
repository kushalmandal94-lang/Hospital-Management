const mongoose = require('mongoose');

const bedSchema = new mongoose.Schema(
  {
    bedNumber: {
      type: String,
      required: true,
      unique: true,
    },
    wardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ward',
      required: true,
    },
    bedType: {
      type: String,
      enum: ['single', 'double', 'standard', 'premium'],
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'maintenance', 'reserved'],
      default: 'available',
    },
    currentPatient: {
      patientId: mongoose.Schema.Types.ObjectId,
      admissionDate: Date,
      expectedDischargeDate: Date,
    },
    features: [String], // e.g., ['AC', 'TV', 'Attached Bathroom']
    costPerDay: Number,
  },
  { timestamps: true }
);

const wardSchema = new mongoose.Schema(
  {
    wardName: {
      type: String,
      required: true,
      enum: ['ICU', 'General Ward', 'Private Ward', 'Pediatrics', 'Maternity', 'Isolation'],
    },
    wardType: {
      type: String,
      enum: ['icu', 'general', 'private', 'pediatrics', 'maternity', 'isolation'],
      required: true,
    },
    totalBeds: {
      type: Number,
      required: true,
    },
    occupiedBeds: {
      type: Number,
      default: 0,
    },
    availableBeds: {
      type: Number,
      required: true,
    },
    wardIncharge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    staff: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        role: String,
        startDate: Date,
      },
    ],
    amenities: [String],
    averageCostPerDay: Number,
    beds: [mongoose.Schema.Types.ObjectId],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = {
  Bed: mongoose.model('Bed', bedSchema),
  Ward: mongoose.model('Ward', wardSchema),
};

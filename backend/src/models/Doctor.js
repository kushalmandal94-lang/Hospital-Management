const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
    },
    specialization: {
      type: String,
      enum: [
        'Cardiology',
        'Neurology',
        'Orthopedics',
        'Dermatology',
        'ENT',
        'General Surgery',
        'Pediatrics',
        'Gynecology',
        'Psychiatry',
        'Oncology',
        'Radiology',
        'Pathology',
        'General Physician',
      ],
      required: true,
    },
    availability: [
      {
        day: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          required: true,
        },
        startTime: {
          type: String,
          required: true,
        },
        endTime: {
          type: String,
          required: true,
        },
      },
    ],
    experience: {
      type: Number,
      required: true,
      min: 0,
    },
    qualification: [String],
    bio: String,
    consultationFee: {
      type: Number,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    availableDays: [
      {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      },
    ],
    availableSlots: {
      startTime: String, // HH:MM format
      endTime: String, // HH:MM format
      slotDuration: {
        type: Number,
        default: 30, // minutes
      },
    },
    patients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
      },
    ],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    totalConsultations: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Doctor', doctorSchema);

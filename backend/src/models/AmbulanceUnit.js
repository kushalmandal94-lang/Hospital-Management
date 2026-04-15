const mongoose = require('mongoose');

const ambulanceUnitSchema = new mongoose.Schema(
  {
    unitCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    vehicleNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    driverName: {
      type: String,
      required: true,
      trim: true,
    },
    driverPhone: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['available', 'busy', 'maintenance'],
      default: 'available',
      index: true,
    },
    baseLocation: {
      address: {
        type: String,
        required: true,
      },
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    },
    currentLocation: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
      lastUpdatedAt: {
        type: Date,
        default: Date.now,
      },
    },
    equipment: {
      type: [String],
      default: [],
    },
    averageSpeedKmph: {
      type: Number,
      default: 40,
      min: 10,
      max: 120,
    },
    assignedRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmergencyRequest',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AmbulanceUnit', ambulanceUnitSchema);

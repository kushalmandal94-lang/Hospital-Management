const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const locationSchema = new mongoose.Schema(
  {
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
  { _id: false }
);

const emergencyRequestSchema = new mongoose.Schema(
  {
    requestCode: {
      type: String,
      unique: true,
      default: () => `ER-${uuidv4().slice(0, 8).toUpperCase()}`,
    },
    patientName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    emergencyType: {
      type: String,
      enum: ['accident', 'heart-attack', 'pregnancy', 'other'],
      required: true,
    },
    priorityLevel: {
      type: String,
      enum: ['normal', 'critical'],
      default: 'normal',
    },
    pickupLocation: {
      type: locationSchema,
      required: true,
    },
    dropLocation: {
      type: locationSchema,
      required: false,
    },
    assignedAmbulance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AmbulanceUnit',
      default: null,
    },
    status: {
      type: String,
      enum: ['waiting-assignment', 'ambulance-dispatched', 'on-the-way', 'arrived', 'completed', 'cancelled'],
      default: 'waiting-assignment',
      index: true,
    },
    estimatedArrivalMinutes: {
      type: Number,
      default: null,
    },
    dispatchedAt: {
      type: Date,
      default: null,
    },
    arrivedAt: {
      type: Date,
      default: null,
    },
    requesterUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notifications: {
      smsSent: {
        type: Boolean,
        default: false,
      },
      emailSent: {
        type: Boolean,
        default: false,
      },
      adminAlerted: {
        type: Boolean,
        default: false,
      },
    },
    statusTimeline: [
      {
        status: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        note: {
          type: String,
          default: '',
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmergencyRequest', emergencyRequestSchema);

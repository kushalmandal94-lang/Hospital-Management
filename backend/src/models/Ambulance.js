const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ambulanceSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      unique: true,
      default: () => 'AMB-' + uuidv4().slice(0, 8).toUpperCase(),
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    ambulanceType: {
      type: String,
      enum: ['basic-life-support', 'advanced-life-support', 'critical-care'],
      required: true,
    },
    vehicleNumber: String,
    vehicleDetails: {
      make: String,
      model: String,
      capacity: Number,
      equipmentList: [String],
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    paramedicsAssigned: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    requestDateTime: {
      type: Date,
      required: true,
    },
    pickupLocation: {
      address: String,
      latitude: Number,
      longitude: Number,
    },
    deliveryLocation: {
      address: String,
      latitude: Number,
      longitude: Number,
    },
    priority: {
      type: String,
      enum: ['routine', 'urgent', 'emergency'],
      default: 'emergency',
    },
    patientCondition: {
      symptoms: [String],
      consciousness: String,
      vitals: {
        bloodPressure: String,
        heartRate: Number,
        temperature: Number,
      },
    },
    estimatedArrivalTime: Date,
    actualArrivalTime: Date,
    departureTime: Date,
    arrivalAtHospital: Date,
    status: {
      type: String,
      enum: [
        'requested',
        'assigned',
        'en-route',
        'patient-picked-up',
        'in-transit',
        'arrived-hospital',
        'completed',
        'cancelled',
      ],
      default: 'requested',
    },
    currentLocation: {
      latitude: Number,
      longitude: Number,
      lastUpdatedAt: Date,
    },
    cost: Number,
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'cancelled'],
      default: 'pending',
    },
    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ambulance', ambulanceSchema);

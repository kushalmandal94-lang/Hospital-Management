const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const appointmentSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      unique: true,
      default: () => 'APT-' + uuidv4().slice(0, 8).toUpperCase(),
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    date: {
      type: Date,
    },
    startTime: {
      type: String,
      required: true, // HH:MM format
    },
    endTime: {
      type: String,
      required: true, // HH:MM format
    },
    consultationType: {
      type: String,
      enum: ['in-person', 'telemedicine'],
      default: 'in-person',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show', 'scheduled'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['routine', 'urgent', 'emergency'],
      default: 'routine',
    },
    reason: String,
    symptoms: [String],
    queueToken: {
      type: Number,
      default: null,
    },
    notes: String,
    reminderSent: {
      type: Boolean,
      default: false,
    },
    reminderSentAt: Date,
    reminderLeadMinutes: {
      type: Number,
      default: 60,
      min: 5,
      max: 1440,
    },
    reminderChannels: {
      email: {
        type: Boolean,
        default: true,
      },
      sms: {
        type: Boolean,
        default: true,
      },
      inApp: {
        type: Boolean,
        default: true,
      },
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    review: String,
    reviewSubmittedAt: Date,
    videoSession: {
      provider: {
        type: String,
        enum: ['webrtc', 'zoom'],
        default: 'webrtc',
      },
      roomId: String,
      joinUrl: String,
      hostUrl: String,
      meetingId: String,
      password: String,
      createdAt: Date,
    },
  },
  { timestamps: true }
);

appointmentSchema.pre('save', function (next) {
  if (!this.date && this.appointmentDate) {
    this.date = this.appointmentDate;
  }

  if (!this.appointmentDate && this.date) {
    this.appointmentDate = this.date;
  }

  next();
});

module.exports = mongoose.model('Appointment', appointmentSchema);

const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userRole: String,
    action: {
      type: String,
      enum: [
        'login',
        'logout',
        'create',
        'update',
        'delete',
        'view',
        'download',
        'upload',
        'approve',
        'reject',
        'payment',
      ],
      required: true,
    },
    module: {
      type: String,
      enum: [
        'authentication',
        'patient',
        'doctor',
        'appointment',
        'emr',
        'prescription',
        'medicine',
        'lab-test',
        'billing',
        'ward',
        'ambulance',
        'report',
      ],
      required: true,
    },
    entityType: String, // e.g., 'Patient', 'Appointment'
    entityId: mongoose.Schema.Types.ObjectId,
    details: mongoose.Schema.Types.Mixed, // Flexible schema for additional details
    ipAddress: String,
    userAgent: String,
    status: {
      type: String,
      enum: ['success', 'failure'],
      default: 'success',
    },
    errorMessage: String,
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for efficient querying
activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });
activityLogSchema.index({ module: 1, timestamp: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);

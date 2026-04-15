const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const billingSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      default: () => 'INV-' + uuidv4().slice(0, 8).toUpperCase(),
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
    invoiceDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: Date,
    billItems: [
      {
        itemType: {
          type: String,
          enum: ['consultation', 'lab-test', 'medicine', 'procedure', 'bed-charges', 'other'],
          required: true,
        },
        description: String,
        referenceId: mongoose.Schema.Types.ObjectId,
        quantity: Number,
        unitPrice: Number,
        discount: {
          type: Number,
          default: 0,
        },
        total: Number,
      },
    ],
    summary: {
      subtotal: Number,
      gstRate: {
        type: Number,
        default: 18, // percentage
      },
      gstAmount: Number,
      discountAmount: {
        type: Number,
        default: 0,
      },
      totalAmount: Number,
    },
    insurance: {
      insuranceProvider: String,
      policyNumber: String,
      claimAmount: {
        type: Number,
        default: 0,
      },
      claimStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'na'],
        default: 'na',
      },
    },
    paymentDetails: {
      paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'upi', 'net-banking', 'check', 'insurance'],
      },
      transactionId: String,
      paymentGateway: String,
      paymentDate: Date,
      paymentStatus: {
        type: String,
        enum: ['pending', 'partial', 'completed', 'failed', 'refunded'],
        default: 'pending',
      },
    },
    refund: {
      isRefunded: {
        type: Boolean,
        default: false,
      },
      refundAmount: {
        type: Number,
        default: 0,
      },
      refundReason: String,
      refundDate: Date,
    },
    notes: String,
    status: {
      type: String,
      enum: ['draft', 'issued', 'paid', 'cancelled'],
      default: 'draft',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Billing', billingSchema);

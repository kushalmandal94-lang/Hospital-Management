const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    medicineName: {
      type: String,
      required: true,
      trim: true,
    },
    genericName: String,
    medicineType: {
      type: String,
      enum: ['tablet', 'capsule', 'syrup', 'injection', 'drops', 'cream', 'powder', 'spray'],
      required: true,
    },
    strength: String, // e.g., "500mg", "10ml"
    manufacturer: {
      type: String,
      required: true,
    },
    batchNumber: {
      type: String,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    manufacturingDate: Date,
    cost: {
      purchasePrice: Number,
      sellingPrice: {
        type: Number,
        required: true,
      },
      discount: {
        type: Number,
        default: 0,
      },
    },
    stock: {
      quantity: {
        type: Number,
        required: true,
        min: 0,
      },
      unit: {
        type: String,
        enum: ['pieces', 'bottles', 'strips', 'vials', 'boxes'],
      },
      minThreshold: Number,
      maxThreshold: Number,
    },
    supplier: {
      supplierId: mongoose.Schema.Types.ObjectId,
      supplierName: String,
      supplierPhone: String,
      supplierEmail: String,
    },
    indications: [String],
    contraindications: [String],
    sideEffects: [String],
    dosageInstructions: String,
    storageInstructions: String,
    regulatoryInfo: {
      hsn: String, // Harmonized System of Nomenclature
      gst: Number,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    stockAlertSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Medicine', medicineSchema);

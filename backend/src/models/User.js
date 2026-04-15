const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ['super_admin', 'admin', 'doctor', 'nurse', 'receptionist', 'patient', 'pharmacist', 'lab_technician', 'accountant'],
      required: [true, 'Role is required'],
      default: 'patient',
    },
    profilePicture: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
    },
    mfaSecret: {
      type: String,
      default: null,
      select: false,
    },
  },
  { timestamps: true }
);

// Keep phone unique only when a non-empty string is present.
userSchema.index(
  { phone: 1 },
  {
    name: 'phone_1',
    unique: true,
    sparse: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.name && (this.firstName || this.lastName)) {
    this.name = `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }

  if (!this.firstName && this.name) {
    const [firstName, ...rest] = this.name.trim().split(' ');
    this.firstName = firstName;
    this.lastName = rest.join(' ');
  }

  if (!this.isModified('password')) {
    if (this.phone !== undefined && this.phone !== null) {
      const normalizedPhone = String(this.phone).trim();
      this.phone = normalizedPhone || undefined;
    }
    return next();
  }

  if (this.phone !== undefined && this.phone !== null) {
    const normalizedPhone = String(this.phone).trim();
    this.phone = normalizedPhone || undefined;
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

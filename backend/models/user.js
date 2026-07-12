import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['client', 'lawyer', 'admin'], default: 'client' },
  specialization: String,
  city: String,
  phone: String,
  experience: String,
  bio: String,
  barCouncilRegNumber: String,
  stateBarCouncil: String,
  yearOfEnrollment: String,
  officeAddress: String,
  aadhaarNumber: String,
  panNumber: String,
  isVerified: { type: Boolean, default: false },
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  otp: String,
  otpExpires: Date,
  resetOtp: String,
  resetOtpExpires: Date
}, { timestamps: true });

export default mongoose.model('User', userSchema);
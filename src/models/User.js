const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  password: {
    type: String,
    required: true
  },

  phone: {
    type: String
  },

  role: {
    type: String,
    enum: ["faculty", "student"],
    required: true
  },

  gender: {
    type: String,
    enum: ["male", "female"],
    required: true,
    lowercase: true
  },

  otp: {
    type: String
  },

  otpExpiry: {
    type: Date
  },

  isVerified: {
    type: Boolean,
    default: false
  },
  
  upiId: {
    type: String,
    trim: true,
    lowercase: true
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);

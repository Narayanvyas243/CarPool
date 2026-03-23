const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/sendEmail");

const router = express.Router();

/* ==============================
   SIGNUP WITH OTP
================================= */
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, phone, gender } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Automatic Role Assignment
    let role;

    if (email.endsWith("@ddn.upes.ac.in")) {
      role = "faculty";
    } else if (email.endsWith("@stu.upes.ac.in")) {
      role = "student";
    } else {
      return res.status(400).json({
        message: "Invalid UPES email. Use official UPES email."
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const normalizedGender = gender?.toLowerCase();
    if (!["male", "female"].includes(normalizedGender)) {
      return res.status(400).json({
        message: "Invalid gender. Use male or female."
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Create user with OTP
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
      gender: normalizedGender,
      otp,
      otpExpiry: Date.now() + 5 * 60 * 1000, // 5 minutes
      isVerified: false
    });

    // Send OTP Email
    await sendEmail(email, otp);

    res.status(201).json({
      message: "OTP sent to your email. Please verify."
    });

  } catch (error) {
    res.status(500).json({
      message: "Signup failed",
      error: error.message
    });
  }
});

/* ==============================
   VERIFY OTP
================================= */
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;

    await user.save();

    res.status(200).json({
      message: "Account verified successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: "OTP verification failed",
      error: error.message
    });
  }
});

/* ==============================
   LOGIN
================================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res.status(400).json({
        message: "Please verify your email before login"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password"
      });
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        gender: user.gender
      }
    });

  } catch (error) {
    res.status(500).json({
      message: "Login failed",
      error: error.message
    });
  }
});

module.exports = router;

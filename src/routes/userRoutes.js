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
    const { name, password, phone, gender } = req.body;
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ message: "User already exists" });
      }
      // If user exists but is not verified, we allow them to "re-signup" 
      // This will update their details and send a new OTP.
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
    const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes

    if (existingUser) {
      // Update existing unverified user
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.phone = phone;
      existingUser.role = role;
      existingUser.gender = normalizedGender;
      existingUser.otp = otp;
      existingUser.otpExpiry = otpExpiry;
      await existingUser.save();
    } else {
      // Create new user
      await User.create({
        name,
        email,
        password: hashedPassword,
        phone,
        role,
        gender: normalizedGender,
        otp,
        otpExpiry,
        isVerified: false
      });
    }

    // Send OTP Email asynchronously to prevent hanging
    sendEmail(email, otp).catch(async (emailErr) => {
      console.error("Email error:", emailErr);
      try {
        const userToUpdate = await User.findOne({ email });
        if (userToUpdate) {
          userToUpdate.otp = "123456";
          await userToUpdate.save();
        }
      } catch (err) {
        console.error("Error updating fallback OTP:", err);
      }
    });

    res.status(201).json({
      message: "OTP sent to your email. Please verify. (If email fails, use 123456 for testing)"
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
      message: "Account verified successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        gender: user.gender,
        phone: user.phone,
        upiId: user.upiId
      }
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
        gender: user.gender,
        phone: user.phone,
        upiId: user.upiId
      }
    });

  } catch (error) {
    res.status(500).json({
      message: "Login failed",
      error: error.message
    });
  }
});

/* ==============================
   GET USER
================================= */
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -otp -otpExpiry");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // --- Feedback / Rating Calculation (5-Day Delay logic) ---
    const Feedback = require("../models/Feedback");
    // Only include feedbacks created more than 5 days ago to protect anonymity
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const validFeedbacks = await Feedback.find({
      toUser: user._id,
      createdAt: { $lte: fiveDaysAgo }
    });

    let rating = 0;
    if (validFeedbacks.length > 0) {
      const sum = validFeedbacks.reduce((acc, curr) => acc + curr.rating, 0);
      rating = Number((sum / validFeedbacks.length).toFixed(1));
    }

    const userObj = user.toObject();
    
    res.status(200).json({
      ...userObj,
      currentRating: rating,
      reviewCount: validFeedbacks.length
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching user details",
      error: error.message
    });
  }
});

/* ==============================
   UPDATE USER PROFILE
================================= */
router.put("/:id", async (req, res) => {
  try {
    const { name, phone, gender } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (gender) {
      const normalizedGender = gender.toLowerCase();
      if (["male", "female"].includes(normalizedGender)) {
        user.gender = normalizedGender;
      }
    }
    if (req.body.upiId !== undefined) user.upiId = req.body.upiId;

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        gender: user.gender,
        phone: user.phone,
        upiId: user.upiId
      }
    });

  } catch (error) {
    res.status(500).json({
      message: "Error updating profile",
      error: error.message
    });
  }
});

/* ==============================
   UPDATE PASSWORD
================================= */
router.put("/:id/password", async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect old password" });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });

  } catch (error) {
    res.status(500).json({
      message: "Error updating password",
      error: error.message
    });
  }
});

/* ==============================
   DELETE USER
================================= */
router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting account",
      error: error.message
    });
  }
});

/* ==============================
   FORGOT PASSWORD - REQUEST OTP
================================= */
router.post("/forgot-password", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found with this email" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes
    await user.save();

    // Send OTP Email asynchronously to prevent hanging
    sendEmail(
      email, 
      otp, 
      "SmartPool Password Reset", 
      `Your password reset OTP is ${otp}. It will expire in 5 minutes.`
    ).catch(async (emailErr) => {
      console.error("Email error:", emailErr);
      try {
        const userToUpdate = await User.findOne({ email });
        if (userToUpdate) {
          userToUpdate.otp = "123456";
          await userToUpdate.save();
        }
      } catch (err) {
        console.error("Error updating fallback OTP:", err);
      }
    });

    res.status(200).json({ message: "OTP sent to your email. (If email fails, use 123456 for testing)" });

  } catch (error) {
    res.status(500).json({
      message: "Failed to send reset OTP",
      error: error.message
    });
  }
});

/* ==============================
   FORGOT PASSWORD - VERIFY OTP
================================= */
router.post("/verify-forgot-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    res.status(200).json({ message: "OTP verified. You can now reset your password." });

  } catch (error) {
    res.status(500).json({
      message: "OTP verification failed",
      error: error.message
    });
  }
});

/* ==============================
   FORGOT PASSWORD - RESET PASSWORD
================================= */
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP session" });
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    
    // Clear OTP fields
    user.otp = undefined;
    user.otpExpiry = undefined;
    
    await user.save();

    res.status(200).json({ message: "Password reset successfully. You can now login." });

  } catch (error) {
    res.status(500).json({
      message: "Password reset failed",
      error: error.message
    });
  }
});

module.exports = router;

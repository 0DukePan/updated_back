import express from "express"
import { sendOTP, verifyOTP, socialLogin, register } from "../controllers/auth.controller.js"
import {
  validateSendOTP,
  validateVerifyOTP,
  validateRegister,
  validateSocialLogin,
} from "../middlewares/auth.validator.js"
import { otpRateLimiter } from "../middlewares/rateLimiter.js"

const router = express.Router()

// OTP routes
router.post("/send-otp", validateSendOTP, otpRateLimiter, sendOTP)
router.post("/verify-otp", validateVerifyOTP, verifyOTP)

// Social login
router.post("/social-login", validateSocialLogin, socialLogin)

// Registration
router.post("/register", validateRegister, register)

export default router

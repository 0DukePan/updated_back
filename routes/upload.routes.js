import express from "express"
const router = express.Router()
import { protect } from "../middlewares/auth.middleware.js"
import {
  uploadSingleImage,
  uploadMultipleImagesController,
  deleteImageController,
  uploadProfileImage,
  uploadRestaurantImage,
  uploadMenuItemImage,
} from "../controllers/upload.controller.js"
import { uploadSingle, uploadMultiple, handleUploadErrors } from "../middlewares/upload.middleware.js"

// General upload routes
router.post("/image", protect, uploadSingle, handleUploadErrors, uploadSingleImage)
router.post("/images", protect, uploadMultiple, handleUploadErrors, uploadMultipleImagesController)
router.delete("/image", protect, deleteImageController)

// Specific upload routes
router.post("/profile", protect, uploadSingle, handleUploadErrors, uploadProfileImage)
router.post("/restaurant", protect, uploadSingle, handleUploadErrors, uploadRestaurantImage)
router.post("/menu-item", protect, uploadSingle, handleUploadErrors, uploadMenuItemImage)

export default router

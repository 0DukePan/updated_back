// import fs from "fs"
// import { User } from "../models/user.model.js"
// import { Restaurant } from "../models/restaurant.model.js"
// import { MenuItem } from "../models/menuItem.model.js"
// import { uploadImage, uploadMultipleImages, deleteImage } from "../services/cloudinaryService.js"

// /**
//  * @desc    Upload a single image
//  * @route   POST /api/upload/image
//  * @access  Private
//  */
// export const uploadSingleImage = async (req, res) => {
//   try {
//     // Check if file was uploaded via multer
//     if (req.file) {
//       const filePath = req.file.path
//       const folder = req.body.folder || "food_delivery"

//       // Read file as base64
//       const fileData = fs.readFileSync(filePath)
//       const base64Image = `data:${req.file.mimetype};base64,${fileData.toString("base64")}`

//       // Upload to Cloudinary
//       const result = await uploadImage(base64Image, folder)

//       // Delete temporary file
//       fs.unlinkSync(filePath)

//       return res.status(200).json({
//         success: true,
//         imageUrl: result.secure_url,
//         publicId: result.public_id,
//       })
//     }

//     // If no file was uploaded, check for base64 image in request body
//     const { image, folder } = req.body

//     if (!image) {
//       return res.status(400).json({ message: "No image provided" })
//     }

//     const result = await uploadImage(image, folder || "food_delivery")

//     res.status(200).json({
//       success: true,
//       imageUrl: result.secure_url,
//       publicId: result.public_id,
//     })
//   } catch (error) {
//     console.error("Upload error:", error)
//     res.status(500).json({ message: error.message || "Server Error" })
//   }
// }

// /**
//  * @desc    Upload multiple images
//  * @route   POST /api/upload/images
//  * @access  Private
//  */
// export const uploadMultipleImagesController = async (req, res) => {
//   try {
//     // Check if files were uploaded via multer
//     if (req.files && req.files.length > 0) {
//       const folder = req.body.folder || "food_delivery"
//       const uploadPromises = req.files.map((file) => {
//         // Read file as base64
//         const fileData = fs.readFileSync(file.path)
//         const base64Image = `data:${file.mimetype};base64,${fileData.toString("base64")}`

//         // Upload to Cloudinary
//         return uploadImage(base64Image, folder)
//       })

//       // Wait for all uploads to complete
//       const results = await Promise.all(uploadPromises)

//       // Delete temporary files
//       req.files.forEach((file) => fs.unlinkSync(file.path))

//       return res.status(200).json({
//         success: true,
//         images: results.map((result) => ({
//           imageUrl: result.secure_url,
//           publicId: result.public_id,
//         })),
//       })
//     }

//     // If no files were uploaded, check for base64 images in request body
//     const { images, folder } = req.body

//     if (!images || !images.length) {
//       return res.status(400).json({ message: "No images provided" })
//     }

//     const results = await uploadMultipleImages(images, folder || "food_delivery")

//     res.status(200).json({
//       success: true,
//       images: results.map((result) => ({
//         imageUrl: result.secure_url,
//         publicId: result.public_id,
//       })),
//     })
//   } catch (error) {
//     console.error("Multiple upload error:", error)
//     res.status(500).json({ message: error.message || "Server Error" })
//   }
// }

// /**
//  * @desc    Upload profile image
//  * @route   POST /api/upload/profile
//  * @access  Private
//  */
// export const uploadProfileImage = async (req, res) => {
//   try {
//     const userId = req.user._id
//     let imageToUpload

//     // Check if file was uploaded via multer
//     if (req.file) {
//       // Read file as base64
//       const fileData = fs.readFileSync(req.file.path)
//       imageToUpload = `data:${req.file.mimetype};base64,${fileData.toString("base64")}`
//     } else {
//       // Check for base64 image in request body
//       imageToUpload = req.body.image
//     }

//     if (!imageToUpload) {
//       return res.status(400).json({ message: "No image provided" })
//     }

//     // Upload to Cloudinary
//     const result = await uploadImage(imageToUpload, "food_delivery/profiles")

//     // Delete temporary file if it exists
//     if (req.file) {
//       fs.unlinkSync(req.file.path)
//     }

//     // Update user profile
//     const user = await User.findByIdAndUpdate(userId, { profileImage: result.secure_url }, { new: true })

//     res.status(200).json({
//       success: true,
//       imageUrl: result.secure_url,
//       user: {
//         _id: user._id,
//         fullName: user.fullName,
//         email: user.email,
//         mobileNumber: user.mobileNumber,
//         profileImage: user.profileImage,
//       },
//     })
//   } catch (error) {
//     console.error("Profile upload error:", error)
//     res.status(500).json({ message: error.message || "Server Error" })
//   }
// }

// /**
//  * @desc    Upload restaurant image
//  * @route   POST /api/upload/restaurant
//  * @access  Private (Restaurant Owner)
//  */
// export const uploadRestaurantImage = async (req, res) => {
//   try {
//     const { restaurantId, type } = req.body
//     let imageToUpload

//     // Check if file was uploaded via multer
//     if (req.file) {
//       // Read file as base64
//       const fileData = fs.readFileSync(req.file.path)
//       imageToUpload = `data:${req.file.mimetype};base64,${fileData.toString("base64")}`
//     } else {
//       // Check for base64 image in request body
//       imageToUpload = req.body.image
//     }

//     if (!imageToUpload) {
//       return res.status(400).json({ message: "No image provided" })
//     }

//     if (!restaurantId) {
//       return res.status(400).json({ message: "Restaurant ID is required" })
//     }

//     // Check if user owns the restaurant
//     const restaurant = await Restaurant.findById(restaurantId)

//     if (!restaurant) {
//       return res.status(404).json({ message: "Restaurant not found" })
//     }

//     if (restaurant.owner.toString() !== req.user._id.toString() && !req.user.isAdmin) {
//       return res.status(403).json({ message: "Not authorized to update this restaurant" })
//     }

//     // Upload to Cloudinary
//     const result = await uploadImage(imageToUpload, "food_delivery/restaurants")

//     // Delete temporary file if it exists
//     if (req.file) {
//       fs.unlinkSync(req.file.path)
//     }

//     // Update restaurant based on image type
//     const updateField = {}

//     if (type === "logo") {
//       updateField.logo = result.secure_url
//     } else if (type === "cover") {
//       updateField.coverImage = result.secure_url
//     } else {
//       // Add to images array
//       updateField.$push = { images: result.secure_url }
//     }

//     const updatedRestaurant = await Restaurant.findByIdAndUpdate(restaurantId, updateField, { new: true })

//     res.status(200).json({
//       success: true,
//       imageUrl: result.secure_url,
//       restaurant: updatedRestaurant,
//     })
//   } catch (error) {
//     console.error("Restaurant upload error:", error)
//     res.status(500).json({ message: error.message || "Server Error" })
//   }
// }

// /**
//  * @desc    Upload menu item image
//  * @route   POST /api/upload/menu-item
//  * @access  Private (Restaurant Owner)
//  */
// export const uploadMenuItemImage = async (req, res) => {
//   try {
//     const { menuItemId } = req.body
//     let imageToUpload

//     // Check if file was uploaded via multer
//     if (req.file) {
//       // Read file as base64
//       const fileData = fs.readFileSync(req.file.path)
//       imageToUpload = `data:${req.file.mimetype};base64,${fileData.toString("base64")}`
//     } else {
//       // Check for base64 image in request body
//       imageToUpload = req.body.image
//     }

//     if (!imageToUpload) {
//       return res.status(400).json({ message: "No image provided" })
//     }

//     if (!menuItemId) {
//       return res.status(400).json({ message: "Menu item ID is required" })
//     }

//     // Check if user owns the restaurant that has this menu item
//     const menuItem = await MenuItem.findById(menuItemId).populate("restaurant")

//     if (!menuItem) {
//       return res.status(404).json({ message: "Menu item not found" })
//     }

//     if (menuItem.restaurant.owner.toString() !== req.user._id.toString() && !req.user.isAdmin) {
//       return res.status(403).json({ message: "Not authorized to update this menu item" })
//     }

//     // Upload to Cloudinary
//     const result = await uploadImage(imageToUpload, "food_delivery/menu_items")

//     // Delete temporary file if it exists
//     if (req.file) {
//       fs.unlinkSync(req.file.path)
//     }

//     // Update menu item
//     const updatedMenuItem = await MenuItem.findByIdAndUpdate(menuItemId, { image: result.secure_url }, { new: true })

//     res.status(200).json({
//       success: true,
//       imageUrl: result.secure_url,
//       menuItem: updatedMenuItem,
//     })
//   } catch (error) {
//     console.error("Menu item upload error:", error)
//     res.status(500).json({ message: error.message || "Server Error" })
//   }
// }

// /**
//  * @desc    Delete image
//  * @route   DELETE /api/upload/image
//  * @access  Private
//  */
// export const deleteImageController = async (req, res) => {
//   try {
//     const { publicId, url } = req.body

//     if (!publicId && !url) {
//       return res.status(400).json({ message: "Public ID or URL is required" })
//     }

//     const result = await deleteImage(publicId || url)

//     res.status(200).json({
//       success: true,
//       result,
//     })
//   } catch (error) {
//     console.error("Delete image error:", error)
//     res.status(500).json({ message: error.message || "Server Error" })
//   }
// }

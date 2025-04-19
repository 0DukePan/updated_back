import { User } from "../models/user.model.js"
import { Restaurant } from "../models/restaurant.model.js"
import { uploadImage } from "../services/cloudinaryService.js"

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-verificationCode -verificationCodeExpires")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email || "",
      phone: user.phone,
      profileImage: user.profileImage || "",
      isAdmin: user.isAdmin,
      isRestaurantOwner: user.isRestaurantOwner,
      addresses: user.addresses || [],
      wallet: {
        balance: user.wallet.balance || 0,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server Error" })
  }
}

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const { fullName, email, profileImage } = req.body

    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (fullName) user.fullName = fullName
    if (email) user.email = email

    // Handle profile image upload if provided as base64
    if (profileImage && profileImage.startsWith("data:image")) {
      try {
        const uploadResult = await uploadImage(profileImage, "food_delivery/profiles")
        user.profileImage = uploadResult.secure_url
      } catch (uploadError) {
        console.error("Profile image upload error:", uploadError)
        return res.status(400).json({ message: "Failed to upload profile image" })
      }
    } else if (profileImage) {
      // If it's a URL, just save it
      user.profileImage = profileImage
    }

    const updatedUser = await user.save()

    res.status(200).json({
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email || "",
      mobileNumber: updatedUser.mobileNumber,
      profileImage: updatedUser.profileImage || "",
      isAdmin: updatedUser.isAdmin,
      isRestaurantOwner: updatedUser.isRestaurantOwner,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server Error" })
  }
}

// @desc    Add user address
// @route   POST /api/users/addresses
// @access  Private
export const addAddress = async (req, res) => {
  try {
    const { type, address, apartment, building, landmark, latitude, longitude, isDefault } = req.body

    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // If new address is default, remove default from other addresses
    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false
      })
    }

    // Add new address
    user.addresses.push({
      type,
      address,
      apartment,
      building,
      landmark,
      latitude,
      longitude,
      isDefault: isDefault || false,
    })

    await user.save()

    res.status(201).json({
      message: "Address added successfully",
      addresses: user.addresses,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server Error" })
  }
}

// @desc    Update user address
// @route   PUT /api/users/addresses/:id
// @access  Private
export const updateAddress = async (req, res) => {
  try {
    const { type, address, apartment, building, landmark, latitude, longitude, isDefault } = req.body

    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Find address by ID
    const addressToUpdate = user.addresses.id(req.params.id)

    if (!addressToUpdate) {
      return res.status(404).json({ message: "Address not found" })
    }

    // If new address is default, remove default from other addresses
    if (isDefault && !addressToUpdate.isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false
      })
    }

    // Update address fields
    if (type) addressToUpdate.type = type
    if (address) addressToUpdate.address = address
    if (apartment) addressToUpdate.apartment = apartment
    if (building) addressToUpdate.building = building
    if (landmark) addressToUpdate.landmark = landmark
    if (latitude) addressToUpdate.latitude = latitude
    if (longitude) addressToUpdate.longitude = longitude
    if (isDefault !== undefined) addressToUpdate.isDefault = isDefault

    await user.save()

    res.status(200).json({
      message: "Address updated successfully",
      addresses: user.addresses,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server Error" })
  }
}

// @desc    Delete user address
// @route   DELETE /api/users/addresses/:id
// @access  Private
export const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Find address by ID
    const addressToDelete = user.addresses.id(req.params.id)

    if (!addressToDelete) {
      return res.status(404).json({ message: "Address not found" })
    }

    // Remove address
    addressToDelete.remove()
    await user.save()

    res.status(200).json({
      message: "Address deleted successfully",
      addresses: user.addresses,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server Error" })
  }
}

// @desc    Get all user addresses
// @route   GET /api/users/addresses
// @access  Private
export const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.status(200).json(user.addresses)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server Error" })
  }
}

// @desc    Add restaurant to favorites
// @route   POST /api/users/favorites
// @access  Private
export const addToFavorites = async (req, res) => {
  try {
    const { restaurantId } = req.body

    // Check if restaurant exists
    const restaurant = await Restaurant.findById(restaurantId)
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" })
    }

    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Check if restaurant is already in favorites
    if (user.favorites.includes(restaurantId)) {
      return res.status(400).json({ message: "Restaurant already in favorites" })
    }

    // Add to favorites
    user.favorites.push(restaurantId)
    await user.save()

    res.status(200).json({
      message: "Added to favorites",
      favorites: user.favorites,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server Error" })
  }
}

// @desc    Remove restaurant from favorites
// @route   DELETE /api/users/favorites/:id
// @access  Private
export const removeFromFavorites = async (req, res) => {
  try {
    const restaurantId = req.params.id

    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Check if restaurant is in favorites
    if (!user.favorites.includes(restaurantId)) {
      return res.status(400).json({ message: "Restaurant not in favorites" })
    }

    // Remove from favorites
    user.favorites = user.favorites.filter((id) => id.toString() !== restaurantId)
    await user.save()

    res.status(200).json({
      message: "Removed from favorites",
      favorites: user.favorites,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server Error" })
  }
}

// @desc    Get favorite restaurants
// @route   GET /api/users/favorites
// @access  Private
export const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "favorites",
      select: "name logo cuisines rating distance location",
    })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.status(200).json(user.favorites)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server Error" })
  }
}

// @desc    Logout user (clear device token)
// @route   POST /api/users/logout
// @access  Private
export const logoutUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Clear device token
    user.deviceToken = undefined
    await user.save()

    res.status(200).json({ message: "Logged out successfully" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server Error" })
  }
}

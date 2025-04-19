import { Restaurant } from "../models/restaurant.model.js"
import { uploadImage } from "../services/cloudinaryService.js"

// @desc    Create a new restaurant
// @route   POST /api/restaurants
// @access  Private (Restaurant Owner)
export const createRestaurant = async (req, res) => {
  try {
    const {
      name,
      description,
      logo,
      coverImage,
      cuisines,
      location,
      contactPhone,
      contactEmail,
      timings,
      minOrderAmount,
      deliveryFee,
      deliveryTime,
    } = req.body

    // Check if user is a restaurant owner
    if (!req.user.isRestaurantOwner && !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized to create restaurants" })
    }

    // Upload logo if provided as base64
    let logoUrl = logo
    if (logo && logo.startsWith("data:image")) {
      try {
        const uploadResult = await uploadImage(logo, "food_delivery/restaurants")
        logoUrl = uploadResult.secure_url
      } catch (uploadError) {
        console.error("Logo upload error:", uploadError)
        return res.status(400).json({ message: "Failed to upload logo" })
      }
    }

    // Upload cover image if provided as base64
    let coverImageUrl = coverImage
    if (coverImage && coverImage.startsWith("data:image")) {
      try {
        const uploadResult = await uploadImage(coverImage, "food_delivery/restaurants")
        coverImageUrl = uploadResult.secure_url
      } catch (uploadError) {
        console.error("Cover image upload error:", uploadError)
        return res.status(400).json({ message: "Failed to upload cover image" })
      }
    }

    const restaurant = await Restaurant.create({
      name,
      description,
      logo: logoUrl,
      coverImage: coverImageUrl,
      owner: req.user._id,
      cuisines,
      location,
      contactPhone,
      contactEmail,
      timings,
      minOrderAmount: minOrderAmount || 0,
      deliveryFee: deliveryFee || 0,
      deliveryTime,
    })

    res.status(201).json(restaurant)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server Error" })
  }
}

// @desc    Get all restaurants
// @route   GET /api/restaurants
// @access  Public
export const getRestaurants = async (req, res) => {
  try {
    const { page = 1, limit = 10, cuisine, search } = req.query

    const query = {}

    // Filter by cuisine if provided
    if (cuisine) {
      query.cuisines = { $in: [cuisine] }
    }

    // Search by name or description if provided
    if (search) {
      query.$or = [{ name: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }

    // Only show active and verified restaurants
    query.isActive = true
    query.isVerified = true

    const restaurants = await Restaurant.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })

    const count = await Restaurant.countDocuments(query)

    res.status(200).json({
      restaurants,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalCount: count,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server Error" })
  }
}

// @desc    Get restaurant by ID
// @route   GET /api/restaurants/:id
// @access  Public
export const getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" })
    }

    res.status(200).json(restaurant)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server Error" })
  }
}

// @desc    Update restaurant
// @route   PUT /api/restaurants/:id
// @access  Private (Restaurant Owner)
export const updateRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" })
    }

    // Check if user is the owner or admin
    if (restaurant.owner.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized to update this restaurant" })
    }

    const {
      name,
      description,
      logo,
      coverImage,
      cuisines,
      location,
      contactPhone,
      contactEmail,
      timings,
      minOrderAmount,
      deliveryFee,
      deliveryTime,
      isActive,
    } = req.body

    // Upload logo if provided as base64
    let logoUrl = logo
    if (logo && logo.startsWith("data:image")) {
      try {
        const uploadResult = await uploadImage(logo, "food_delivery/restaurants")
        logoUrl = uploadResult.secure_url
      } catch (uploadError) {
        console.error("Logo upload error:", uploadError)
        return res.status(400).json({ message: "Failed to upload logo" })
      }
    }

    // Upload cover image if provided as base64
    let coverImageUrl = coverImage
    if (coverImage && coverImage.startsWith("data:image")) {
      try {
        const uploadResult = await uploadImage(coverImage, "food_delivery/restaurants")
        coverImageUrl = uploadResult.secure_url
      } catch (uploadError) {
        console.error("Cover image upload error:", uploadError)
        return res.status(400).json({ message: "Failed to upload cover image" })
      }
    }

    // Update restaurant fields
    if (name) restaurant.name = name
    if (description) restaurant.description = description
    if (logoUrl) restaurant.logo = logoUrl
    if (coverImageUrl) restaurant.coverImage = coverImageUrl
    if (cuisines) restaurant.cuisines = cuisines
    if (location) restaurant.location = location
    if (contactPhone) restaurant.contactPhone = contactPhone
    if (contactEmail) restaurant.contactEmail = contactEmail
    if (timings) restaurant.timings = timings
    if (minOrderAmount !== undefined) restaurant.minOrderAmount = minOrderAmount
    if (deliveryFee !== undefined) restaurant.deliveryFee = deliveryFee
    if (deliveryTime) restaurant.deliveryTime = deliveryTime
    if (isActive !== undefined) restaurant.isActive = isActive

    const updatedRestaurant = await restaurant.save()

    res.status(200).json(updatedRestaurant)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server Error" })
  }
}

// @desc    Delete restaurant
// @route   DELETE /api/restaurants/:id
// @access  Private (Restaurant Owner)
export const deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" })
    }

    // Check if user is the owner or admin
    if (restaurant.owner.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this restaurant" })
    }

    await restaurant.deleteOne()

    res.status(200).json({ message: "Restaurant removed" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server Error" })
  }
}

// @desc    Get nearby restaurants
// @route   GET /api/restaurants/nearby
// @access  Public
export const getNearbyRestaurants = async (req, res) => {
  try {
    const { latitude, longitude, distance = 10, page = 1, limit = 10 } = req.query

    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Latitude and longitude are required" })
    }

    // Convert distance to kilometers (default is 10km)
    const maxDistance = distance * 1000

    const restaurants = await Restaurant.find({
      isActive: true,
      isVerified: true,
      "location.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number.parseFloat(longitude), Number.parseFloat(latitude)],
          },
          $maxDistance: maxDistance,
        },
      },
    })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const count = await Restaurant.countDocuments({
      isActive: true,
      isVerified: true,
      "location.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number.parseFloat(longitude), Number.parseFloat(latitude)],
          },
          $maxDistance: maxDistance,
        },
      },
    })

    res.status(200).json({
      restaurants,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalCount: count,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server Error" })
  }
}

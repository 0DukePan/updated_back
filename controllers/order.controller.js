import { Order } from "../models/order.model.js"
import { Restaurant } from "../models/restaurant.model.js"
import { MenuItem } from "../models/menuItem.model.js"
import { User } from "../models/user.model.js"
import { sendOrderStatusNotification } from "../services/notificationService.js"
import { Notification } from "../models/notification.model.js"

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const { restaurantId, items, deliveryAddress, deliveryInstructions, paymentMethod } = req.body

    // Validate restaurant
    const restaurant = await Restaurant.findById(restaurantId)
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" })
    }

    // Validate items and calculate totals
    let subtotal = 0
    const orderItems = []

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId)
      if (!menuItem) {
        return res.status(404).json({ message: `Menu item not found: ${item.menuItemId}` })
      }

      let itemTotal = menuItem.price * item.quantity

      // Calculate addons price
      const addons = []
      if (item.addons && item.addons.length > 0) {
        for (const addonId of item.addons) {
          const addon = menuItem.addons.id(addonId)
          if (!addon) {
            return res.status(404).json({ message: `Addon not found: ${addonId}` })
          }
          addons.push({
            name: addon.name,
            price: addon.price,
          })
          itemTotal += addon.price * item.quantity
        }
      }

      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        total: itemTotal,
        specialInstructions: item.specialInstructions || "",
        addons,
      })

      subtotal += itemTotal
    }

    // Calculate tax and delivery fee
    const tax = subtotal * 0.1 // 10% tax
    const deliveryFee = restaurant.deliveryFee || 0
    const total = subtotal + tax + deliveryFee

    // Create order
    const order = await Order.create({
      user: req.user._id,
      restaurant: restaurantId,
      items: orderItems,
      subtotal,
      tax,
      deliveryFee,
      total,
      deliveryAddress,
      deliveryInstructions,
      paymentMethod,
      paymentStatus: paymentMethod === "cash" ? "pending" : "pending",
      status: "pending",
    })

    // Create notification for the order
    await Notification.create({
      user: req.user._id,
      title: "Order Placed",
      body: `Your order #${order._id.toString().slice(-6)} has been placed successfully.`,
      data: { orderId: order._id },
      type: "order",
      relatedId: order._id,
    })

    res.status(201).json({
      message: "Order created successfully",
      order,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server Error" })
  }
}

// @desc    Get all orders for a user
// @route   GET /api/orders
// @access  Private
export const getUserOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query

    const query = { user: req.user._id }

    if (status) {
      query.status = status
    }

    const orders = await Order.find(query)
      .populate("restaurant", "name logo")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const count = await Order.countDocuments(query)

    res.status(200).json({
      orders,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalCount: count,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server Error" })
  }
}

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("restaurant", "name logo contactPhone location")
      .populate("items.menuItem", "name image")

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    // Check if the order belongs to the user or if user is admin
    if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(401).json({ message: "Not authorized" })
    }

    res.status(200).json(order)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server Error" })
  }
}

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Admin or Restaurant Owner)
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body

    if (!["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" })
    }

    const order = await Order.findById(req.params.id)

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    // Check if user is admin or restaurant owner
    const restaurant = await Restaurant.findById(order.restaurant)
    if (!req.user.isAdmin && restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" })
    }

    // Update order status
    order.status = status

    // If order is delivered, update delivery time
    if (status === "delivered") {
      order.actualDeliveryTime = new Date()
    }

    await order.save()

    // Send notification to user
    await sendOrderStatusNotification(order.user, order._id, status)

    // Create notification record
    let notificationTitle = "Order Update"
    let notificationBody = `Your order #${order._id.toString().slice(-6)} status has been updated to ${status}.`

    if (status === "delivered") {
      notificationTitle = "Order Delivered"
      notificationBody = `Your order #${order._id.toString().slice(-6)} has been delivered. Enjoy your meal!`
    } else if (status === "cancelled") {
      notificationTitle = "Order Cancelled"
      notificationBody = `Your order #${order._id.toString().slice(-6)} has been cancelled.`
    }

    await Notification.create({
      user: order.user,
      title: notificationTitle,
      body: notificationBody,
      data: { orderId: order._id, status },
      type: "order",
      relatedId: order._id,
    })

    res.status(200).json({
      message: "Order status updated successfully",
      order,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server Error" })
  }
}

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    // Check if the order belongs to the user
    if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(401).json({ message: "Not authorized" })
    }

    // Check if order can be cancelled
    if (!["pending", "confirmed"].includes(order.status)) {
      return res.status(400).json({ message: "Order cannot be cancelled at this stage" })
    }

    // Update order status
    order.status = "cancelled"
    await order.save()

    // If payment was made, initiate refund
    if (order.paymentStatus === "paid" && order.paymentMethod !== "cash") {
      // Refund logic would go here
      // For wallet payment, add back to wallet
      if (order.paymentMethod === "wallet") {
        const user = await User.findById(req.user._id)
        user.wallet.balance += order.total
        user.wallet.transactions.push({
          amount: order.total,
          type: "credit",
          description: `Refund for cancelled order #${order._id.toString().slice(-6)}`,
        })
        await user.save()
      }
    }

    // Create notification for the cancellation
    await Notification.create({
      user: req.user._id,
      title: "Order Cancelled",
      body: `Your order #${order._id.toString().slice(-6)} has been cancelled.`,
      data: { orderId: order._id },
      type: "order",
      relatedId: order._id,
    })

    res.status(200).json({
      message: "Order cancelled successfully",
      order,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server Error" })
  }
}

// @desc    Get restaurant orders
// @route   GET /api/orders/restaurant
// @access  Private (Restaurant Owner)
export const getRestaurantOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query

    // Get restaurants owned by the user
    const restaurants = await Restaurant.find({ owner: req.user._id }).select("_id")

    if (restaurants.length === 0) {
      return res.status(404).json({ message: "No restaurants found for this user" })
    }

    const restaurantIds = restaurants.map((r) => r._id)

    const query = { restaurant: { $in: restaurantIds } }

    if (status) {
      query.status = status
    }

    const orders = await Order.find(query)
      .populate("user", "fullName mobileNumber")
      .populate("restaurant", "name")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const count = await Order.countDocuments(query)

    res.status(200).json({
      orders,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalCount: count,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server Error" })
  }
}

// Export all functions
export default {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getRestaurantOrders,
}

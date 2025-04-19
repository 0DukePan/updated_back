import express from "express"
import {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getRestaurantOrders,
} from "../controllers/order.controller.js"
import { protect } from "../middlewares/auth.middleware.js"
const router = express.Router()

// User order routes
router.post("/", protect, createOrder)
router.get("/", protect, getUserOrders)
router.get("/:id", protect, getOrderById)
router.put("/:id/cancel", protect, cancelOrder)

// Restaurant owner routes
router.get("/restaurant", protect, getRestaurantOrders)
router.put("/:id/status", protect, updateOrderStatus)

export default router

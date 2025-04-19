import mongoose from "mongoose"

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  total: { type: Number, required: true },
  specialInstructions: { type: String },
  addons: [
    {
      name: { type: String },
      price: { type: Number },
    },
  ],
})

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    total: { type: Number, required: true },

    //todo 

    // orderType: {
    //   type: String,
    //   enum: ["Take Away", "Delivery", "Dine-in"],
    //   required: true,
    // },
    status: {
      type: String,
      enum: ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"],
      default: "pending",
    },
    
    //todo 
    // TableId: { type: mongoose.Schema.Types.ObjectId, ref: "Table" },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    paymentMethod: { type: String, enum: ["card", "cash", "wallet"], default: "cash" },
    paymentId: { type: String },
    deliveryAddress: {
      address: { type: String, required: true },
      apartment: { type: String },
      landmark: { type: String },
      latitude: { type: Number },
      longitude: { type: Number },
    },
    deliveryInstructions: { type: String },
    estimatedDeliveryTime: { type: Date },
    actualDeliveryTime: { type: Date },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  },
)

export const Order = mongoose.model("Order", orderSchema)

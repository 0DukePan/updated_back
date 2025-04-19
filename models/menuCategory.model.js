import mongoose from "mongoose"

const menuCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    order: { type: Number, default: 0 }, // For sorting categories
    isAvailable: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
)

export const MenuCategory = mongoose.model("MenuCategory", menuCategorySchema)

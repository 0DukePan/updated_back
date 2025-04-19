import mongoose from "mongoose"

const addonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  isAvailable: { type: Boolean, default: true },
})

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    image: { type: String },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "MenuCategory", required: true },
   
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: false },
   
    isVegetarian: { type: Boolean, default: false },
    isVegan: { type: Boolean, default: false },
    isGlutenFree: { type: Boolean, default: false },
    
    // todo adreb tala 
    // dietaryInfo: {
    //   vegetarian: Boolean,
    //   vegan: Boolean,
    //   glutenFree: Boolean,
    //   lactoseFree: Boolean
    // },
    isAvailable: { type: Boolean, default: true },
    HealthInfo:{
      low_carb: Boolean,
      low_fat: Boolean,
      low_sugar: Boolean,
      low_sodium: Boolean,
    },
    isPopular: { type: Boolean, default: false },
    addons: [addonSchema],
    preparationTime: { type: Number }, // in minutes
  },
  {
    timestamps: true,
  },
)

export const MenuItem = mongoose.model("MenuItem", menuItemSchema)

// In models/table.model.js
const tableSchema = new mongoose.Schema(
  {
    qrCode: {
      type: String,
      required: true,
      unique: true,
    },
    tableNumber: {
      type: Number,
      required: true,
    },
    deviceId: {
      type: String,
      unique: true,
      sparse: true, // Allows null values while maintaining uniqueness for non-null values
    },
    status: {
      type: String,
      enum: ["available", "occupied", "reserved", "cleaning"],
      default: "available",
    },
    currentSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TableSession",
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);
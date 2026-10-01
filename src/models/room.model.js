const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ["standard", "deluxe", "suite"],
    },
    capacity: { type: Number, required: true, min: 1, max: 10 },
    pricePerNight: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["available", "maintenance"],
      default: "available",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Room", roomSchema);

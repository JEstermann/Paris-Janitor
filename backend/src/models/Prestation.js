const mongoose = require("mongoose");

const PrestationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,

  category: {
    type: String,
    enum: ["menage", "checkin", "transport", "maintenance", "photo", "autre"]
  },

  priceHT: { type: Number, required: true },
  priceTTC: Number,

  images: [String],

  isVariablePrice: { type: Boolean, default: false },

  variablePricing: {
    unit: { type: String, enum: ["km", "heure", "forfait"] },
    pricePerUnit: Number
  },

  commissionPJ: Number,

  validated: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Prestation", PrestationSchema);

const mongoose = require("mongoose");

const VipSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["free", "bag_packer", "explorator"],
    default: "free"
  },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  active: { type: Boolean, default: false },
  // Compteurs pour les prestations offertes
  freebiesUsedThisYear: { type: Number, default: 0 },
  freebiesUsedThisWeek: { type: Number, default: 0 },
  yearStartDate: { type: Date, default: null },
  weekStartDate: { type: Date, default: null }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["voyageur", "admin", "prestataire"],
    required: true
  },

  firstName: String,
  lastName: String,

  email: {
    type: String,
    required: true,
    unique: true
  },

  passwordHash: {
    type: String,
    required: true
  },

  phone: String,

  active: { type: Boolean, default: true },
  isSuperAdmin: { type: Boolean, default: false },

  vipSubscription: {
    type: VipSchema,
    default: () => ({})
  }

}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);

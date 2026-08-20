const mongoose = require("mongoose");

const VipSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["free", "bag_packer", "explorator"],
    default: "free"
  },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  active: { type: Boolean, default: false }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["voyageur", "admin"],
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

  vipSubscription: {
    type: VipSchema,
    default: () => ({})
  }

}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);

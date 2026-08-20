const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  action: String,
  targetCollection: String,
  targetId: mongoose.Schema.Types.ObjectId,

  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("AuditLog", AuditLogSchema);

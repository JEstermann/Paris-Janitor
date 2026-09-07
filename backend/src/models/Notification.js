const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  type: {
    type: String,
    enum: [
      "commande_confirmee",
      "commande_assignee",
      "commande_demarree",
      "commande_terminee",
      "commande_annulee",
      "paiement_recu"
    ],
    required: true
  },

  titre: { type: String, required: true },
  message: { type: String, required: true },

  // Lien vers la ressource concernée (optionnel)
  resourceType: { type: String }, // "commande", etc.
  resourceId: { type: mongoose.Schema.Types.ObjectId },

  read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Notification", NotificationSchema);
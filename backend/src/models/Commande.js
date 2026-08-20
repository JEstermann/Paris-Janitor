const mongoose = require("mongoose");

const CommandeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  prestationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Prestation",
    required: true
  },

  prestataireId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Prestataire"
  },

  dateDemande: { type: Date, default: Date.now },
  datePrestation: Date,

  status: {
    type: String,
    enum: ["demande", "confirmee", "en_cours", "terminee", "annulee"],
    default: "demande"
  },

  montantHT: Number,
  montantTTC: Number,
  commissionPJ: Number,

  stripePaymentId: String,

  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending"
  },

  evaluation: {
    note: Number,
    commentaire: String,
    date: Date
  },

  factureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Facture"
  }
}, { timestamps: true });

module.exports = mongoose.model("Commande", CommandeSchema);

const mongoose = require("mongoose");

const FactureSchema = new mongoose.Schema({
  commandeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Commande",
    required: true
  },

  destinataireId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  montantHT: Number,
  montantTTC: Number,
  TVA: Number,
  commissionPJ: Number,

  dateEmission: { type: Date, default: Date.now },

  pdfPath: String,

  statutPaiement: {
    type: String,
    enum: ["paid", "pending", "failed"]
  }
}, { timestamps: true });

module.exports = mongoose.model("Facture", FactureSchema);

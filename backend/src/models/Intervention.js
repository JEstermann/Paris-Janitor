const mongoose = require("mongoose");

const InterventionSchema = new mongoose.Schema({
  commandeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Commande",
    required: true
  },

  prestataireId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Prestataire",
    required: true
  },

  details: String,

  heureDebut: Date,
  heureFin: Date,

  photosAvant: [String],
  photosApres: [String]
}, { timestamps: true });

module.exports = mongoose.model("Intervention", InterventionSchema);

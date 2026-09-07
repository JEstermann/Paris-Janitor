const mongoose = require("mongoose");

const PrestataireSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  phone: String,

  // Lien vers le compte User associé
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true
  },

  validated: { type: Boolean, default: false },

  habilitations: [String],

  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Prestation"
  }],

  tarifs: [{
    prestationId: { type: mongoose.Schema.Types.ObjectId, ref: "Prestation" },
    priceHT: Number
  }],

  disponibilites: [{
    date: Date,
    available: Boolean
  }],

  noteMoyenne: Number
}, { timestamps: true });

module.exports = mongoose.model("Prestataire", PrestataireSchema);

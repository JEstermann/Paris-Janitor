const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  commandeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Commande",
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index pour récupérer les messages d'une commande rapidement
messageSchema.index({ commandeId: 1, createdAt: 1 });

// Index pour les notifications non lues
messageSchema.index({ receiverId: 1, isRead: 1 });

module.exports = mongoose.model("Message", messageSchema);

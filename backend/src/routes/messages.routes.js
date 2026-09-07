const router = require("express").Router();
const Message = require("../models/Message");
const Commande = require("../models/Commande");
const Prestataire = require("../models/Prestataire");
const auth = require("../middlewares/auth.middleware");
const Notification = require("../models/Notification");

// Créer une notification pour un utilisateur
async function createNotification(userId, type, titre, message, resourceType, resourceId) {
  if (!userId) return;
  try {
    await Notification.create({ userId, type, titre, message, resourceType, resourceId });
  } catch (err) {
    console.error("Erreur création notification:", err.message);
  }
}

// Vérifier si l'utilisateur est participant de la commande (client ou prestataire)
// Retourne { isClient, isPrestataire, prestataireUserId, clientUserId }
async function checkCommandeAccess(commande, userId) {
  const isClient = String(commande.userId) === String(userId);

  let isPrestataire = false;
  let prestataireUserId = null;

  if (commande.prestataireId) {
    // commande.prestataireId est l'ID de la fiche Prestataire
    // Il faut récupérer le userId associé
    const prestataire = await Prestataire.findById(commande.prestataireId);
    if (prestataire && prestataire.userId) {
      prestataireUserId = prestataire.userId;
      isPrestataire = String(prestataire.userId) === String(userId);
    }
  }

  return {
    isClient,
    isPrestataire,
    prestataireUserId,
    clientUserId: commande.userId
  };
}

// Envoyer un message (les deux parties peuvent envoyer)
router.post("/", auth, async (req, res) => {
  try {
    const { commandeId, content } = req.body;

    if (!commandeId || !content) {
      return res.status(400).json({ message: "commandeId et content sont requis" });
    }

    if (content.trim().length === 0) {
      return res.status(400).json({ message: "Le message ne peut pas être vide" });
    }

    const commande = await Commande.findById(commandeId);
    if (!commande) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    const access = await checkCommandeAccess(commande, req.user.id);

    if (!access.isClient && !access.isPrestataire) {
      return res.status(403).json({ message: "Vous ne pouvez pas envoyer de message pour cette commande" });
    }

    // Déterminer le destinataire (User ID, pas Prestataire ID)
    let receiverId = null;
    if (access.isClient) {
      receiverId = access.prestataireUserId;
      if (!receiverId) {
        return res.status(400).json({ message: "Aucun prestataire n'est assigné à cette commande" });
      }
    } else {
      receiverId = access.clientUserId;
    }

    const message = await Message.create({
      commandeId: commande._id,
      senderId: req.user.id,
      receiverId: receiverId,
      content: content.trim()
    });

    // Notifier le destinataire
    await createNotification(
      receiverId,
      "nouveau_message",
      "Nouveau message",
      `Vous avez reçu un nouveau message concernant votre commande.`,
      "message",
      message._id
    );

    // Retourner le message avec le sender populé
    const populatedMessage = await Message.findById(message._id)
      .populate("senderId", "firstName lastName email role")
      .populate("receiverId", "firstName lastName email role");

    res.status(201).json(populatedMessage);
  } catch (err) {
    console.error("Erreur envoi message:", err);
    res.status(500).json({ message: "Erreur lors de l'envoi du message: " + err.message });
  }
});

// Récupérer tous les messages d'une commande
router.get("/commande/:commandeId", auth, async (req, res) => {
  try {
    const commande = await Commande.findById(req.params.commandeId);
    if (!commande) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    const access = await checkCommandeAccess(commande, req.user.id);
    const isAdmin = req.user.role === "admin" || req.user.role === "super_admin";

    if (!access.isClient && !access.isPrestataire && !isAdmin) {
      return res.status(403).json({ message: "Accès interdit" });
    }

    const messages = await Message.find({
      commandeId: commande._id
    })
      .sort({ createdAt: 1 })
      .populate("senderId", "firstName lastName email role");

    res.json(messages);
  } catch (err) {
    console.error("Erreur récupération messages:", err);
    res.status(500).json({ message: "Erreur lors de la récupération des messages" });
  }
});

// Marquer les messages comme lus
router.put("/commande/:commandeId/read", auth, async (req, res) => {
  try {
    const commande = await Commande.findById(req.params.commandeId);
    if (!commande) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    const access = await checkCommandeAccess(commande, req.user.id);

    if (!access.isClient && !access.isPrestataire) {
      return res.status(403).json({ message: "Accès interdit" });
    }

    await Message.updateMany(
      {
        commandeId: commande._id,
        receiverId: req.user.id,
        isRead: false
      },
      { isRead: true }
    );

    res.json({ message: "Messages marqués comme lus" });
  } catch (err) {
    console.error("Erreur marquage lecture:", err);
    res.status(500).json({ message: "Erreur lors du marquage" });
  }
});

// Récupérer la liste des conversations (commandes avec messages)
router.get("/conversations", auth, async (req, res) => {
  try {
    // Récupérer les messages où l'utilisateur est impliqué
    const messages = await Message.find({
      $or: [
        { senderId: req.user.id },
        { receiverId: req.user.id }
      ]
    })
      .sort({ createdAt: -1 })
      .populate("commandeId")
      .populate("senderId", "firstName lastName email role")
      .populate("receiverId", "firstName lastName email role");

    // Regrouper par commande et récupérer le dernier message
    const conversationMap = new Map();

    for (const msg of messages) {
      if (!msg.commandeId) continue;
      const cmdId = String(msg.commandeId._id);
      if (!conversationMap.has(cmdId)) {
        // Récupérer les infos complètes de la commande avec participants
        const fullCommande = await Commande.findById(msg.commandeId._id);
        if (!fullCommande) continue;

        const access = await checkCommandeAccess(fullCommande, req.user.id);

        // Déterminer l'autre participant
        let otherParticipant = null;

        if (access.isClient) {
          // L'utilisateur est le client → l'autre est le prestataire (son User)
          if (access.prestataireUserId) {
            otherParticipant = await require("../models/User").findById(access.prestataireUserId)
              .select("firstName lastName email role");
          }
        } else if (access.isPrestataire) {
          // L'utilisateur est le prestataire → l'autre est le client
          otherParticipant = await require("../models/User").findById(access.clientUserId)
            .select("firstName lastName email role");
        }

        // Compter les messages non lus
        const unreadCount = await Message.countDocuments({
          commandeId: msg.commandeId._id,
          receiverId: req.user.id,
          isRead: false
        });

        // Repopulate la commande avec les références
        const commandePopulated = await Commande.findById(msg.commandeId._id)
          .populate("userId", "firstName lastName email")
          .populate({
            path: "prestataireId",
            select: "name userId"
          })
          .populate("prestationId", "title");

        conversationMap.set(cmdId, {
          commandeId: msg.commandeId._id,
          lastMessage: msg,
          otherParticipant,
          unreadCount,
          commande: commandePopulated
        });
      }
    }

    const conversations = Array.from(conversationMap.values()).sort((a, b) => {
      return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
    });

    res.json(conversations);
  } catch (err) {
    console.error("Erreur récupération conversations:", err);
    res.status(500).json({ message: "Erreur lors de la récupération des conversations" });
  }
});

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Système de messagerie entre clients et prestataires
 */

/**
 * @swagger
 * /messages:
 *   post:
 *     summary: Envoyer un message
 *     tags: [Messages]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - commandeId
 *               - content
 *             properties:
 *               commandeId:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message envoyé
 *       400:
 *         description: Données invalides
 *       403:
 *         description: Accès interdit
 */

/**
 * @swagger
 * /messages/commande/{commandeId}:
 *   get:
 *     summary: Récupérer les messages d'une commande
 *     tags: [Messages]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: commandeId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste des messages
 *       403:
 *         description: Accès interdit
 */

/**
 * @swagger
 * /messages/commande/{commandeId}/read:
 *   put:
 *     summary: Marquer les messages d'une commande comme lus
 *     tags: [Messages]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: commandeId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Messages marqués comme lus
 */

/**
 * @swagger
 * /messages/conversations:
 *   get:
 *     summary: Récupérer la liste des conversations
 *     tags: [Messages]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des conversations avec le dernier message
 */

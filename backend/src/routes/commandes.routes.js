const router = require("express").Router();
const Commande = require("../models/Commande");
const Prestation = require("../models/Prestation");
const Prestataire = require("../models/Prestataire");
const User = require("../models/User");
const Notification = require("../models/Notification");
const auth = require("../middlewares/auth.middleware");
const stripeService = require("../services/stripe.service");
const {
  applyVipReduction,
  canUseFreebie,
  consumeFreebie
} = require("../utils/vip");

// Créer une notification pour un utilisateur
async function createNotification(userId, type, titre, message, resourceType, resourceId) {
  await Notification.create({ userId, type, titre, message, resourceType, resourceId });
}

// Récupérer l'ID de la fiche Prestataire à partir de l'ID User
async function getPrestataireIdFromUser(userId) {
  const prestataire = await Prestataire.findOne({ userId });
  return prestataire ? prestataire._id : null;
}

// Créer une commande
router.post("/", auth, async (req, res) => {
  const prestation = await Prestation.findById(req.body.prestationId);
  if (!prestation) return res.status(404).json({ message: "Prestation introuvable" });

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

  // Logique VIP : prestation offerte ?
  const isFreebie = canUseFreebie(user, prestation);
  let finalPriceHT = prestation.priceHT;
  let finalPriceTTC = prestation.priceTTC;
  let vipFreebieApplied = false;

  if (isFreebie) {
    finalPriceHT = 0;
    finalPriceTTC = 0;
    vipFreebieApplied = true;
    consumeFreebie(user);
    user.markModified("vipSubscription");
    await user.save();
  } else {
    // Réduction VIP classique (-5%)
    const reduction = applyVipReduction(user, prestation.priceTTC);
    finalPriceTTC = reduction.finalPrice;
    finalPriceHT = Math.round(prestation.priceHT * (1 - reduction.reduction / 100) * 100) / 100;
  }

  const commande = await Commande.create({
    userId: req.user.id,
    prestationId: prestation._id,
    montantHT: finalPriceHT,
    montantTTC: finalPriceTTC,
    commissionPJ: prestation.commissionPJ,
    vipFreebieApplied
  });

  res.json(commande);
});

// Voir mes commandes (voyageur)
router.get("/me", auth, async (req, res) => {
  const commandes = await Commande.find({ userId: req.user.id });
  res.json(commandes);
});

/**
 * @swagger
 * /commandes/prestataire:
 *   get:
 *     summary: Voir les commandes assignées au prestataire
 *     tags: [Commandes]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des commandes assignées au prestataire
 *       403:
 *         description: Accès interdit (non prestataire)
 */
router.get("/prestataire", auth, async (req, res) => {
  if (req.user.role !== "prestataire")
    return res.status(403).json({ message: "Accès interdit" });

  const prestataireId = await getPrestataireIdFromUser(req.user.id);

  if (!prestataireId)
    return res.status(404).json({ message: "Fiche prestataire introuvable" });

  const commandes = await Commande.find({ prestataireId }).populate("userId prestationId");
  res.json(commandes);
});

// ADMIN — voir toutes les commandes
router.get("/", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Accès interdit" });

  const commandes = await Commande.find().populate("userId prestationId prestataireId");
  res.json(commandes);
});

// GET /:id — détail d'une commande (accessible par participant ou admin)
router.get("/:id", auth, async (req, res) => {
  const commande = await Commande.findById(req.params.id)
    .populate("userId", "firstName lastName email")
    .populate("prestationId", "title")
    .populate("prestataireId", "name userId");

  if (!commande) return res.status(404).json({ message: "Commande introuvable" });

  // Vérifier que l'utilisateur est participant ou admin
  const clientId = String(commande.userId._id || commande.userId);
  const isClient = clientId === String(req.user.id);
  const prestataireUserId = commande.prestataireId?.userId;
  const isPrestataire = prestataireUserId && String(prestataireUserId) === String(req.user.id);
  const isAdmin = req.user.role === "admin" || req.user.role === "super_admin";

  if (!isClient && !isPrestataire && !isAdmin) {
    return res.status(403).json({ message: "Accès interdit" });
  }

  res.json(commande);
});

// Paiement Stripe
router.post("/pay/:id", auth, async (req, res) => {
  const commande = await Commande.findById(req.params.id);

  if (!commande) return res.status(404).json({ message: "Commande introuvable" });
  if (commande.status !== "confirmee")
    return res.status(400).json({ message: "La commande doit être confirmée avant paiement" });

  try {
    const paymentIntent = await stripeService.createPaymentIntent(commande.montantTTC, {
      metadata: { commandeId: commande._id.toString() }
    });
    commande.stripePaymentId = paymentIntent.id;
    commande.paymentStatus = "pending";
    await commande.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur Stripe: " + err.message });
  }
});


// ADMIN — confirmer une commande
router.put("/:id/confirm", auth, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Accès interdit" });

  const commande = await Commande.findById(req.params.id);

  if (!commande) return res.status(404).json({ message: "Commande introuvable" });
  if (commande.status !== "demande")
    return res.status(400).json({ message: "La commande ne peut pas être confirmée" });

  commande.status = "confirmee";
  await commande.save();

  await createNotification(
    commande.userId,
    "commande_confirmee",
    "Commande confirmée",
    "Votre commande a été confirmée par l'administrateur. Vous pouvez maintenant procéder au paiement.",
    "commande",
    commande._id
  );

  res.json({ message: "Commande confirmée", commande });
});


// PRESTATAIRE — démarrer une intervention
router.put("/:id/start", auth, async (req, res) => {
  if (req.user.role !== "prestataire")
    return res.status(403).json({ message: "Accès interdit" });

  const commande = await Commande.findById(req.params.id);

  if (!commande) return res.status(404).json({ message: "Commande introuvable" });
  if (commande.status !== "confirmee" && commande.status !== "payee")
    return res.status(400).json({ message: "La commande ne peut pas être démarrée" });

  // Vérifier que le paiement a été reçu
  if (commande.paymentStatus !== "paid") {
    return res.status(400).json({ message: "Impossible de démarrer : la commande n'est pas payée. Le client doit d'abord effectuer le paiement." });
  }

  commande.status = "en_cours";
  await commande.save();

  await createNotification(
    commande.userId,
    "commande_demarree",
    "Intervention démarrée",
    "Le prestataire a démarré l'intervention.",
    "commande",
    commande._id
  );

  res.json({ message: "Intervention démarrée", commande });
});


// PRESTATAIRE — terminer une intervention
router.put("/:id/finish", auth, async (req, res) => {
  if (req.user.role !== "prestataire")
    return res.status(403).json({ message: "Accès interdit" });

  const commande = await Commande.findById(req.params.id);

  if (!commande) return res.status(404).json({ message: "Commande introuvable" });
  if (commande.status !== "en_cours")
    return res.status(400).json({ message: "La commande ne peut pas être terminée" });

  // Vérifier que le paiement a été reçu
  if (commande.paymentStatus !== "paid") {
    return res.status(400).json({ message: "Impossible de terminer : la commande n'est pas payée. Le client doit d'abord effectuer le paiement." });
  }

  commande.status = "terminee";
  await commande.save();

  await createNotification(
    commande.userId,
    "commande_terminee",
    "Intervention terminée",
    "Votre intervention est terminée. N'oubliez pas d'évaluer le prestataire !",
    "commande",
    commande._id
  );

  res.json({ message: "Intervention terminée", commande });
});


// VOYAGEUR — annuler une commande
router.put("/:id/cancel", auth, async (req, res) => {
  if (req.user.role !== "voyageur")
    return res.status(403).json({ message: "Accès interdit" });

  const commande = await Commande.findById(req.params.id);

  if (!commande) return res.status(404).json({ message: "Commande introuvable" });
  if (["en_cours", "terminee"].includes(commande.status))
    return res.status(400).json({ message: "Impossible d'annuler cette commande" });

  commande.status = "annulee";
  await commande.save();

  await createNotification(
    commande.userId,
    "commande_annulee",
    "Commande annulée",
    "Votre commande a été annulée.",
    "commande",
    commande._id
  );

  res.json({ message: "Commande annulée", commande });
});

// Confirmer le paiement depuis le frontend (en complément du webhook Stripe)
router.post("/:id/confirm-payment", auth, async (req, res) => {
  const commande = await Commande.findById(req.params.id);
  if (!commande) return res.status(404).json({ message: "Commande introuvable" });
  if (String(commande.userId) !== String(req.user.id))
    return res.status(403).json({ message: "Accès interdit" });

  // Mettre à jour le statut (le webhook fera de même)
  commande.paymentStatus = "paid";
  commande.status = "payee";
  await commande.save();

  await createNotification(
    commande.userId,
    "paiement_recu",
    "Paiement reçu",
    "Votre paiement a été confirmé. Votre prestataire va bientôt être assigné.",
    "commande",
    commande._id
  );

  res.json({ message: "Paiement confirmé", commande });
});


// ADMIN — assigner automatiquement un prestataire
router.put("/:id/assign", auth, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Accès interdit" });

  const commande = await Commande.findById(req.params.id).populate("prestationId");

  if (!commande)
    return res.status(404).json({ message: "Commande introuvable" });

  // Trouver les prestataires compatibles
  const prestataires = await Prestataire.find({
    validated: true,
    services: commande.prestationId._id
  });

  if (prestataires.length === 0)
    return res.status(400).json({ message: "Aucun prestataire disponible pour cette prestation" });

  // Sélection simple : premier prestataire disponible
  const prestataireChoisi = prestataires[0];

  commande.prestataireId = prestataireChoisi._id;
  await commande.save();

  // Notifier le voyageur
  await createNotification(
    commande.userId,
    "commande_assignee",
    "Prestataire assigné",
    `Un prestataire a été assigné à votre commande.`,
    "commande",
    commande._id
  );

  res.json({
    message: "Prestataire assigné automatiquement",
    commande
  });
});


// VOYAGEUR — évaluer une prestation terminée
router.put("/:id/evaluate", auth, async (req, res) => {
  if (req.user.role !== "voyageur")
    return res.status(403).json({ message: "Accès interdit" });

  const { note, commentaire } = req.body;

  if (!note || note < 1 || note > 5)
    return res.status(400).json({ message: "La note doit être entre 1 et 5" });

  const commande = await Commande.findById(req.params.id).populate("prestataireId");

  if (!commande)
    return res.status(404).json({ message: "Commande introuvable" });

  if (String(commande.userId) !== String(req.user.id))
    return res.status(403).json({ message: "Accès interdit" });

  if (commande.status !== "terminee")
    return res.status(400).json({ message: "La commande doit être terminée pour être évaluée" });

  if (commande.evaluation && commande.evaluation.note)
    return res.status(400).json({ message: "Cette commande a déjà été évaluée" });

  // Enregistrer l'évaluation
  commande.evaluation = {
    note: parseInt(note),
    commentaire: commentaire || "",
    date: new Date()
  };
  await commande.save();

  // Recalculer la note moyenne du prestataire
  if (commande.prestataireId) {
    const commandesDuPrestataire = await Commande.find({
      prestataireId: commande.prestataireId._id,
      status: "terminee"
    });

    const notes = commandesDuPrestataire
      .filter(c => c.evaluation && c.evaluation.note)
      .map(c => c.evaluation.note);

    if (notes.length > 0) {
      const moyenne = notes.reduce((a, b) => a + b, 0) / notes.length;
      await Prestataire.findByIdAndUpdate(commande.prestataireId._id, {
        noteMoyenne: Math.round(moyenne * 10) / 10
      });
    }
  }

  res.json({ message: "Évaluation enregistrée", commande });
});


module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Commandes
 *   description: Gestion des commandes et réservations
 */

/**
 * @swagger
 * /commandes:
 *   post:
 *     summary: Créer une commande
 *     tags: [Commandes]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prestationId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Commande créée
 */

/**
 * @swagger
 * /commandes/me:
 *   get:
 *     summary: Voir mes commandes
 *     tags: [Commandes]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des commandes de l'utilisateur
 */

/**
 * @swagger
 * /commandes:
 *   get:
 *     summary: Liste des commandes (admin)
 *     tags: [Commandes]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des commandes
 */

/**
 * @swagger
 * /commandes/pay/{id}:
 *   post:
 *     summary: Créer un paiement Stripe pour une commande
 *     tags: [Commandes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la commande à payer
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Client secret Stripe retourné
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clientSecret:
 *                   type: string
 *                   description: Clé secrète Stripe pour finaliser le paiement
 *       400:
 *         description: La commande doit être confirmée avant paiement
 *       401:
 *         description: Token invalide ou manquant
 *       404:
 *         description: Commande introuvable
 */


/**
 * @swagger
 * /commandes/{id}/confirm:
 *   put:
 *     summary: Confirmer une commande (admin)
 *     tags: [Commandes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID de la commande
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Commande confirmée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: La commande ne peut pas être confirmée
 *       403:
 *         description: Accès interdit (non admin)
 *       404:
 *         description: Commande introuvable
 */

/**
 * @swagger
 * /commandes/{id}/start:
 *   put:
 *     summary: Démarrer une intervention (prestataire)
 *     tags: [Commandes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID de la commande
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Intervention démarrée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: La commande ne peut pas être démarrée
 *       403:
 *         description: Accès interdit (non prestataire)
 *       404:
 *         description: Commande introuvable
 */

/**
 * @swagger
 * /commandes/{id}/finish:
 *   put:
 *     summary: Terminer une intervention (prestataire)
 *     tags: [Commandes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID de la commande
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Intervention terminée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: La commande ne peut pas être terminée
 *       403:
 *         description: Accès interdit (non prestataire)
 *       404:
 *         description: Commande introuvable
 */

/**
 * @swagger
 * /commandes/{id}/cancel:
 *   put:
 *     summary: Annuler une commande (voyageur)
 *     tags: [Commandes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID de la commande
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Commande annulée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Impossible d'annuler cette commande
 *       403:
 *         description: Accès interdit (non voyageur)
 *       404:
 *         description: Commande introuvable
 */

/**
 * @swagger
 * /commandes/{id}/assign:
 *   put:
 *     summary: Assigner automatiquement un prestataire à une commande (admin)
 *     tags: [Commandes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la commande
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Prestataire assigné automatiquement
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 commande:
 *                   $ref: '#/components/schemas/Commande'
 *       400:
 *         description: Aucun prestataire disponible
 *       403:
 *         description: Accès interdit (non admin)
 *       404:
 *         description: Commande introuvable
 */

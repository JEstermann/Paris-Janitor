const router = require("express").Router();
const Commande = require("../models/Commande");
const Prestation = require("../models/Prestation");
const auth = require("../middlewares/auth.middleware");

// Créer une commande
router.post("/", auth, async (req, res) => {
  const prestation = await Prestation.findById(req.body.prestationId);

  const commande = await Commande.create({
    userId: req.user.id,
    prestationId: prestation._id,
    montantHT: prestation.priceHT,
    montantTTC: prestation.priceTTC,
    commissionPJ: prestation.commissionPJ
  });

  res.json(commande);
});

// Voir mes commandes
router.get("/me", auth, async (req, res) => {
  const commandes = await Commande.find({ userId: req.user.id });
  res.json(commandes);
});

// ADMIN — voir toutes les commandes
router.get("/", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Accès interdit" });

  const commandes = await Commande.find().populate("userId prestationId prestataireId");
  res.json(commandes);
});

const stripeService = require("../services/stripe.service");

// Paiement Stripe
router.post("/pay/:id", auth, async (req, res) => {
  const commande = await Commande.findById(req.params.id);

  const paymentIntent = await stripeService.createPaymentIntent(commande.montantTTC);

  commande.stripePaymentId = paymentIntent.id;
  await commande.save();

  res.json({ clientSecret: paymentIntent.client_secret });
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

  res.json({ message: "Commande confirmée", commande });
});


// PRESTATAIRE — démarrer une intervention
router.put("/:id/start", auth, async (req, res) => {
  if (req.user.role !== "prestataire")
    return res.status(403).json({ message: "Accès interdit" });

  const commande = await Commande.findById(req.params.id);

  if (!commande) return res.status(404).json({ message: "Commande introuvable" });
  if (commande.status !== "confirmee")
    return res.status(400).json({ message: "La commande ne peut pas être démarrée" });

  commande.status = "en_cours";
  await commande.save();

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

  commande.status = "terminee";
  await commande.save();

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

  res.json({ message: "Commande annulée", commande });
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
 *     summary: Paiement Stripe pour une commande
 *     tags: [Commandes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Client secret Stripe retourné
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
 *                 commande:
 *                   $ref: '#/components/schemas/Commande'
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
 *                 commande:
 *                   $ref: '#/components/schemas/Commande'
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
 *                 commande:
 *                   $ref: '#/components/schemas/Commande'
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
 *                 commande:
 *                   $ref: '#/components/schemas/Commande'
 *       400:
 *         description: Impossible d'annuler cette commande
 *       403:
 *         description: Accès interdit (non voyageur)
 *       404:
 *         description: Commande introuvable
 */

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


module.exports = router;
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

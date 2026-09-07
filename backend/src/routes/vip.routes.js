const router = require("express").Router();
const User = require("../models/User");
const auth = require("../middlewares/auth.middleware");
const stripeService = require("../services/stripe.service");
const {
  VIP_PRICES,
  VIP_DURATION_DAYS,
  VIP_BENEFITS,
  refreshVipCounters,
  getRenewalPrice
} = require("../utils/vip");

// GET /vip/plans — liste publique des plans
router.get("/plans", (req, res) => {
  res.json({
    plans: Object.entries(VIP_BENEFITS).map(([key, b]) => ({
      type: key,
      label: b.label,
      price: VIP_PRICES[key],
      renewalPrice: getRenewalPrice(key),
      reduction: b.reduction,
      freebiesPerYear: b.freebiesPerYear,
      freebiesPerWeek: b.freebiesPerWeek,
      maxFreebiePrice: b.maxFreebiePrice,
      priorityAccess: b.priorityAccess,
      renewalBonus: b.renewalBonus
    }))
  });
});

// GET /vip/me — abonnement actuel du voyageur connecté
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    refreshVipCounters(user);
    await user.save();

    const vip = user.vipSubscription;
    const benefits = VIP_BENEFITS[vip.type] || VIP_BENEFITS.free;

    res.json({
      subscription: vip,
      benefits,
      remainingFreebies: {
        year: Math.max(0, (benefits.freebiesPerYear || 0) - (vip.freebiesUsedThisYear || 0)),
        week: Math.max(0, (benefits.freebiesPerWeek || 0) - (vip.freebiesUsedThisWeek || 0))
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /vip/subscribe — créer un paiement Stripe pour un plan VIP
router.post("/subscribe", auth, async (req, res) => {
  try {
    const { type } = req.body;
    if (!VIP_BENEFITS[type]) {
      return res.status(400).json({ message: "Plan VIP invalide" });
    }
    if (type === "free") {
      return res.status(400).json({ message: "Le plan Free est le plan par défaut, pas besoin de paiement" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    // Si l'utilisateur a déjà un abonnement actif, on calcule le prix de renouvellement
    const isRenewal = user.vipSubscription.active &&
                      user.vipSubscription.type === type &&
                      user.vipSubscription.endDate &&
                      new Date(user.vipSubscription.endDate) > new Date();

    const price = isRenewal ? getRenewalPrice(type) : VIP_PRICES[type];

    // Stripe payment intent
    const paymentIntent = await stripeService.createPaymentIntent(price, {
      metadata: {
        type: "vip_subscription",
        userId: user._id.toString(),
        plan: type,
        renewal: isRenewal ? "1" : "0"
      }
    });

    // On stocke l'id pour pouvoir confirmer ensuite
    user.markModified("vipSubscription");
    await user.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: price,
      isRenewal,
      plan: type
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /vip/confirm — confirmer l'activation après paiement
router.post("/confirm", auth, async (req, res) => {
  try {
    const { plan, paymentIntentId } = req.body;
    if (!VIP_BENEFITS[plan] || plan === "free") {
      return res.status(400).json({ message: "Plan invalide" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    const now = new Date();
    const endDate = new Date(now.getTime() + VIP_DURATION_DAYS * 24 * 60 * 60 * 1000);

    user.vipSubscription.type = plan;
    user.vipSubscription.active = true;
    user.vipSubscription.startDate = now;
    user.vipSubscription.endDate = endDate;
    user.vipSubscription.freebiesUsedThisYear = 0;
    user.vipSubscription.freebiesUsedThisWeek = 0;
    user.vipSubscription.yearStartDate = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    user.vipSubscription.weekStartDate = (() => {
      const d = new Date(now);
      const day = d.getUTCDay();
      const diff = day === 0 ? 6 : day - 1;
      d.setUTCDate(d.getUTCDate() - diff);
      d.setUTCHours(0, 0, 0, 0);
      return d;
    })();
    user.markModified("vipSubscription");
    await user.save();

    res.json({
      message: "Abonnement VIP activé",
      subscription: user.vipSubscription,
      benefits: VIP_BENEFITS[plan]
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /vip/cancel — résilier l'abonnement (passe en free à la fin de la période)
router.post("/cancel", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    if (!user.vipSubscription.active) {
      return res.status(400).json({ message: "Aucun abonnement actif" });
    }

    user.vipSubscription.active = false;
    user.vipSubscription.type = "free";
    user.markModified("vipSubscription");
    await user.save();

    res.json({ message: "Abonnement résilié", subscription: user.vipSubscription });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * tags:
 *   name: VIP
 *   description: Gestion des abonnements VIP voyageurs
 */

/**
 * @swagger
 * /vip/plans:
 *   get:
 *     summary: Liste des plans VIP disponibles
 *     tags: [VIP]
 *     responses:
 *       200:
 *         description: Liste des plans
 */

/**
 * @swagger
 * /vip/me:
 *   get:
 *     summary: Mon abonnement VIP
 *     tags: [VIP]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Abonnement actuel
 */

/**
 * @swagger
 * /vip/subscribe:
 *   post:
 *     summary: Souscrire à un plan VIP
 *     tags: [VIP]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [bag_packer, explorator]
 *     responses:
 *       200:
 *         description: PaymentIntent Stripe retourné
 */

/**
 * @swagger
 * /vip/confirm:
 *   post:
 *     summary: Confirmer l'activation après paiement Stripe
 *     tags: [VIP]
 *     security:
 *       - BearerAuth: []
 */

/**
 * @swagger
 * /vip/cancel:
 *   post:
 *     summary: Résilier l'abonnement VIP
 *     tags: [VIP]
 *     security:
 *       - BearerAuth: []
 */

module.exports = router;
const router = require("express").Router();
const Commande = require("../models/Commande");
const User = require("../models/User");
const Facture = require("../models/Facture");
const generateFacturePDF = require("../utils/generateFacturePDF");
const uploadToMinio = require("../utils/uploadToMinio");
const express = require("express");
const { VIP_DURATION_DAYS, VIP_BENEFITS } = require("../utils/vip");

// Initialiser Stripe seulement si la clé est valide (commence par sk_)
let stripe = null;
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (stripeKey && (stripeKey.startsWith("sk_test_") || stripeKey.startsWith("sk_live_"))) {
  stripe = require("stripe")(stripeKey);
}

router.post("/", async (req, res) => {
  // Si Stripe n'est pas configuré, retourner OK (mode dev)
  if (!stripe) {
    console.warn("Stripe non configuré - webhook ignoré");
    return res.json({ received: true, warning: "Stripe non configuré" });
  }

  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;
    const metadata = intent.metadata || {};

    // Cas 1 : paiement d'un abonnement VIP
    if (metadata.type === "vip_subscription") {
      const userId = metadata.userId;
      const plan = metadata.plan;

      if (userId && VIP_BENEFITS[plan] && plan !== "free") {
        const user = await User.findById(userId);
        if (user) {
          const now = new Date();
          const endDate = new Date(now.getTime() + VIP_DURATION_DAYS * 24 * 60 * 60 * 1000);
          const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
          const day = now.getUTCDay();
          const diff = day === 0 ? 6 : day - 1;
          const weekStart = new Date(now);
          weekStart.setUTCDate(weekStart.getUTCDate() - diff);
          weekStart.setUTCHours(0, 0, 0, 0);

          user.vipSubscription.type = plan;
          user.vipSubscription.active = true;
          user.vipSubscription.startDate = now;
          user.vipSubscription.endDate = endDate;
          user.vipSubscription.freebiesUsedThisYear = 0;
          user.vipSubscription.freebiesUsedThisWeek = 0;
          user.vipSubscription.yearStartDate = yearStart;
          user.vipSubscription.weekStartDate = weekStart;
          user.markModified("vipSubscription");
          await user.save();
        }
      }
      return res.json({ received: true, type: "vip" });
    }

    // Cas 2 : paiement d'une commande classique
    const commandeId = metadata.commandeId;
    if (!commandeId) {
      return res.status(400).json({ message: "commandeId manquant dans metadata" });
    }

    const commande = await Commande.findById(commandeId);
    if (!commande) return res.status(404).json({ message: "Commande introuvable" });

    // Vérifier si une facture existe déjà pour cette commande
    let facture = await Facture.findOne({ commandeId: commande._id });
    if (!facture) {
      // Génération facture PDF
      try {
        const pdfBuffer = await generateFacturePDF(commande);
        const fileName = `facture-${commande._id}.pdf`;
        await uploadToMinio(pdfBuffer, fileName);

        // Créer le document Facture en BDD
        facture = await Facture.create({
          commandeId: commande._id,
          destinataireId: commande.userId,
          montantHT: commande.montantHT,
          montantTTC: commande.montantTTC,
          TVA: commande.montantTTC - commande.montantHT,
          commissionPJ: commande.commissionPJ,
          pdfPath: fileName,
          statutPaiement: "paid"
        });

        // Lier la facture à la commande
        commande.factureId = facture._id;
      } catch (err) {
        console.error("Erreur génération/upload facture:", err.message);
      }
    }

    // Mise à jour statut
    commande.status = "payee";
    commande.paymentStatus = "paid";
    await commande.save();
  }

  res.json({ received: true });
});

module.exports = router;

/**
 * @swagger
 * /stripe/webhook:
 *   post:
 *     summary: Webhook Stripe (confirmation du paiement)
 *     tags: [Stripe]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Payload envoyé par Stripe
 *     responses:
 *       200:
 *         description: Webhook reçu et traité
 *       400:
 *         description: Signature Stripe invalide
 */

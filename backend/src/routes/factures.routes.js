const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const minioClient = require("../config/minio");
const Commande = require("../models/Commande");
const Facture = require("../models/Facture");
const generateFacturePDF = require("../utils/generateFacturePDF");
const uploadToMinio = require("../utils/uploadToMinio");

/**
 * GET /factures/commande/:commandeId
 * Génère et récupère la facture PDF d'une commande
 */
router.get("/commande/:commandeId", auth, async (req, res) => {
  try {
    const commande = await Commande.findById(req.params.commandeId);
    if (!commande) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    // Vérifier que la commande est payée
    if (commande.paymentStatus !== "paid") {
      return res.status(400).json({ message: "La commande n'a pas été payée" });
    }

    // Vérifier l'accès (le client ou un admin)
    if (String(commande.userId) !== String(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Accès interdit" });
    }

    const fileName = `facture-${commande._id}.pdf`;

    try {
      // Essayer de récupérer depuis MinIO
      const fileStream = await minioClient.getObject(process.env.MINIO_BUCKET, fileName);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
      fileStream.pipe(res);
    } catch (err) {
      // Si le fichier n'existe pas, le générer à la volée
      const pdfBuffer = await generateFacturePDF(commande);
      await uploadToMinio(pdfBuffer, fileName);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
      res.send(pdfBuffer);
    }
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération de la facture", error: err.message });
  }
});

/**
 * GET /factures/me
 * Liste des factures de l'utilisateur connecté (voyageur)
 */
router.get("/me", auth, async (req, res) => {
  try {
    const factures = await Facture.find({ destinataireId: req.user.id })
      .populate({
        path: "commandeId",
        populate: { path: "prestationId", select: "title category" }
      })
      .sort({ dateEmission: -1 });
    res.json(factures);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération des factures", error: err.message });
  }
});

/**
 * GET /factures
 * Liste des factures (admin)
 */
router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Accès interdit" });
    }
    const factures = await Facture.find().populate("commandeId destinataireId");
    res.json(factures);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération des factures", error: err.message });
  }
});

/**
 * GET /factures/:id
 * Détails d'une facture par ID
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const facture = await Facture.findById(req.params.id).populate("commandeId destinataireId");
    if (!facture) {
      return res.status(404).json({ message: "Facture introuvable" });
    }

    // Vérifier l'accès
    if (facture.destinataireId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Accès interdit" });
    }

    res.json(facture);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération de la facture", error: err.message });
  }
});

/**
 * POST /factures/commande/:commandeId
 * Génère manuellement une facture pour une commande
 */
router.post("/commande/:commandeId", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Accès interdit" });
    }

    const commande = await Commande.findById(req.params.commandeId);
    if (!commande) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    // Vérifier si une facture existe déjà
    const existingFacture = await Facture.findOne({ commandeId: commande._id });
    if (existingFacture) {
      return res.status(400).json({ message: "Une facture existe déjà pour cette commande" });
    }

    // Générer le PDF
    const pdfBuffer = await generateFacturePDF(commande);
    const fileName = `facture-${commande._id}.pdf`;
    await uploadToMinio(pdfBuffer, fileName);

    // Créer l'entrée facture en BDD
    const facture = await Facture.create({
      commandeId: commande._id,
      destinataireId: commande.userId,
      montantHT: commande.montantHT,
      montantTTC: commande.montantTTC,
      commissionPJ: commande.commissionPJ,
      TVA: commande.montantTTC - commande.montantHT,
      pdfPath: fileName,
      statutPaiement: commande.paymentStatus === "paid" ? "paid" : "pending"
    });

    // Mettre à jour la commande
    commande.factureId = facture._id;
    await commande.save();

    res.status(201).json(facture);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la création de la facture", error: err.message });
  }
});

/**
 * @swagger
 * /factures:
 *   get:
 *     summary: Liste toutes les factures (admin)
 *     tags: [Factures]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des factures
 *       403:
 *         description: Accès interdit (non admin)
 */

module.exports = router;

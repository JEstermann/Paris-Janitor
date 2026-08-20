const router = require("express").Router();
const Prestataire = require("../models/Prestataire");
const auth = require("../middlewares/auth.middleware");

// ADMIN — valider un prestataire
router.put("/validate/:id", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Accès interdit" });

  const prestataire = await Prestataire.findByIdAndUpdate(
    req.params.id,
    { validated: true },
    { new: true }
  );

  res.json(prestataire);
});

// ADMIN — liste prestataires
router.get("/", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Accès interdit" });

  const prestataires = await Prestataire.find();
  res.json(prestataires);
});

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Prestataires
 *   description: Gestion des prestataires
 */

/**
 * @swagger
 * /prestataires:
 *   get:
 *     summary: Liste des prestataires (admin)
 *     tags: [Prestataires]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des prestataires
 */

/**
 * @swagger
 * /prestataires/validate/{id}:
 *   put:
 *     summary: Valider un prestataire (admin)
 *     tags: [Prestataires]
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
 *         description: Prestataire validé
 */

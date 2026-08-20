const router = require("express").Router();
const Prestation = require("../models/Prestation");
const auth = require("../middlewares/auth.middleware");

// GET toutes les prestations
router.get("/", async (req, res) => {
  const prestations = await Prestation.find();
  res.json(prestations);
});

// GET une prestation
router.get("/:id", async (req, res) => {
  const prestation = await Prestation.findById(req.params.id);
  res.json(prestation);
});

// ADMIN — créer une prestation
router.post("/", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Accès interdit" });

  const prestation = await Prestation.create(req.body);
  res.json(prestation);
});

// ADMIN — modifier une prestation
router.put("/:id", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Accès interdit" });

  const prestation = await Prestation.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(prestation);
});

// ADMIN — supprimer une prestation
router.delete("/:id", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Accès interdit" });

  await Prestation.findByIdAndDelete(req.params.id);
  res.json({ message: "Prestation supprimée" });
});

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Prestations
 *   description: Catalogue des prestations
 */

/**
 * @swagger
 * /prestations:
 *   get:
 *     summary: Liste des prestations
 *     tags: [Prestations]
 *     responses:
 *       200:
 *         description: Liste des prestations
 */

/**
 * @swagger
 * /prestations/{id}:
 *   get:
 *     summary: Obtenir une prestation
 *     tags: [Prestations]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Prestation trouvée
 */

/**
 * @swagger
 * /prestations:
 *   post:
 *     summary: Créer une prestation (admin)
 *     tags: [Prestations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Prestation'
 *     responses:
 *       200:
 *         description: Prestation créée
 */

/**
 * @swagger
 * /prestations/{id}:
 *   put:
 *     summary: Modifier une prestation (admin)
 *     tags: [Prestations]
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
 *         description: Prestation modifiée
 */

/**
 * @swagger
 * /prestations/{id}:
 *   delete:
 *     summary: Supprimer une prestation (admin)
 *     tags: [Prestations]
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
 *         description: Prestation supprimée
 */

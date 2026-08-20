const router = require("express").Router();
const Commande = require("../models/Commande");
const User = require("../models/User");
const auth = require("../middlewares/auth.middleware");

// Dashboard admin
router.get("/stats", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Accès interdit" });

  const totalUsers = await User.countDocuments();
  const totalCommandes = await Commande.countDocuments();
  const totalCA = await Commande.aggregate([
    { $group: { _id: null, total: { $sum: "$montantTTC" } } }
  ]);

  res.json({
    totalUsers,
    totalCommandes,
    totalCA: totalCA[0]?.total || 0
  });
});

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Routes administrateur
 */

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Statistiques globales
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques renvoyées
 */

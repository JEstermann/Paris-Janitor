const router = require("express").Router();
const bcrypt = require("bcryptjs");
const Commande = require("../models/Commande");
const User = require("../models/User");
const auth = require("../middlewares/auth.middleware");
const { validatePassword, getMinLengthForRole } = require("../utils/passwordValidator");

// Middleware local : vérifie que l'appelant est admin
function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Accès interdit" });
  next();
}

// Helper : formate un user pour le front (enlève passwordHash)
function sanitize(user) {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : user;
  delete obj.passwordHash;
  return obj;
}

// Dashboard admin
router.get("/stats", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Accès interdit" });

  const totalUsers = await User.countDocuments();
  const totalCommandes = await Commande.countDocuments();
  const totalCA = await Commande.aggregate([
    { $group: { _id: null, total: { $sum: "$montantTTC" } }
    }
  ]);

  res.json({
    totalUsers,
    totalCommandes,
    totalCA: totalCA[0]?.total || 0
  });
});

// LISTE des utilisateurs (avec filtres optionnels)
router.get("/users", auth, requireAdmin, async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.active !== undefined) filter.active = req.query.active === "true";

  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json(users.map(sanitize));
});

// DÉTAIL d'un utilisateur
router.get("/users/:id", auth, requireAdmin, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });
  res.json(sanitize(user));
});

// MISE À JOUR d'un utilisateur
// Les champs password et role sont bloqués : seuls firstName, lastName, email, phone sont modifiables
router.put("/users/:id", auth, requireAdmin, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

  if (user.isSuperAdmin) {
    return res.status(403).json({ message: "Le super admin ne peut pas être modifié" });
  }

  // Refus explicite de toute tentative de modification du mot de passe ou du rôle
  if (req.body.password !== undefined || req.body.passwordHash !== undefined) {
    return res.status(403).json({ message: "Le mot de passe ne peut pas être modifié par un admin" });
  }
  if (req.body.role !== undefined) {
    return res.status(403).json({ message: "Le rôle ne peut pas être modifié par un admin" });
  }

  const { firstName, lastName, email, phone } = req.body;

  if (email && email !== user.email) {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Cet email est déjà utilisé" });
    user.email = email;
  }
  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;
  if (phone !== undefined) user.phone = phone;

  await user.save();
  res.json(sanitize(user));
});

// CRÉER un utilisateur
// - admin peut créer : voyageur, prestataire
// - super_admin peut aussi créer : admin
router.post("/users", auth, async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "super_admin") {
    return res.status(403).json({ message: "Accès interdit" });
  }

  const { email, password, role, firstName, lastName, phone } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email et mot de passe requis" });
  }

  // Vérifier si l'email existe déjà
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: "Cet email est déjà utilisé" });
  }

  // Déterminer le rôle
  const finalRole = role || "voyageur";

  // Valider le mot de passe
  const minLength = getMinLengthForRole(finalRole);
  const validation = validatePassword(password, {
    minLength,
    email,
    firstName,
    lastName
  });

  if (!validation.valid) {
    return res.status(400).json({ message: validation.errors[0], errors: validation.errors });
  }

  // Si demande de créer un admin, vérifier que le caller est super_admin
  if (role === "admin") {
    const caller = await User.findById(req.user.id);
    if (!caller || !caller.isSuperAdmin) {
      return res.status(403).json({ message: "Seul le super admin peut créer des administrateurs" });
    }
    // Super admin peut créer des admins, on continue
  } else {
    // Les admins normaux ne peuvent créer que voyageur ou prestataire
    if (req.user.role === "admin" && !["voyageur", "prestataire"].includes(finalRole)) {
      return res.status(403).json({ message: "Un admin ne peut créer que des voyageurs ou prestataires" });
    }
  }

  const hash = await bcrypt.hash(password, 10);

  const user = await User.create({
    email,
    passwordHash: hash,
    role: finalRole,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    phone: phone || undefined
  });

  res.status(201).json(sanitize(user));
});

// ACTIVER / DÉSACTIVER un utilisateur
router.patch("/users/:id/toggle-active", auth, requireAdmin, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

  if (user.isSuperAdmin) {
    return res.status(403).json({ message: "Le super admin ne peut pas être désactivé" });
  }

  user.active = !user.active;
  await user.save();
  res.json(sanitize(user));
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

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Liste des utilisateurs (admin)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: role
 *         in: query
 *         schema: { type: string, enum: [voyageur, admin, prestataire] }
 *       - name: active
 *         in: query
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 *   post:
 *     summary: Créer un utilisateur (admin)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [voyageur, prestataire, admin]
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201: { description: Utilisateur créé }
 *       400: { description: Email déjà utilisé ou données invalides }
 *       403: { description: Droits insuffisants }
 *
 * /admin/users/{id}:
 *   get:
 *     summary: Détail d'un utilisateur (admin)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Utilisateur }
 *       404: { description: Introuvable }
 *   put:
 *     summary: Mettre à jour un utilisateur (admin) - sans mot de passe ni rôle
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *     responses:
 *       200: { description: Utilisateur mis à jour }
 *       403: { description: Super admin protégé, mot de passe ou rôle protégé }
 *       404: { description: Introuvable }
 *
 * /admin/users/{id}/toggle-active:
 *   patch:
 *     summary: Activer / désactiver un utilisateur (admin)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Nouveau statut }
 *       403: { description: Super admin protégé }
 *       404: { description: Introuvable }
 */
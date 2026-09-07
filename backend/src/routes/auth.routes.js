const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middlewares/auth.middleware");
const { validatePassword, getMinLengthForRole } = require("../utils/passwordValidator");

// Inscription
router.post("/register", async (req, res) => {
  const { email, password, role, firstName, lastName } = req.body;

  // Vérifier si l'email existe déjà
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "Cet email est déjà utilisé" });
  }

  // Valider le mot de passe
  const minLength = getMinLengthForRole(role);
  const validation = validatePassword(password, {
    minLength,
    email,
    firstName,
    lastName
  });

  if (!validation.valid) {
    return res.status(400).json({ message: validation.errors[0], errors: validation.errors });
  }

  const hash = await bcrypt.hash(password, 10);

  const user = await User.create({
    email,
    passwordHash: hash,
    role,
    firstName: firstName || undefined,
    lastName: lastName || undefined
  });

  res.json(user);
});

// Connexion
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "Email ou mot de passe incorrect" });

  // Vérifier que le compte est actif
  if (!user.active) {
    return res.status(403).json({ message: "Votre compte a été désactivé. Veuillez contacter l'administrateur." });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ message: "Email ou mot de passe incorrect" });

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);

  res.json({ token });
});

// Changer son propre mot de passe
router.post("/change-password", auth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: "Ancien et nouveau mot de passe requis" });
  }

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

  const valid = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!valid) return res.status(401).json({ message: "Ancien mot de passe incorrect" });

  // Valider le nouveau mot de passe
  const minLength = getMinLengthForRole(user.role);
  const validation = validatePassword(newPassword, {
    minLength,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName
  });

  if (!validation.valid) {
    return res.status(400).json({ message: validation.errors[0], errors: validation.errors });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.json({ message: "Mot de passe modifié avec succès" });
});

// GET /auth/me — infos de l'utilisateur connecté
router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("-passwordHash");
  if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });
  res.json(user);
});

// PUT /auth/profile — mettre à jour son propre profil
router.put("/profile", auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

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
  const obj = user.toObject();
  delete obj.passwordHash;
  res.json(obj);
});

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Gestion de l'authentification
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Inscription utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [voyageur, admin]
 *     responses:
 *       200:
 *         description: Utilisateur créé
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token JWT retourné
 */

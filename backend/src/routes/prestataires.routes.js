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

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

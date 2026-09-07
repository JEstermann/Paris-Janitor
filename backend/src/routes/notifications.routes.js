const router = require("express").Router();
const Notification = require("../models/Notification");
const auth = require("../middlewares/auth.middleware");

// GET /notifications — liste des notifications de l'utilisateur
router.get("/", auth, async (req, res) => {
  const notifications = await Notification.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json(notifications);
});

// GET /notifications/unread-count — nombre de notifications non lues
router.get("/unread-count", auth, async (req, res) => {
  const count = await Notification.countDocuments({ userId: req.user.id, read: false });
  res.json({ count });
});

// PATCH /notifications/:id/read — marquer comme lue
router.patch("/:id/read", auth, async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, userId: req.user.id });
  if (!notification) return res.status(404).json({ message: "Notification introuvable" });
  notification.read = true;
  await notification.save();
  res.json(notification);
});

// PATCH /notifications/mark-all-read — tout marquer comme lu
router.patch("/mark-all-read", auth, async (req, res) => {
  await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
  res.json({ message: "Notifications marquées comme lues" });
});

// DELETE /notifications/:id — supprimer une notification
router.delete("/:id", auth, async (req, res) => {
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!notification) return res.status(404).json({ message: "Notification introuvable" });
  res.json({ message: "Notification supprimée" });
});

module.exports = router;
// Charger les polyfills AVANT tout le reste (crypto pour mongodb)
require("./polyfills");
require("./crypto-polyfill");

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// CORS configurable via env variable (séparé par des virgules)
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map(o => o.trim())
  : ["http://localhost:5173", "http://localhost:3000"];

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

app.use(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  require("./routes/stripeWebhook.routes")
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", require("./routes/auth.routes"));
app.use("/prestations", require("./routes/prestations.routes"));
app.use("/commandes", require("./routes/commandes.routes"));
app.use("/prestataires", require("./routes/prestataires.routes"));
app.use("/factures", require("./routes/factures.routes"));
app.use("/admin", require("./routes/admin.routes"));
app.use("/vip", require("./routes/vip.routes"));
app.use("/notifications", require("./routes/notifications.routes"));
app.use("/messages", require("./routes/messages.routes"));

const swaggerDocs = require("./swagger");
swaggerDocs(app);

// Connect to DB only if not in test environment
if (process.env.NODE_ENV !== "test") {
  connectDB();
}

// Only start server if not in test environment
if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, "0.0.0.0", () => console.log(`API lancée sur http://0.0.0.0:${PORT}`));
}

// Health check endpoint (pour Render)
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

module.exports = app;

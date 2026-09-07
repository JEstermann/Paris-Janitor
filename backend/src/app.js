// Charger les polyfills AVANT tout le reste (crypto pour mongodb)
require("./polyfills");
require("./crypto-polyfill");

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();
app.use(cors());

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
  app.listen(PORT, () => console.log(`API lancée sur http://localhost:${PORT}`));
}

module.exports = app;

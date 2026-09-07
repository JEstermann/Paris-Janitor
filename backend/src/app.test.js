// Test-specific app that doesn't load MinIO/Stripe dependent routes
require("dotenv").config({ path: ".env.test" });

const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Only load routes that don't depend on MinIO/Stripe
app.use("/auth", require("./routes/auth.routes"));
app.use("/prestations", require("./routes/prestations.routes"));
app.use("/commandes", require("./routes/commandes.routes"));
app.use("/prestataires", require("./routes/prestataires.routes"));
app.use("/admin", require("./routes/admin.routes"));

// Skip Swagger for tests
// const swaggerDocs = require("./swagger");
// swaggerDocs(app);

module.exports = app;

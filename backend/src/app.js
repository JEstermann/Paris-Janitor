require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.listen(5000, () => console.log("API lancée sur http://localhost:5000"));

app.use("/auth", require("./routes/auth.routes"));
app.use("/prestations", require("./routes/prestations.routes"));
app.use("/commandes", require("./routes/commandes.routes"));
app.use("/prestataires", require("./routes/prestataires.routes"));
app.use("/admin", require("./routes/admin.routes"));


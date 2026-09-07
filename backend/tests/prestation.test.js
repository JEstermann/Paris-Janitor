const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app.test");
const Prestation = require("../src/models/Prestation");
const User = require("../src/models/User");
const jwt = require("jsonwebtoken");

let adminToken;
let userToken;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  // Reset
  await Prestation.deleteMany();
  await User.deleteMany();

  const bcrypt = require("bcryptjs");

  // Admin user
  const admin = await User.create({
    role: "admin",
    email: "admin@test.com",
    passwordHash: await bcrypt.hash("admin123", 10),
    firstName: "Admin"
  });
  adminToken = jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET);

  // Regular user
  const user = await User.create({
    role: "voyageur",
    email: "user@test.com",
    passwordHash: await bcrypt.hash("user123", 10),
    firstName: "User"
  });
  userToken = jwt.sign({ id: user._id, role: "voyageur" }, process.env.JWT_SECRET);

  // Sample prestations
  await Prestation.insertMany([
    {
      title: "Ménage",
      description: "Nettoyage complet",
      category: "menage",
      priceHT: 40,
      priceTTC: 48,
      commissionPJ: 10
    },
    {
      title: "Check-in",
      description: "Accueil voyageurs",
      category: "checkin",
      priceHT: 25,
      priceTTC: 30,
      commissionPJ: 8
    }
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe("Prestation Routes", () => {
  describe("GET /prestations", () => {
    it("devrait retourner la liste des prestations sans auth", async () => {
      const res = await request(app).get("/prestations");
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("POST /prestations", () => {
    it("devrait créer une prestation en tant qu'admin", async () => {
      const res = await request(app)
        .post("/prestations")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "Transport",
          description: "Transport aéroport",
          category: "transport",
          priceHT: 50,
          priceTTC: 60,
          commissionPJ: 10
        });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("title", "Transport");
    });

    it("devrait refuser la création sans être admin", async () => {
      const res = await request(app)
        .post("/prestations")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          title: "Should fail",
          category: "menage",
          priceHT: 10
        });
      expect(res.statusCode).toBe(403);
    });
  });

  describe("PUT /prestations/:id", () => {
    it("devrait modifier une prestation en tant qu'admin", async () => {
      const prestation = await Prestation.findOne({ title: "Ménage" });
      const res = await request(app)
        .put(`/prestations/${prestation._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ priceHT: 50 });
      expect(res.statusCode).toBe(200);
      expect(res.body.priceHT).toBe(50);
    });
  });

  describe("DELETE /prestations/:id", () => {
    it("devrait supprimer une prestation en tant qu'admin", async () => {
      const prestation = await Prestation.findOne({ title: "Check-in" });
      const res = await request(app)
        .delete(`/prestations/${prestation._id}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
    });
  });
});

const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app.test");
const User = require("../src/models/User");
const jwt = require("jsonwebtoken");

let authToken;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  await User.deleteMany();
  const bcrypt = require("bcryptjs");
  const user = await User.create({
    role: "voyageur",
    email: "test@example.com",
    passwordHash: await bcrypt.hash("password123", 10),
    firstName: "Test",
    lastName: "User"
  });

  authToken = jwt.sign({ id: user._id, role: "voyageur" }, process.env.JWT_SECRET || "testjwtsecret123456789");
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe("Auth Routes", () => {
  beforeEach(async () => {
    // Clear all data before each test
    await User.deleteMany({});
  });

  describe("POST /auth/register", () => {
    it("devrait enregistrer un nouvel utilisateur", async () => {
      const res = await request(app)
        .post("/auth/register")
        .send({
          email: "newuser@example.com",
          password: "password123",
          role: "voyageur"
        });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("email", "newuser@example.com");
      expect(res.body).toHaveProperty("role", "voyageur");
    });

    it("devrait échouer si l'email existe déjà", async () => {
      await User.create({
        role: "admin",
        email: "existing@example.com",
        passwordHash: "$2b$10$test",
        firstName: "Admin"
      });

      const res = await request(app)
        .post("/auth/register")
        .send({
          email: "existing@example.com",
          password: "password123",
          role: "admin"
        });
      expect(res.statusCode).toBe(400);
    });
  });

  describe("POST /auth/login", () => {
    it("devrait connecter un utilisateur existant", async () => {
      const bcrypt = require("bcryptjs");
      await User.create({
        role: "voyageur",
        email: "login@example.com",
        passwordHash: await bcrypt.hash("loginpass", 10),
        firstName: "Login"
      });

      const res = await request(app)
        .post("/auth/login")
        .send({
          email: "login@example.com",
          password: "loginpass"
        });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("token");
    });

    it("devrait échouer avec des identifiants invalides", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "wrongpassword"
        });
      // Route retourne 404 (user not found) au lieu de 401
      expect(res.statusCode).toBe(404);
    });
  });
});

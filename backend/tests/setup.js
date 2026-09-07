// Load dotenv for test env first
require("dotenv").config({ path: ".env.test" });

// Mock Stripe module - must be before any imports that use stripe
jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: "pi_test123",
        client_secret: "cs_test123",
        status: "requires_confirmation"
      }),
      confirm: jest.fn().mockResolvedValue({ id: "pi_test123", status: "succeeded" })
    },
    webhooks: {
      constructEvent: jest.fn().mockReturnValue({
        type: "payment_intent.succeeded",
        data: { object: { id: "pi_test123" } }
      })
    }
  }));
});

// Mock MinIO module - must be before any imports that use minio
jest.mock("minio", () => {
  return jest.fn().mockImplementation(() => ({
    putObject: jest.fn().mockResolvedValue(undefined),
    getObject: jest.fn().mockResolvedValue({
      pipe: jest.fn()
    })
  }));
});

// Mock the minio config file that returns the client
jest.mock("../src/config/minio", () => ({
  putObject: jest.fn().mockResolvedValue(undefined),
  getObject: jest.fn().mockResolvedValue({
    pipe: jest.fn()
  })
}));

// Ensure test env vars are set
process.env.NODE_ENV = "test";
process.env.STRIPE_SECRET = "sk_test_test";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
process.env.JWT_SECRET = "testjwtsecret123456789";
process.env.MONGO_URI = "mongodb://127.0.0.1:27017/ParisJanitorTest";
process.env.MINIO_ENDPOINT = "localhost";
process.env.MINIO_PORT = "9000";
process.env.MINIO_ACCESS_KEY = "minioadmin";
process.env.MINIO_SECRET_KEY = "minioadmin";
process.env.MINIO_BUCKET = "paris-janitor-test";

const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Paris Janitor API",
      version: "1.0.0",
      description: "API backend pour Paris Janitor - Gestion des voyageurs, prestataires et prestations"
    },
    servers: [
      { url: "https://paris-janitor-backend.onrender.com", description: "Serveur de développement" }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },
    security: [{ BearerAuth: [] }]
  },
  apis: [
    "./src/routes/*.js",
    "./src/models/*.js"
  ]
};

const swaggerSpec = swaggerJsdoc(options);

function swaggerDocs(app) {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Paris Janitor API Docs"
  }));
  console.log("Swagger disponible sur  https://paris-janitor-backend.onrender.com/docs");
}

module.exports = swaggerDocs;

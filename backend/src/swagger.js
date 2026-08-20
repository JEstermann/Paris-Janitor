const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Paris Janitor API",
      version: "1.0.0",
      description: "Documentation de l'API Paris Janitor"
    },
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
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log("Swagger disponible sur http://localhost:5000/docs");
}

module.exports = swaggerDocs;

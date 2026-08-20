require("dotenv").config();
const mongoose = require("mongoose");

const User = require("./models/User");
const Prestation = require("./models/Prestation");
const Prestataire = require("./models/Prestataire");
const Commande = require("./models/Commande");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connexion MongoDB OK");

  // Nettoyage
  await User.deleteMany();
  await Prestation.deleteMany();
  await Prestataire.deleteMany();
  await Commande.deleteMany();

  console.log("Collections vidées");

  // USERS
  const users = await User.insertMany([
    {
      role: "admin",
      email: "admin@pj.com",
      passwordHash: "$2a$10$123456789012345678901u", // FAUX HASH
      firstName: "Admin",
      lastName: "ParisJanitor"
    },
    {
      role: "voyageur",
      email: "client1@test.com",
      passwordHash: "$2a$10$123456789012345678901u",
      firstName: "Julien",
      lastName: "Martin"
    },
    {
      role: "voyageur",
      email: "client2@test.com",
      passwordHash: "$2a$10$123456789012345678901u",
      firstName: "Sarah",
      lastName: "Dupont"
    }
  ]);

  console.log("Users créés :", users.length);

  // PRESTATIONS
  const prestations = await Prestation.insertMany([
    {
      title: "Ménage complet",
      description: "Nettoyage complet de l'appartement",
      category: "menage",
      priceHT: 40,
      priceTTC: 48,
      commissionPJ: 10
    },
    {
      title: "Check-in Airbnb",
      description: "Accueil des voyageurs + remise des clés",
      category: "checkin",
      priceHT: 25,
      priceTTC: 30,
      commissionPJ: 8
    },
    {
      title: "Transport aéroport",
      description: "Navette privée vers CDG ou Orly",
      category: "transport",
      priceHT: 60,
      priceTTC: 72,
      commissionPJ: 12
    }
  ]);

  console.log("Prestations créées :", prestations.length);

  // PRESTATAIRES
  const prestataires = await Prestataire.insertMany([
    {
      name: "Jean Nettoyage",
      email: "jean@clean.com",
      phone: "0601020304",
      validated: true,
      services: [prestations[0]._id],
      tarifs: [{ prestationId: prestations[0]._id, priceHT: 35 }]
    },
    {
      name: "Clara Checkin",
      email: "clara@checkin.com",
      phone: "0605060708",
      validated: true,
      services: [prestations[1]._id],
      tarifs: [{ prestationId: prestations[1]._id, priceHT: 22 }]
    }
  ]);

  console.log("Prestataires créés :", prestataires.length);

  // COMMANDES
  const commandes = await Commande.insertMany([
    {
      userId: users[1]._id,
      prestationId: prestations[0]._id,
      prestataireId: prestataires[0]._id,
      montantHT: prestations[0].priceHT,
      montantTTC: prestations[0].priceTTC,
      commissionPJ: prestations[0].commissionPJ,
      status: "confirmee"
    },
    {
      userId: users[2]._id,
      prestationId: prestations[1]._id,
      prestataireId: prestataires[1]._id,
      montantHT: prestations[1].priceHT,
      montantTTC: prestations[1].priceTTC,
      commissionPJ: prestations[1].commissionPJ,
      status: "terminee"
    }
  ]);

  console.log("Commandes créées :", commandes.length);

  console.log("SEED TERMINÉ !");
  process.exit();
}

seed();

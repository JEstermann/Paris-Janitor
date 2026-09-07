require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const Prestation = require("./models/Prestation");
const Prestataire = require("./models/Prestataire");
const Commande = require("./models/Commande");
const Facture = require("./models/Facture");
const Message = require("./models/Message");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connexion MongoDB OK");

  // Nettoyage
  await User.deleteMany();
  await Prestation.deleteMany();
  await Prestataire.deleteMany();
  await Commande.deleteMany();
  await Facture.deleteMany();
  await Message.deleteMany();

  console.log("Collections vidées");

  // Hash des mots de passe
  const adminPwd = await bcrypt.hash("admin123", 10);
  const clientPwd = await bcrypt.hash("client123", 10);
  const prestaPwd = await bcrypt.hash("presta123", 10);

  // USERS — 1 admin, 3 voyageurs, 4 prestataires
  const users = await User.insertMany([
    // Admin
    {
      role: "admin",
      email: "admin@pj.com",
      passwordHash: adminPwd,
      firstName: "Admin",
      lastName: "ParisJanitor",
      isSuperAdmin: true
    },
    // Voyageurs
    {
      role: "voyageur",
      email: "client1@test.com",
      passwordHash: clientPwd,
      firstName: "Julien",
      lastName: "Martin"
    },
    {
      role: "voyageur",
      email: "client2@test.com",
      passwordHash: clientPwd,
      firstName: "Sarah",
      lastName: "Dupont"
    },
    {
      role: "voyageur",
      email: "client3@test.com",
      passwordHash: clientPwd,
      firstName: "Mehdi",
      lastName: "Leroy",
      vipSubscription: { type: "explorator", active: true, startDate: new Date(), endDate: new Date(Date.now() + 30*24*60*60*1000) }
    },
    // Prestataires (comptes utilisateurs pour pouvoir se connecter)
    {
      role: "prestataire",
      email: "jean@clean.com",
      passwordHash: prestaPwd,
      firstName: "Jean",
      lastName: "Nettoyage",
      phone: "0601020304"
    },
    {
      role: "prestataire",
      email: "clara@checkin.com",
      passwordHash: prestaPwd,
      firstName: "Clara",
      lastName: "Checkin",
      phone: "0605060708"
    },
    {
      role: "prestataire",
      email: "marc@transport.com",
      passwordHash: prestaPwd,
      firstName: "Marc",
      lastName: "Transport",
      phone: "0610111213"
    },
    {
      role: "prestataire",
      email: "lina@multi.com",
      passwordHash: prestaPwd,
      firstName: "Lina",
      lastName: "MultiService",
      phone: "0613141516"
    }
  ]);

  console.log("Users créés :", users.length);

  // PRESTATIONS — 6 prestations
  const prestations = await Prestation.insertMany([
    {
      title: "Ménage complet",
      description: "Nettoyage complet d'un appartement jusqu'à 50m² (sol, cuisine, salle de bain, chambres)",
      category: "menage",
      priceHT: 40,
      priceTTC: 48,
      commissionPJ: 10
    },
    {
      title: "Ménage studio",
      description: "Nettoyage rapide d'un studio ou petit appartement",
      category: "menage",
      priceHT: 25,
      priceTTC: 30,
      commissionPJ: 8
    },
    {
      title: "Check-in Airbnb",
      description: "Accueil des voyageurs, remise des clés et présentation du logement",
      category: "checkin",
      priceHT: 25,
      priceTTC: 30,
      commissionPJ: 8
    },
    {
      title: "Check-out Airbnb",
      description: "État des lieux de départ, récupération des clés, vérification",
      category: "checkin",
      priceHT: 20,
      priceTTC: 24,
      commissionPJ: 6
    },
    {
      title: "Transport aéroport CDG",
      description: "Navette privée vers l'aéroport Charles de Gaulle",
      category: "transport",
      priceHT: 60,
      priceTTC: 72,
      commissionPJ: 12
    },
    {
      title: "Transport aéroport Orly",
      description: "Navette privée vers l'aéroport d'Orly",
      category: "transport",
      priceHT: 55,
      priceTTC: 66,
      commissionPJ: 12
    },
    {
      title: "Shooting photo",
      description: "Photos professionnelles de votre logement pour vos annonces",
      category: "photo",
      priceHT: 80,
      priceTTC: 96,
      commissionPJ: 15
    }
  ]);

  console.log("Prestations créées :", prestations.length);

  // PRESTATAIRES — plusieurs fiches prestataires
  const prestataires = await Prestataire.insertMany([
    {
      name: "Jean Nettoyage",
      email: "jean@clean.com",
      phone: "0601020304",
      userId: users[4]._id,
      validated: true,
      habilitations: ["Certifié pro du nettoyage", "Assurance multirisque"],
      services: [prestations[0]._id, prestations[1]._id],
      tarifs: [
        { prestationId: prestations[0]._id, priceHT: 35 },
        { prestationId: prestations[1]._id, priceHT: 22 }
      ],
      noteMoyenne: 4.8
    },
    {
      name: "Clara Checkin",
      email: "clara@checkin.com",
      phone: "0605060708",
      userId: users[5]._id,
      validated: true,
      habilitations: ["Bilingue FR/EN", "Ponctualité garantie"],
      services: [prestations[2]._id, prestations[3]._id],
      tarifs: [
        { prestationId: prestations[2]._id, priceHT: 22 },
        { prestationId: prestations[3]._id, priceHT: 18 }
      ],
      noteMoyenne: 4.9
    },
    {
      name: "Marc Transport",
      email: "marc@transport.com",
      phone: "0610111213",
      userId: users[6]._id,
      validated: true,
      habilitations: ["Permis VTC", "Véhicule berline"],
      services: [prestations[4]._id, prestations[5]._id],
      tarifs: [
        { prestationId: prestations[4]._id, priceHT: 55 },
        { prestationId: prestations[5]._id, priceHT: 50 }
      ],
      noteMoyenne: 4.7
    },
    {
      name: "Lina MultiService",
      email: "lina@multi.com",
      phone: "0613141516",
      userId: users[7]._id,
      validated: true,
      habilitations: ["Photographe pro", "Polyvalente", "Bilingue FR/ES"],
      services: [prestations[0]._id, prestations[2]._id, prestations[6]._id],
      tarifs: [
        { prestationId: prestations[0]._id, priceHT: 38 },
        { prestationId: prestations[2]._id, priceHT: 25 },
        { prestationId: prestations[6]._id, priceHT: 70 }
      ],
      noteMoyenne: 5.0
    },
    // Prestataire non encore validé (pour tester la validation admin)
    {
      name: "Pierre Newcomer",
      email: "pierre@new.com",
      phone: "0617181920",
      validated: false,
      services: [prestations[1]._id],
      tarifs: [{ prestationId: prestations[1]._id, priceHT: 20 }],
      noteMoyenne: 0
    }
  ]);

  console.log("Prestataires créés :", prestataires.length);

  // COMMANDES — plusieurs statuts différents pour tester
  const commandes = await Commande.insertMany([
    // Commande en attente de confirmation
    {
      userId: users[1]._id,
      prestationId: prestations[0]._id,
      montantHT: prestations[0].priceHT,
      montantTTC: prestations[0].priceTTC,
      commissionPJ: prestations[0].commissionPJ,
      status: "demande"
    },
    // Commande confirmée (à payer)
    {
      userId: users[1]._id,
      prestationId: prestations[2]._id,
      prestataireId: prestataires[1]._id,
      montantHT: prestations[2].priceHT,
      montantTTC: prestations[2].priceTTC,
      commissionPJ: prestations[2].commissionPJ,
      status: "confirmee"
    },
    // Commande payée
    {
      userId: users[2]._id,
      prestationId: prestations[4]._id,
      prestataireId: prestataires[2]._id,
      montantHT: prestations[4].priceHT,
      montantTTC: prestations[4].priceTTC,
      commissionPJ: prestations[4].commissionPJ,
      status: "payee",
      paymentStatus: "paid",
      stripePaymentId: "pi_test_seed_paid_001"
    },
    // Commande en cours d'intervention
    {
      userId: users[3]._id,
      prestationId: prestations[0]._id,
      prestataireId: prestataires[0]._id,
      montantHT: prestations[0].priceHT,
      montantTTC: prestations[0].priceTTC,
      commissionPJ: prestations[0].commissionPJ,
      status: "en_cours",
      paymentStatus: "paid",
      stripePaymentId: "pi_test_seed_en_cours_002"
    },
    // Commande terminée avec évaluation
    {
      userId: users[1]._id,
      prestationId: prestations[1]._id,
      prestataireId: prestataires[0]._id,
      montantHT: prestations[1].priceHT,
      montantTTC: prestations[1].priceTTC,
      commissionPJ: prestations[1].commissionPJ,
      status: "terminee",
      paymentStatus: "paid",
      stripePaymentId: "pi_test_seed_terminee_003",
      evaluation: { note: 5, commentaire: "Excellent service !", date: new Date() }
    },
    // Commande terminée SANS évaluation (à évaluer)
    {
      userId: users[2]._id,
      prestationId: prestations[3]._id,
      prestataireId: prestataires[1]._id,
      montantHT: prestations[3].priceHT,
      montantTTC: prestations[3].priceTTC,
      commissionPJ: prestations[3].commissionPJ,
      status: "terminee",
      paymentStatus: "paid",
      stripePaymentId: "pi_test_seed_terminee_004"
    },
    // Commande annulée
    {
      userId: users[2]._id,
      prestationId: prestations[6]._id,
      montantHT: prestations[6].priceHT,
      montantTTC: prestations[6].priceTTC,
      commissionPJ: prestations[6].commissionPJ,
      status: "annulee"
    }
  ]);

  console.log("Commandes créées :", commandes.length);

  // FACTURES pour les commandes payées
  const facturePDF = (id) => `facture-${id}.pdf`;
  const factures = await Facture.insertMany([
    {
      commandeId: commandes[2]._id,
      destinataireId: commandes[2].userId,
      montantHT: commandes[2].montantHT,
      montantTTC: commandes[2].montantTTC,
      TVA: commandes[2].montantTTC - commandes[2].montantHT,
      commissionPJ: commandes[2].commissionPJ,
      pdfPath: facturePDF(commandes[2]._id),
      statutPaiement: "paid"
    },
    {
      commandeId: commandes[3]._id,
      destinataireId: commandes[3].userId,
      montantHT: commandes[3].montantHT,
      montantTTC: commandes[3].montantTTC,
      TVA: commandes[3].montantTTC - commandes[3].montantHT,
      commissionPJ: commandes[3].commissionPJ,
      pdfPath: facturePDF(commandes[3]._id),
      statutPaiement: "paid"
    },
    {
      commandeId: commandes[4]._id,
      destinataireId: commandes[4].userId,
      montantHT: commandes[4].montantHT,
      montantTTC: commandes[4].montantTTC,
      TVA: commandes[4].montantTTC - commandes[4].montantHT,
      commissionPJ: commandes[4].commissionPJ,
      pdfPath: facturePDF(commandes[4]._id),
      statutPaiement: "paid"
    }
  ]);

  // Lier les factures aux commandes
  for (let i = 0; i < factures.length; i++) {
    commandes[i + 2].factureId = factures[i]._id;
  }
  await Commande.bulkSave(commandes);

  console.log("Factures créées :", factures.length);

  // MESSAGES — plusieurs conversations de test
  // Commande 0 (demande) - pas encore de messages (client julien + jean)
  // Commande 1 (confirmee) - conversation entre julien et clara
  // Commande 2 (payee) - conversation entre sarah et marc
  // Commande 3 (en_cours) - conversation entre mehdi et jean
  // Commande 4 (terminee) - conversation entre julien et jean

  // Pour la commande 1 (julien/clara checkin)
  // users[1] = julien, users[5] = clara (prestataire de la fiche 1)
  // prestataire pour commande 1 = prestataires[1] (clara), userId = users[5]

  // Pour la commande 2 (sarah/marc transport)
  // users[2] = sarah, prestataire = prestataires[2] (marc), userId = users[6]

  // Pour la commande 3 (mehdi/jean menage)
  // users[3] = mehdi, prestataire = prestataires[0] (jean), userId = users[4]

  // Pour la commande 4 (julien/jean menage)
  // users[1] = julien, prestataire = prestataires[0] (jean), userId = users[4]

  const messages = await Message.insertMany([
    // Conversation 1 : julien <-> clara (commande 1 - checkin)
    {
      commandeId: commandes[1]._id,
      senderId: users[1]._id, // julien
      receiverId: users[5]._id, // clara
      content: "Bonjour, à quelle heure pouvez-vous passer pour le check-in ?",
      isRead: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
    },
    {
      commandeId: commandes[1]._id,
      senderId: users[5]._id, // clara
      receiverId: users[1]._id, // julien
      content: "Bonjour Julien, je peux passer entre 14h et 16h, ça vous convient ?",
      isRead: true,
      createdAt: new Date(Date.now() - 23 * 60 * 60 * 1000)
    },
    {
      commandeId: commandes[1]._id,
      senderId: users[1]._id, // julien
      receiverId: users[5]._id,
      content: "Parfait, 15h sera idéal. Merci !",
      isRead: true,
      createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000)
    },
    {
      commandeId: commandes[1]._id,
      senderId: users[5]._id, // clara
      receiverId: users[1]._id,
      content: "C'est noté, à demain 15h !",
      isRead: false,
      createdAt: new Date(Date.now() - 21 * 60 * 60 * 1000)
    },

    // Conversation 2 : sarah <-> marc (commande 2 - transport)
    {
      commandeId: commandes[2]._id,
      senderId: users[2]._id, // sarah
      receiverId: users[6]._id, // marc
      content: "Bonjour, j'ai réservé pour CDG demain matin",
      isRead: true,
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
    },
    {
      commandeId: commandes[2]._id,
      senderId: users[6]._id, // marc
      receiverId: users[2]._id,
      content: "Bonjour Sarah, quel est votre numéro de vol ?",
      isRead: true,
      createdAt: new Date(Date.now() - 11 * 60 * 60 * 1000)
    },
    {
      commandeId: commandes[2]._id,
      senderId: users[2]._id,
      receiverId: users[6]._id,
      content: "AF1234, arrivée à 10h30",
      isRead: true,
      createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000)
    },
    {
      commandeId: commandes[2]._id,
      senderId: users[6]._id,
      receiverId: users[2]._id,
      content: "Parfait, je serai en bas de chez vous à 8h. Vous aurez une berline noire.",
      isRead: false,
      createdAt: new Date(Date.now() - 9 * 60 * 60 * 1000)
    },

    // Conversation 3 : mehdi <-> jean (commande 3 - menage en_cours)
    {
      commandeId: commandes[3]._id,
      senderId: users[3]._id, // mehdi
      receiverId: users[4]._id, // jean
      content: "Bonjour Jean, l'appartement est au 3ème étage sans ascenseur",
      isRead: true,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
    },
    {
      commandeId: commandes[3]._id,
      senderId: users[4]._id, // jean
      receiverId: users[3]._id,
      content: "Pas de souci, je commence dans 30 minutes",
      isRead: true,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
    },
    {
      commandeId: commandes[3]._id,
      senderId: users[3]._id,
      receiverId: users[4]._id,
      content: "Top, les produits sont sous l'évier. Merci !",
      isRead: false,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
    },

    // Conversation 4 : julien <-> jean (commande 4 - terminee)
    {
      commandeId: commandes[4]._id,
      senderId: users[1]._id, // julien
      receiverId: users[4]._id, // jean
      content: "Bonjour, vous pouvez passer demain matin ?",
      isRead: true,
      createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000)
    },
    {
      commandeId: commandes[4]._id,
      senderId: users[4]._id,
      receiverId: users[1]._id,
      content: "Bonjour, oui 10h c'est bon pour vous ?",
      isRead: true,
      createdAt: new Date(Date.now() - 71 * 60 * 60 * 1000)
    },
    {
      commandeId: commandes[4]._id,
      senderId: users[1]._id,
      receiverId: users[4]._id,
      content: "Parfait, à demain !",
      isRead: true,
      createdAt: new Date(Date.now() - 70 * 60 * 60 * 1000)
    }
  ]);

  console.log("Messages créés :", messages.length);

  console.log("\n========================================");
  console.log("SEED TERMINÉ !");
  console.log("========================================");
  console.log("\nComptes de test :");
  console.log("  Admin      : admin@pj.com / admin123");
  console.log("  Voyageurs  : client1@test.com, client2@test.com, client3@test.com / client123");
  console.log("  Prestataires : jean@clean.com, clara@checkin.com, marc@transport.com, lina@multi.com / presta123");
  console.log("\nConversations de test :");
  console.log("  - Julien (client1) + Jean (jean@clean.com) : commande terminée avec messages");
  console.log("  - Julien (client1) + Clara (clara@checkin.com) : commande confirmée");
  console.log("  - Sarah (client2) + Marc (marc@transport.com) : commande payée");
  console.log("  - Mehdi (client3) + Jean (jean@clean.com) : commande en cours");
  console.log("========================================\n");

  process.exit();
}

seed();

# Paris Janitor — Projet Annuel (Rattrapage)

Paris Janitor (PJ) est une plateforme de conciergerie immobilière permettant aux bailleurs, voyageurs et prestataires de gérer l’ensemble des services liés à la location saisonnière (type AirBnB).  
L’objectif du projet est de développer une application complète composée d’un **frontend React**, d’un **backend Node.js**, d’une **base de données NoSQL**, d’un **système de stockage**, et d’une **mise en production**.

---

## Présentation générale

Paris Janitor propose :
- Gestion des réservations
- Check-in / Check-out
- Nettoyage et entretien du logement
- Publication d’annonces avec photos
- Service client 24/7
- Optimisation des tarifs
- Fourniture de linge
- Petits travaux (plomberie, mobilier, ampoules…)
- Transport vers/depuis l’aéroport

Tarification :
- 20 % du prix de la nuitée
- 100 € d’abonnement annuel
- Frais fixes et logistiques supplémentaires

Prestataires :
- Chauffeurs, agents d’entretien, livreurs, blanchisseurs, photographes…

---

## Fonctionnalités de l’application

L’application comporte **3 espaces principaux** :

### 1. Espace Voyageurs
- Catalogue de services
- Réservation de prestations
- Suivi des interventions
- Messages avec le prestataire
- Évaluation des prestataires
- Paiements + factures
- Abonnements VIP (réductions, prestations offertes, accès prioritaire)

### 2. Espace Prestataires
- Début et fin de l'intervention
- Messages avec le Voyageur

### 3. Espace Administration
- Gestion des voyageurs, prestataires
- Gestion des réservations et prestations
- Dashboard
- Modération du catalogue
- Factures
- Gestion des prestations disponibles

---

## Technologies utilisées

### Backend
- **Node.js / Express**
- **MongoDB** (NoSQL)
- **MinIO** (stockage de documents)
- **Stripe** (paiements + webhooks)
- **JWT** (authentification)
- **Swagger** (documentation API)
- **Docker / Docker Compose**

### Frontend
- **Vite.js**
- **React.js**
- **React Router**

### Infrastructure
- **Docker Compose**
- **MongoDB + MinIO + Backend + Frontend**
- **Stripe CLI** pour les webhooks
- **Déploiement** (Render, Vercel)

---

## Travail réalisé

### Étudiant seul
- Partie **Voyageurs**
- Partie **Administration**

### Groupe
- **Voyageurs, Prestataires, Administration**

### Obligations techniques
- Frontend React pour chaque espace
- Backend Node.js complet
- Paiements Stripe
- Génération automatique des factures PDF
- Stockage NoSQL (MongoDB + MinIO)
- Mise en production de l’application

---

### Formules VIP
- **Free** : gratuit  
- **Bag Packer** : 9,90€/mois ou 113€/an  
- **Explorator** : 19€/mois ou 220€/an  

Avantages : réduction 5 %, prestations offertes, accès prioritaire, bonus de renouvellement…

### Prestations annexes
- Photos professionnelles : 180 €  
- Conseils décoration : 50 €  
- Plan 3D : 60 €+  
- Shopping liste : 50 €+  
- Suivi de chantier : 100 €+
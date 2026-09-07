// Polyfills pour la compatibilité Node.js 17+
// Ce fichier doit être chargé AVANT tout autre module

const nodeCrypto = require("crypto");

// Forcer crypto en global
if (typeof globalThis.crypto === "undefined") {
  globalThis.crypto = nodeCrypto;
}

// Forcer crypto en variable globale (pour pdfkit)
if (typeof global.crypto === "undefined") {
  global.crypto = nodeCrypto;
}

// Certaines versions de mongodb utilisent crypto.randomUUID
// S'assurer que randomUUID est disponible sur l'objet crypto
if (typeof globalThis.crypto.randomUUID !== "function") {
  globalThis.crypto.randomUUID = nodeCrypto.randomUUID.bind(nodeCrypto);
}

if (typeof globalThis.crypto.randomBytes !== "function") {
  globalThis.crypto.randomBytes = nodeCrypto.randomBytes.bind(nodeCrypto);
}

module.exports = nodeCrypto;

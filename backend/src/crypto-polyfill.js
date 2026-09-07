// Préchargé avant tout autre module via --require dans NODE_OPTIONS
// Force crypto dans le scope global pour que mongodb (et autres) puissent y accéder
// sans faire require('crypto') directement

const nodeCrypto = require('crypto');

// Expose crypto as a global variable for libraries that reference it directly
// (e.g., mongodb/lib/utils.js does: crypto.randomBytes(16))
globalThis.crypto = nodeCrypto;
global.crypto = nodeCrypto;

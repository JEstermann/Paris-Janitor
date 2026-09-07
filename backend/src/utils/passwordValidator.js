// Validateur de mot de passe selon les règles de sécurité
// - Utilisateurs : minimum 12 caractères
// - Administrateurs : minimum 16 caractères
// - Obligatoire : majuscules, minuscules, chiffres, caractères spéciaux
// - Aucun mot simple, aucune suite logique, aucune information personnelle

const COMMON_PASSWORDS = new Set([
  "password", "123456", "123456789", "12345678", "qwerty", "azerty",
  "admin", "letmein", "welcome", "monkey", "password1", "1234567890",
  "123123", "111111", "000000", "abc123", "iloveyou", "sunshine", "football",
  "admin123", "superadmin", "root", "toor", "changeme", "secret"
]);

const SEQUENTIAL_PATTERNS = [
  "0123456789", "1234567890", "9876543210", "0987654321",
  "abcdefghijklmnopqrstuvwxyz", "zyxwvutsrqponmlkjihgfedcba",
  "qwertyuiop", "asdfghjkl", "zxcvbnm", "qazwsx", "qwerty"
];

const PERSONAL_INFO_PATTERNS = (email, firstName, lastName) => {
  const patterns = [];
  if (email) {
    const local = email.split("@")[0].toLowerCase();
    patterns.push(local);
    patterns.push(local.split(".").join(""));
    patterns.push(local.split("_").join(""));
    patterns.push(local.split("-").join(""));
  }
  if (firstName) patterns.push(firstName.toLowerCase());
  if (lastName) patterns.push(lastName.toLowerCase());
  if (firstName && lastName) patterns.push((firstName + lastName).toLowerCase());
  if (firstName && lastName) patterns.push((lastName + firstName).toLowerCase());
  return patterns;
};

/**
 * Valide un mot de passe selon les règles de sécurité
 * @param {string} password - Le mot de passe à valider
 * @param {object} options - Options de validation
 * @param {number} options.minLength - Longueur minimale (défaut: 12)
 * @param {boolean} options.requireUpper - Exiger une majuscule (défaut: true)
 * @param {boolean} options.requireLower - Exiger une minuscule (défaut: true)
 * @param {boolean} options.requireNumber - Exiger un chiffre (défaut: true)
 * @param {boolean} options.requireSpecial - Exiger un caractère spécial (défaut: true)
 * @param {string} options.email - Email de l'utilisateur (pour vérifier l'info personnelle)
 * @param {string} options.firstName - Prénom de l'utilisateur
 * @param {string} options.lastName - Nom de l'utilisateur
 * @returns {{valid: boolean, errors: string[]}}
 */
function validatePassword(password, options = {}) {
  const {
    minLength = 12,
    requireUpper = true,
    requireLower = true,
    requireNumber = true,
    requireSpecial = true,
    email,
    firstName,
    lastName
  } = options;

  const errors = [];

  if (!password || typeof password !== "string") {
    return { valid: false, errors: ["Le mot de passe est requis"] };
  }

  // Longueur minimale
  if (password.length < minLength) {
    errors.push(`Le mot de passe doit contenir au moins ${minLength} caractères`);
  }

  // Majuscule
  if (requireUpper && !/[A-Z]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une majuscule");
  }

  // Minuscule
  if (requireLower && !/[a-z]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une minuscule");
  }

  // Chiffre
  if (requireNumber && !/[0-9]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins un chiffre");
  }

  // Caractère spécial
  if (requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins un caractère spécial");
  }

  // Mots de passe courants
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push("Ce mot de passe est trop courant, veuillez en choisir un autre");
  }

  // Séquences logiques (ex: 123456, abcdef)
  const lowerPw = password.toLowerCase();
  for (const seq of SEQUENTIAL_PATTERNS) {
    if (lowerPw.includes(seq)) {
      errors.push("Le mot de passe contient une séquence logique, veuillez en choisir un autre");
      break;
    }
  }

  // Informations personnelles
  const personalPatterns = PERSONAL_INFO_PATTERNS(email, firstName, lastName);
  for (const pattern of personalPatterns) {
    if (pattern && pattern.length >= 3 && lowerPw.includes(pattern)) {
      errors.push("Le mot de passe ne doit pas contenir des informations personnelles (nom, email)");
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Récupère la longueur minimale selon le rôle
 * @param {string} role - Le rôle de l'utilisateur
 * @returns {number}
 */
function getMinLengthForRole(role) {
  if (role === "admin" || role === "super_admin") {
    return 16;
  }
  return 12;
}

module.exports = { validatePassword, getMinLengthForRole };